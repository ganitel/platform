"""
Ganitel V2 Backend - Login User Use Case
"""
from datetime import datetime, timedelta
import time
from typing import Optional
from uuid import uuid4
from jose import jwt
import redis

from app.domain.entities.user import User, UserStatus
from app.domain.repositories.user_repository import IUserRepository
from app.config import get_settings
from app.exceptions import ValidationError, UserNotFoundError, AuthorizationError

settings = get_settings()
pwd_context = None
DUMMY_PASSWORD_HASH = "$2b$12$zR/pJ0d6fV7GQogfW1VxE.rmy9jre7hN3Qj0x2I8wYh6w8d6l0w2K"
MIN_AUTH_FAILURE_DURATION_SECONDS = 0.50

def get_pwd_context():
    """Lazy import of password context"""
    global pwd_context
    if pwd_context is None:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context


def _enforce_min_auth_failure_duration(start_time: float) -> None:
    """Ensure authentication failures take at least a minimum time."""
    elapsed = time.perf_counter() - start_time
    remaining = MIN_AUTH_FAILURE_DURATION_SECONDS - elapsed
    if remaining > 0:
        time.sleep(remaining)


class TokenData:
    """Token data structure"""
    def __init__(self, access_token: str, refresh_token: str, token_type: str = "bearer"):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.token_type = token_type


class LoginUserUseCase:
    """
    Use case for user login
    Handles authentication and JWT token generation
    """
    
    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository
    
    def execute(
        self,
        identifier: str,
        password: str,
        redis_client: Optional[redis.Redis] = None
    ) -> TokenData:
        """
        Authenticate user and generate JWT tokens
        
        Args:
            identifier: Email or phone number
            password: User password
            redis_client: Redis client for storing refresh tokens
            
        Returns:
            TokenData: Access token and refresh token
            
        Raises:
            ValidationError: If validation fails
            UserNotFoundError: If user not found
            AuthorizationError: If authentication fails or user is inactive/suspended
        """
        if not identifier or not identifier.strip():
            raise ValidationError("Identifier (email or phone) is required")
        
        if not password:
            raise ValidationError("Password is required")
        
        identifier = identifier.strip()
        auth_start_time = time.perf_counter()
        
        # Find user by email or phone
        user = None
        if "@" in identifier:
            user = self.user_repository.get_by_email(identifier.lower())
        else:
            user = self.user_repository.get_by_phone(identifier)
        
        if not user:
            # Run a dummy hash verification to reduce timing differences
            # between existing and non-existing identifiers.
            pwd_ctx = get_pwd_context()
            pwd_ctx.verify(password, DUMMY_PASSWORD_HASH)
            _enforce_min_auth_failure_duration(auth_start_time)
            raise UserNotFoundError("Invalid credentials")
        
        # Check if user is deleted
        if user.deleted_at is not None:
            _enforce_min_auth_failure_duration(auth_start_time)
            raise AuthorizationError("Account has been deleted")
        
        # Check user status
        if user.status == UserStatus.SUSPENDED.value:
            _enforce_min_auth_failure_duration(auth_start_time)
            raise AuthorizationError("Account is suspended. Please contact support")
        
        if user.status == UserStatus.INACTIVE.value:
            _enforce_min_auth_failure_duration(auth_start_time)
            raise AuthorizationError("Account is inactive. Please contact support")
        
        # Allow PENDING_VERIFICATION users to login (they can verify later)
        # Only block SUSPENDED and INACTIVE users
        
        if not user.is_active:
            _enforce_min_auth_failure_duration(auth_start_time)
            raise AuthorizationError("Account is not active")
        
        # Verify password
        if not user.hashed_password:
            _enforce_min_auth_failure_duration(auth_start_time)
            raise AuthorizationError("Password not set for this account")
        
        pwd_ctx = get_pwd_context()
        if not pwd_ctx.verify(password, user.hashed_password):
            _enforce_min_auth_failure_duration(auth_start_time)
            raise AuthorizationError("Invalid credentials")
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        self.user_repository.update(user)
        
        # Generate tokens
        access_token = self._create_access_token(user.id)
        refresh_token = self._create_refresh_token(user.id)
        
        # Store refresh token in Redis if available
        if redis_client:
            refresh_key = f"refresh_token:{user.id}"
            # Store for refresh token expiry days
            redis_client.setex(
                refresh_key,
                settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                refresh_token
            )
        
        return TokenData(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
    
    def refresh_access_token(
        self,
        refresh_token: str,
        redis_client: Optional[redis.Redis] = None
    ) -> TokenData:
        """
        Refresh access token using refresh token
        
        Args:
            refresh_token: Refresh token
            redis_client: Redis client for validating refresh tokens
            
        Returns:
            TokenData: New access token and refresh token
            
        Raises:
            AuthorizationError: If refresh token is invalid
        """
        try:
            # Decode refresh token
            payload = jwt.decode(
                refresh_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                issuer=settings.JWT_ISSUER,
                audience=settings.JWT_AUDIENCE,
            )
            
            user_id = payload.get("sub")
            token_type = payload.get("type")
            
            if token_type != "refresh" or not user_id:
                raise AuthorizationError("Invalid refresh token")
            
            # Verify token in Redis if available
            if redis_client:
                stored_token = redis_client.get(f"refresh_token:{user_id}")
                if isinstance(stored_token, bytes):
                    stored_token = stored_token.decode()
                if stored_token != refresh_token:
                    raise AuthorizationError("Refresh token has been revoked")
            
            # Get user
            from uuid import UUID
            user = self.user_repository.get_by_id(UUID(user_id))
            if not user or not user.is_active:
                raise AuthorizationError("User not found or inactive")
            
            # Generate new tokens
            new_access_token = self._create_access_token(user.id)
            new_refresh_token = self._create_refresh_token(user.id)
            
            # Update refresh token in Redis
            if redis_client:
                refresh_key = f"refresh_token:{user.id}"
                redis_client.setex(
                    refresh_key,
                    settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                    new_refresh_token
                )
            
            return TokenData(
                access_token=new_access_token,
                refresh_token=new_refresh_token,
                token_type="bearer"
            )
            
        except jwt.ExpiredSignatureError:
            raise AuthorizationError("Refresh token has expired")
        except jwt.JWTError:
            raise AuthorizationError("Invalid refresh token")
    
    def _create_access_token(self, user_id) -> str:
        """Create JWT access token"""
        now = datetime.utcnow()
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user_id),
            "type": "access",
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "exp": expire,
            "iat": now,
            "jti": str(uuid4())
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    def _create_refresh_token(self, user_id) -> str:
        """Create JWT refresh token"""
        now = datetime.utcnow()
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "sub": str(user_id),
            "type": "refresh",
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "exp": expire,
            "iat": now,
            "jti": str(uuid4())
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

