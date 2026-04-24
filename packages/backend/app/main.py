"""
Ganitel V2 Backend - Main FastAPI Application
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.config import get_settings
from app.core.exception_handlers import register_exception_handlers
from app.core.logging_config import configure_logging
from app.core.ratelimit import limiter
from app.middleware.i18n_middleware import I18nMiddleware

settings = get_settings()
configure_logging(debug=settings.DEBUG)
logger = logging.getLogger(__name__)


async def create_default_admin():
    """Create default admin account on startup if it doesn't exist"""
    try:
        from passlib.context import CryptContext
        from sqlalchemy import inspect

        from app.database import SessionLocal
        from app.domain.entities.user import User, UserStatus, UserType

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        db = SessionLocal()
        try:
            # Never auto-create admin outside local development
            if settings.effective_environment != "development" or settings.TESTING:
                logger.info(
                    "Automatic admin creation disabled",
                    extra={"environment": settings.ENVIRONMENT},
                )
                return

            # Check if users table exists (migrations have been run)
            inspector = inspect(db.bind)
            if "users" not in inspector.get_table_names():  # ty: ignore[unresolved-attribute]
                logger.warning("Users table not found, skipping admin creation")
                return

            # Check if admin already exists
            existing_admin = (
                db.query(User)
                .filter(User.email == settings.ADMIN_EMAIL, User.deleted_at.is_(None))
                .first()
            )

            if existing_admin:
                logger.info(
                    "Admin account already exists",
                    extra={"admin_email": settings.ADMIN_EMAIL},
                )
                return

            # Create new admin account
            admin_user = User(
                email=settings.ADMIN_EMAIL,
                phone="+237600000000",  # Default phone
                first_name=settings.ADMIN_FIRST_NAME,
                last_name=settings.ADMIN_LAST_NAME,
                hashed_password=pwd_context.hash(settings.ADMIN_PASSWORD),
                user_type=UserType.ADMIN.value,
                status=UserStatus.ACTIVE.value,
                is_verified=True,
                is_active=True,
            )

            db.add(admin_user)
            db.commit()
            logger.info(
                "Default admin account created",
                extra={"admin_email": settings.ADMIN_EMAIL},
            )
            logger.warning("Please change the admin password after first login")

        except Exception:
            db.rollback()
            logger.exception("Admin account creation failed")
        finally:
            db.close()

    except Exception:
        logger.exception("Admin account bootstrap failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(
        "Starting Ganitel API",
        extra={"environment": settings.ENVIRONMENT, "debug": settings.DEBUG},
    )

    # Create default admin account
    await create_default_admin()

    yield

    # Shutdown
    logger.info("Shutting down Ganitel API")


# Create FastAPI application
# Note: Docs enabled in staging for testing. Disable in production if needed.
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Ganitel - Multi-service travel platform API",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

register_exception_handlers(app)

# Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # ty: ignore[invalid-argument-type]
app.add_middleware(SlowAPIMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# i18n middleware
app.add_middleware(I18nMiddleware)

# Serve static files (uploads)
uploads_dir = Path("uploads")
if settings.effective_environment in {"development", "test"} and uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API routers
app.include_router(api_router, prefix="/api/v1")


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Ganitel API V2",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if settings.ENVIRONMENT != "production" else None,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
