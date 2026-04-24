"""
Ganitel V2 Backend - Health Check Endpoints
"""

import time

import redis
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import check_db_connection, get_db
from app.dependencies import get_redis

router = APIRouter()
settings = get_settings()


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/detailed")
async def detailed_health_check(
    db: Session = Depends(get_db), redis_client: redis.Redis = Depends(get_redis)
):
    """Detailed health check including dependencies"""

    # Check database connection
    db_healthy = check_db_connection()

    # Check Redis connection
    redis_healthy = False
    try:
        redis_client.ping()
        redis_healthy = True
    except Exception:
        redis_healthy = False

    # Overall health status
    overall_healthy = db_healthy and redis_healthy

    return {
        "status": "healthy" if overall_healthy else "unhealthy",
        "timestamp": time.time(),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "dependencies": {
            "database": {
                "status": "healthy" if db_healthy else "unhealthy",
                "type": "postgresql",
            },
            "redis": {
                "status": "healthy" if redis_healthy else "unhealthy",
                "type": "redis",
            },
        },
    }
