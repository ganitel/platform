"""
Rate limiter configuration
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings

settings = get_settings()

def get_redis_limiter_url() -> str:
    """Get Redis URL for rate limiter"""
    return settings.REDIS_URL

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=get_redis_limiter_url(),
    strategy="fixed-window"
)
