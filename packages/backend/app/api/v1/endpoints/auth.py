"""
Ganitel V2 Backend - Authentication Endpoints
"""
import logging
from uuid import UUID, uuid4
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import redis

from app.database import get_db
from app.dependencies import get_redis, get_current_active_user
from app.core.oauth_exchange import create_oauth_exchange_code, consume_oauth_exchange_code
from app.infrastructure.repositories.user_repository import UserRepository
from app.application.use_cases.auth import (
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyResetTokenUseCase,
    OAuthLoginUseCase
)
from app.infrastructure.external_apis.oauth_client import GoogleOAuthClient, FacebookOAuthClient
from app.domain.entities.user import User
from app.core.ratelimit import limiter
from app.api.v1.schemas.user_schemas import (
    UserCreateRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
    MessageResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyResetTokenRequest,
    OAuthCodeExchangeRequest,
)
from app.config import get_settings
from app.exceptions import GanitelException, ValidationError, ConflictError, UserNotFoundError, AuthorizationError
from app.utils.security import create_access_token

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


def _raise_unhandled_auth_error(
    request: Request,
    public_message: str,
    route: str,
    context: Optional[dict] = None,
) -> None:
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    extra_context = {
        "request_id": request_id,
        "route": route,
    }
    if context:
        extra_context.update(context)

    logger.exception(
        "Unhandled auth endpoint error",
        extra=extra_context,
    )
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"{public_message} (ref: {request_id})"
    )


def _build_oauth_error_redirect(provider: str, request_id: str) -> RedirectResponse:
    redirect_url = (
        f"{settings.FRONTEND_URL}/auth/callback"
        f"?error=oauth_callback_failed&provider={provider}&ref={request_id}"
    )
    return RedirectResponse(url=redirect_url)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register_user(
    request: Request,
    user_data: UserCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    
    Supports registration for:
    - Travelers: Can register with email+password or phone
    - Providers: Can register with email+password or phone
    - Admins: Must be created via internal controlled process
    
    New users start with status: PENDING_VERIFICATION
    """
    try:
        user_repository = UserRepository(db)
        register_use_case = RegisterUserUseCase(user_repository)
        
        user = register_use_case.execute(
            email=user_data.email,
            phone=user_data.phone,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            user_type=user_data.user_type,
            country=user_data.country,
            city=user_data.city
        )
        
        return UserResponse(
            id=str(user.id),
            email=user.email,
            phone=user.phone,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,
            user_type=user.user_type,
            status=user.status,
            is_verified=user.is_verified,
            profile_picture=user.profile_picture,
            bio=user.bio,
            country=user.country,
            city=user.city,
            language=user.language,
            currency=user.currency,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except GanitelException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except Exception as e:
        _raise_unhandled_auth_error(
            request=request,
            public_message="Registration failed. Please try again.",
            route="/api/v1/auth/register",
            context={
                "email": user_data.email,
                "phone": user_data.phone,
                "user_type": user_data.user_type,
                "error_type": type(e).__name__,
            },
        )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login_for_access_token(
    request: Request,
    response: Response,
    user_credentials: UserLoginRequest,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    User login endpoint
    
    Authenticates user with email/phone and password.
    Returns JWT access token and refresh token.
    
    Refresh token is stored in HTTP-only cookie for security.
    """
    # Check for lockout
    lockout_key = f"lockout:{user_credentials.identifier}"
    lockout_count = redis_client.get(lockout_key)
    
    if lockout_count and int(lockout_count) >= 5:
        # Lockout for 15 minutes after 5 failures
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account locked due to multiple failed attempts. Please try again in 15 minutes."
        )

    try:
        user_repository = UserRepository(db)
        login_use_case = LoginUserUseCase(user_repository)
        
        token_data = login_use_case.execute(
            identifier=user_credentials.identifier,
            password=user_credentials.password,
            redis_client=redis_client
        )
        
        # Reset lockout on success
        redis_client.delete(lockout_key)

        # Set refresh token in HTTP-only cookie
        response.set_cookie(
            key="refresh_token",
            value=token_data.refresh_token,
            httponly=True,
            secure=not settings.DEBUG,  # HTTPS only in production
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
        
        return TokenResponse(
            access_token=token_data.access_token,
            token_type=token_data.token_type,
            refresh_token=token_data.refresh_token
        )
        
    except (ValidationError, UserNotFoundError, AuthorizationError) as e:
        # Increment failed attempt count
        redis_client.incrby(lockout_key, 1)
        redis_client.expire(lockout_key, 900)  # 15 minutes

        # Uniform error message to prevent enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or account locked"
        )
    except GanitelException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except Exception as e:
        _raise_unhandled_auth_error(
            request=request,
            public_message="Login failed. Please try again.",
            route="/api/v1/auth/login",
            context={
                "identifier": user_credentials.identifier,
                "error_type": type(e).__name__,
            },
        )


