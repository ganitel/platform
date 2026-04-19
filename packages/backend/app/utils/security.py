"""
Ganitel V2 Backend - Security Utilities
"""
from datetime import datetime, timedelta
from jose import jwt
from app.config import get_settings

settings = get_settings()


def create_access_token(user_id: str, expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token for a user
    
    Args:
        user_id: User ID to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    now = datetime.utcnow()
    expire = now + expires_delta
    
    to_encode = {
        "sub": str(user_id),
        "type": "access",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": now,
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt
