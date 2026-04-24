"""
Ganitel V2 Backend - Database Connection and Session Management
"""

import logging
from collections.abc import Generator

from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import QueuePool

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Create database engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL or "",
    poolclass=QueuePool,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # Validate connections before use
    echo=settings.DEBUG,  # Log SQL queries in debug mode
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models (import from domain entities)
from app.domain.entities.base import Base

# Metadata for migrations
metadata = MetaData()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        logger.exception("Request failed while database session was active")
        db.rollback()
        raise
    finally:
        db.close()


def create_tables():
    """Create all tables (for development only)"""
    if settings.DEBUG:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created")


def check_db_connection():
    """Check database connection health"""
    try:
        from sqlalchemy import text

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
