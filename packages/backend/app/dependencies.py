"""
Ganitel V2 Backend - FastAPI Dependencies
"""
from uuid import UUID

import redis
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.domain.entities.user import User, UserType
from app.infrastructure.repositories.user_repository import UserRepository

settings = get_settings()
# Use auto_error=False to handle missing tokens ourselves with proper 401 status
security = HTTPBearer(auto_error=False)

# Redis connection
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis() -> redis.Redis:
    """Get Redis client"""
    return redis_client

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security)
) -> str:
    """
    Extract user ID from JWT token
    """
    # Check if credentials are provided
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_type = payload.get("type")
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user
    """
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(UUID(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user

def get_current_provider(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get current user if they are a provider
    """
    if current_user.user_type != UserType.PROVIDER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Provider access required"
        )
    return current_user

def get_current_traveler(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get current user if they are a traveler
    """
    if current_user.user_type != UserType.TRAVELER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Traveler access required"
        )
    return current_user

def get_current_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get current user if they are an admin
    """
    if current_user.user_type != UserType.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Optional authentication (for public endpoints that can benefit from user context)
def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> User | None:
    """
    Get current user if authenticated, None otherwise
    """
    if credentials is None:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_type = payload.get("type")
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_repo = UserRepository(db)
        return user_repo.get_by_id(UUID(user_id))
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