@router.post("/logout", response_model=MessageResponse)
async def logout_user(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_active_user),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Logout user endpoint
    
    Invalidates refresh token in Redis and removes cookie.
    """
    try:
        # Delete refresh token from Redis
        refresh_key = f"refresh_token:{current_user.id}"
        redis_client.delete(refresh_key)
        
        # Remove cookie
        response.delete_cookie(key="refresh_token")
        
        return MessageResponse(message="Successfully logged out")
        
    except Exception as e:
        _raise_unhandled_auth_error(
            request=request,
            public_message="Logout failed. Please try again.",
            route="/api/v1/auth/logout",
            context={
                "user_id": str(current_user.id),
                "error_type": type(e).__name__,
            },
        )


@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_access_token(
    request: Request,
    response: Response,
    refresh_request: Optional[RefreshTokenRequest] = None,
    refresh_token_query: Optional[str] = Query(default=None, alias="refresh_token"),
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Refresh access token endpoint
    
    Uses refresh token from cookie or request body to generate new tokens.
    """
    refresh_token = refresh_request.refresh_token if refresh_request else None
    if not refresh_token:
        refresh_token = refresh_token_query
    if not refresh_token:
        refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
    
    try:
        user_repository = UserRepository(db)
        refresh_use_case = RefreshTokenUseCase(user_repository)
        
        token_data = refresh_use_case.execute(
            refresh_token=refresh_token,
            redis_client=redis_client
        )
        
        # Update refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=token_data.refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
        
        return TokenResponse(
            access_token=token_data.access_token,
            token_type=token_data.token_type,
            refresh_token=token_data.refresh_token
        )
        
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        _raise_unhandled_auth_error(
            request=request,
            public_message="Token refresh failed. Please try again.",
            route="/api/v1/auth/refresh-token",
            context={
                "error_type": type(e).__name__,
            },
        )


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    request_data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Forgot password endpoint
    
    Initiates password reset process by sending reset link to email/phone.
    """
    try:
        user_repository = UserRepository(db)
        forgot_password_use_case = ForgotPasswordUseCase(user_repository)
        
        result = forgot_password_use_case.execute(
            email=request_data.email,
            phone=request_data.phone
        )
        
        return MessageResponse(
            message=result.get("message", "Password reset link sent"),
            success=result.get("success", True)
        )
        
    except (ValidationError, UserNotFoundError, GanitelException):
        # Always return success message to prevent user enumeration
        return MessageResponse(
            message="If an account exists with this identifier, a password reset link has been sent.",
            success=True
        )
    except Exception as e:
        _raise_unhandled_auth_error(
            request=request,
            public_message="Failed to process password reset request.",
            route="/api/v1/auth/forgot-password",
            context={
                "error_type": type(e).__name__,
            },
        )


@router.get("/verify-reset-token/{token}", response_model=MessageResponse)
@limiter.limit("10/minute")
async def verify_reset_token(
    request: Request,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify reset token endpoint
    
    Verifies if a password reset token is valid and not expired.
    """
    try:
        user_repository = UserRepository(db)
        verify_token_use_case = VerifyResetTokenUseCase(user_repository)
        
        result = verify_token_use_case.execute(token)
        
        return MessageResponse(
            message=result.get("message", "Token is valid"),
            success=result.get("success", True)
        )
        
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        _raise_unhandled_auth_error(
            request=request,
            public_message="Failed to verify reset token.",
            route="/api/v1/auth/verify-reset-token",
            context={
                "error_type": type(e).__name__,
            },
        )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    request_data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password endpoint
    
    Resets user password using a valid reset token.
    """
    try:
        user_repository = UserRepository(db)
        reset_password_use_case = ResetPasswordUseCase(user_repository)
        
        result = reset_password_use_case.execute(
            token=request_data.token,
            new_password=request_data.new_password
        )
        
        return MessageResponse(
            message=result.get("message", "Password reset successfully"),
            success=result.get("success", True)
        )
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthorizationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except GanitelException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    except Exception as e:
        _raise_unhandled_auth_error(
            request=request,
            public_message="Failed to reset password.",
            route="/api/v1/auth/reset-password",
            context={
                "error_type": type(e).__name__,
            },
        )


# OAuth Endpoints
@router.get("/oauth/google/url")
@limiter.limit("10/minute")
async def get_google_oauth_url(request: Request):
    """
    Get Google OAuth authorization URL
    """
    try:
        url = await GoogleOAuthClient.get_authorization_url()
        return {"url": url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate OAuth URL"
        )


@router.get("/oauth/google/callback")
@limiter.limit("10/minute")
async def google_oauth_callback(
    request: Request,
    code: str,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Google OAuth callback endpoint
    """
    try:
        user_repository = UserRepository(db)
        oauth_use_case = OAuthLoginUseCase(user_repository)
        
        result = await oauth_use_case.execute_google(code)

        exchange_code = create_oauth_exchange_code(
            redis_client=redis_client,
            user_id=result["user"]["id"],
            provider="google",
        )

        redirect_url = (
            f"{settings.FRONTEND_URL}/auth/callback"
            f"?code={exchange_code}&provider=google"
        )
        return RedirectResponse(url=redirect_url)
        
    except ValidationError as e:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        logger.warning(
            "Google OAuth callback validation failed",
            extra={"request_id": request_id, "provider": "google", "error_type": type(e).__name__},
        )
        return _build_oauth_error_redirect(provider="google", request_id=request_id)
    except ConflictError as e:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        logger.warning(
            "Google OAuth callback conflict",
            extra={"request_id": request_id, "provider": "google", "error_type": type(e).__name__},
        )
        return _build_oauth_error_redirect(provider="google", request_id=request_id)
    except Exception as e:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        logger.exception(
            "Google OAuth callback unexpected error",
            extra={"request_id": request_id, "provider": "google", "error_type": type(e).__name__},
        )
        return _build_oauth_error_redirect(provider="google", request_id=request_id)


@router.get("/oauth/facebook/url")
@limiter.limit("10/minute")
async def get_facebook_oauth_url(request: Request):
    """
    Get Facebook OAuth authorization URL
    """
    try:
        url = await FacebookOAuthClient.get_authorization_url()
        return {"url": url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate OAuth URL"
        )


@router.get("/oauth/facebook/callback")
@limiter.limit("10/minute")
async def facebook_oauth_callback(
    request: Request,
    code: str,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Facebook OAuth callback endpoint
    """
    try:
        user_repository = UserRepository(db)
        oauth_use_case = OAuthLoginUseCase(user_repository)
        
        result = await oauth_use_case.execute_facebook(code)

        exchange_code = create_oauth_exchange_code(
            redis_client=redis_client,
            user_id=result["user"]["id"],
            provider="facebook",
        )

        redirect_url = (
            f"{settings.FRONTEND_URL}/auth/callback"
            f"?code={exchange_code}&provider=facebook"
        )
        return RedirectResponse(url=redirect_url)
        
    except ValidationError as e:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        logger.warning(
            "Facebook OAuth callback validation failed",
            extra={"request_id": request_id, "provider": "facebook", "error_type": type(e).__name__},
        )
        return _build_oauth_error_redirect(provider="facebook", request_id=request_id)
    except ConflictError as e:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        logger.warning(
            "Facebook OAuth callback conflict",
            extra={"request_id": request_id, "provider": "facebook", "error_type": type(e).__name__},
        )
        return _build_oauth_error_redirect(provider="facebook", request_id=request_id)
    except Exception as e:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        logger.exception(
            "Facebook OAuth callback unexpected error",
            extra={"request_id": request_id, "provider": "facebook", "error_type": type(e).__name__},
        )
        return _build_oauth_error_redirect(provider="facebook", request_id=request_id)


@router.post("/oauth/exchange-code", response_model=TokenResponse)
@limiter.limit("10/minute")
async def exchange_oauth_code(
    request: Request,
    exchange_request: OAuthCodeExchangeRequest,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Exchange a temporary OAuth code for an API access token.
    """
    try:
        payload = consume_oauth_exchange_code(redis_client, exchange_request.code)

        if payload.get("provider") != exchange_request.provider:
            raise AuthorizationError("Invalid OAuth exchange code")

        user_id = payload.get("user_id")
        user_repository = UserRepository(db)
        user = user_repository.get_by_id(UUID(user_id)) if user_id else None
        if user is None:
            raise AuthorizationError("Invalid OAuth exchange code")

        access_token = create_access_token(str(user.id))

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            refresh_token=None,
        )
    except (ValueError, AuthorizationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OAuth code",
        )
    except Exception as e:
        _raise_unhandled_auth_error(
            request=request,
            public_message="OAuth code exchange failed. Please try again.",
            route="/api/v1/auth/oauth/exchange-code",
            context={
                "provider": exchange_request.provider,
                "error_type": type(e).__name__,
            },
        )
