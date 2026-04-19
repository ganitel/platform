# 🏗️ Ganitel V2 Backend - Complete Code Architecture & Implementation Guide

This document provides comprehensive implementation guidance for the Ganitel backend development team. Every component, structure, and pattern is specified for immediate development.

---

## 📋 Implementation Overview

### **Development Timeline**
- **Phase 1 (Weeks 1-2)**: Core foundation, authentication, user management
- **Phase 2 (Weeks 3-4)**: Service management, search, basic CRUD operations  
- **Phase 3 (Weeks 5-6)**: Booking system, cart, payment integration
- **Phase 4 (Weeks 7-8)**: Advanced features, notifications, admin tools
- **Phase 5 (Weeks 9-10)**: Testing, optimization, deployment preparation

### **Team Roles & Responsibilities**
- **Backend Lead**: Architecture oversight, core services, integrations
- **Backend Developer 1**: Authentication, user management, providers
- **Backend Developer 2**: Services, search, cart, bookings
- **Backend Developer 3**: Payments, notifications, admin features
- **DevOps Engineer**: Infrastructure, CI/CD, monitoring

---

## 🏢 Project Structure

### **Complete Directory Structure**
```
ganitel-backend/
├── app/                          # Main application package
│   ├── __init__.py
│   ├── main.py                   # FastAPI application entry point
│   ├── config.py                 # Configuration management
│   ├── database.py               # Database connection and session management
│   ├── dependencies.py           # FastAPI dependencies
│   ├── exceptions.py             # Custom exception classes
│   ├── middleware/               # Custom middleware
│   │   ├── __init__.py
│   │   ├── auth.py              # JWT authentication middleware
│   │   ├── cors.py              # CORS configuration
│   │   ├── logging.py           # Request logging middleware
│   │   ├── rate_limiting.py     # Rate limiting middleware
│   │   └── monitoring.py        # Prometheus metrics middleware
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── base.py              # Base model class
│   │   ├── users.py             # User-related models
│   │   ├── providers.py         # Provider models
│   │   ├── services.py          # Service models
│   │   ├── bookings.py          # Booking models
│   │   ├── payments.py          # Payment models
│   │   ├── reviews.py           # Review models
│   │   ├── notifications.py     # Notification models
│   │   └── admin.py             # Admin models
│   ├── schemas/                  # Pydantic schemas for API validation
│   │   ├── __init__.py
│   │   ├── base.py              # Base schema classes
│   │   ├── auth.py              # Authentication schemas
│   │   ├── users.py             # User schemas
│   │   ├── providers.py         # Provider schemas
│   │   ├── services.py          # Service schemas
│   │   ├── bookings.py          # Booking schemas
│   │   ├── payments.py          # Payment schemas
│   │   ├── reviews.py           # Review schemas
│   │   └── responses.py         # Response schemas
│   ├── api/                      # API route handlers
│   │   ├── __init__.py
│   │   ├── v1/                  # API version 1
│   │   │   ├── __init__.py
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── users.py         # User management endpoints
│   │   │   ├── providers.py     # Provider endpoints
│   │   │   ├── services.py      # Service management endpoints
│   │   │   ├── packages.py      # Package endpoints
│   │   │   ├── cart.py          # Shopping cart endpoints
│   │   │   ├── bookings.py      # Booking endpoints
│   │   │   ├── payments.py      # Payment endpoints
│   │   │   ├── reviews.py       # Review endpoints
│   │   │   ├── messaging.py     # Messaging endpoints
│   │   │   ├── admin.py         # Admin endpoints
│   │   │   └── health.py        # Health check endpoints
│   │   └── deps.py              # API dependencies
│   ├── services/                 # Business logic services
│   │   ├── __init__.py
│   │   ├── auth_service.py      # Authentication business logic
│   │   ├── user_service.py      # User management service
│   │   ├── provider_service.py  # Provider management service
│   │   ├── service_service.py   # Service management (yes, confusing name!)
│   │   ├── search_service.py    # Search and filtering service
│   │   ├── booking_service.py   # Booking management service
│   │   ├── cart_service.py      # Shopping cart service
│   │   ├── payment_service.py   # Payment processing service
│   │   ├── review_service.py    # Review management service
│   │   ├── notification_service.py # Notification service
│   │   ├── file_service.py      # File upload/management service
│   │   └── admin_service.py     # Admin operations service
│   ├── integrations/             # External service integrations
│   │   ├── __init__.py
│   │   ├── tranzak.py           # Tranzak payment integration
│   │   ├── twilio.py            # Twilio WhatsApp integration
│   │   ├── aws_s3.py            # AWS S3 file storage
│   │   ├── sendgrid.py          # Email service integration
│   │   └── google_maps.py       # Google Maps integration
│   ├── core/                     # Core utilities and helpers
│   │   ├── __init__.py
│   │   ├── security.py          # Security utilities (JWT, hashing)
│   │   ├── pagination.py        # Pagination utilities
│   │   ├── validators.py        # Custom validators
│   │   ├── formatters.py        # Data formatting utilities
│   │   ├── constants.py         # Application constants
│   │   └── utils.py             # General utilities
│   ├── background/               # Background task handling
│   │   ├── __init__.py
│   │   ├── celery_app.py        # Celery configuration
│   │   ├── tasks/               # Background tasks
│   │   │   ├── __init__.py
│   │   │   ├── email_tasks.py   # Email sending tasks
│   │   │   ├── notification_tasks.py # Notification tasks
│   │   │   ├── payment_tasks.py # Payment processing tasks
│   │   │   └── cleanup_tasks.py # Database cleanup tasks
│   │   └── scheduler.py         # Task scheduling
│   └── tests/                    # Test package (mirrors app structure)
│       ├── __init__.py
│       ├── conftest.py          # Pytest configuration
│       ├── factories.py         # Test data factories
│       ├── unit/                # Unit tests
│       ├── integration/         # Integration tests
│       ├── e2e/                 # End-to-end tests
│       └── fixtures/            # Test fixtures
├── alembic/                      # Database migrations
│   ├── versions/                # Migration files
│   ├── script.py.mako          # Migration template
│   └── env.py                   # Alembic environment
├── scripts/                      # Utility scripts
│   ├── init_db.py              # Database initialization
│   ├── seed_data.py            # Development data seeding
│   ├── backup_db.py            # Database backup script
│   └── deployment/             # Deployment scripts
├── docker/                       # Docker configurations
│   ├── Dockerfile              # Main Dockerfile
│   ├── Dockerfile.dev          # Development Dockerfile
│   ├── docker-compose.yml      # Local development
│   └── docker-compose.prod.yml # Production setup
├── docs/                        # Additional documentation
├── requirements/                # Python dependencies
│   ├── base.txt               # Base requirements
│   ├── dev.txt                # Development requirements
│   ├── test.txt               # Testing requirements
│   └── prod.txt               # Production requirements
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore file
├── alembic.ini                 # Alembic configuration
├── pyproject.toml              # Python project configuration
└── README.md                   # Project documentation
```

---

## ⚙️ Core Configuration & Setup

### **1. Environment Configuration (app/config.py)**
```python
from functools import lru_cache
from typing import Optional, List
from pydantic import BaseSettings, validator
import secrets

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "Ganitel API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30
    DATABASE_POOL_TIMEOUT: int = 30
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_POOL_SIZE: int = 10
    
    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    PASSWORD_HASH_ALGORITHM: str = "bcrypt"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://app.ganitel.com"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_FOLDER: str = "uploads"
    ALLOWED_FILE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".pdf"]
    
    # External Services
    TRANZAK_API_KEY: str
    TRANZAK_API_SECRET: str
    TRANZAK_BASE_URL: str = "https://api.tranzak.com"
    
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"
    
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "ganitel-uploads"
    
    SENDGRID_API_KEY: str
    SENDGRID_FROM_EMAIL: str = "noreply@ganitel.com"
    
    # Business Logic
    PLATFORM_COMMISSION_RATE: float = 0.10  # 10%
    CURRENCY_DEFAULT: str = "XAF"
    TIMEZONE_DEFAULT: str = "Africa/Douala"
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Background Tasks
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v, values):
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()

# Environment-specific configurations
class DevelopmentSettings(Settings):
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

class ProductionSettings(Settings):
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
class TestingSettings(Settings):
    DEBUG: bool = True
    ENVIRONMENT: str = "testing"
    DATABASE_URL: str = "postgresql://localhost/ganitel_test"
```

### **2. Database Setup (app/database.py)**
```python
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import AsyncGenerator
import asyncio
from contextlib import asynccontextmanager

from app.config import get_settings

settings = get_settings()

# Database engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    pool_pre_ping=True,  # Verify connections before use
    echo=settings.DEBUG,  # Log SQL in debug mode
)

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Base class for all models
Base = declarative_base()

# Naming convention for constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

Base.metadata = MetaData(naming_convention=convention)

# Database dependency for FastAPI
def get_db() -> Session:
    """Database dependency for FastAPI endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Async context manager for database operations
@asynccontextmanager
async def get_db_session() -> AsyncGenerator[Session, None]:
    """Async context manager for database operations"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database utilities
class DatabaseManager:
    """Database management utilities"""
    
    @staticmethod
    def create_all_tables():
        """Create all database tables"""
        Base.metadata.create_all(bind=engine)
    
    @staticmethod
    def drop_all_tables():
        """Drop all database tables (use with caution!)"""
        Base.metadata.drop_all(bind=engine)
    
    @staticmethod
    def check_connection() -> bool:
        """Check database connectivity"""
        try:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            return True
        except Exception:
            return False
    
    @staticmethod
    async def execute_raw_sql(sql: str, params: dict = None):
        """Execute raw SQL with optional parameters"""
        async with get_db_session() as db:
            result = db.execute(sql, params or {})
            db.commit()
            return result

# Initialize database on startup
def init_db():
    """Initialize database with tables and initial data"""
    from app.models import *  # Import all models
    
    # Create tables
    DatabaseManager.create_all_tables()
    
    # Run initial data setup if needed
    # This could include admin users, categories, etc.
```

### **3. Main Application (app/main.py)**
```python
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
import uvicorn
import time
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database import init_db
from app.middleware import (
    AuthMiddleware,
    LoggingMiddleware,
    RateLimitingMiddleware,
    MonitoringMiddleware
)
from app.api.v1 import (
    auth, users, providers, services, packages, cart,
    bookings, payments, reviews, messaging, admin, health
)
from app.exceptions import (
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError
)
from app.core.constants import API_PREFIX

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting Ganitel API...")
    
    # Initialize database
    init_db()
    
    # Initialize external services
    await init_external_services()
    
    print("✅ Ganitel API started successfully")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Ganitel API...")
    await cleanup_external_services()
    print("✅ Ganitel API shut down successfully")

async def init_external_services():
    """Initialize external service connections"""
    # Initialize Redis connection
    from app.core.cache import init_redis
    await init_redis()
    
    # Initialize Celery
    from app.background.celery_app import init_celery
    init_celery()
    
    # Verify external API connections
    from app.integrations.tranzak import TranzakClient
    from app.integrations.twilio import TwilioClient
    
    tranzak_client = TranzakClient()
    twilio_client = TwilioClient()
    
    # Test connections (optional)
    if settings.ENVIRONMENT != "testing":
        await tranzak_client.health_check()
        await twilio_client.health_check()

async def cleanup_external_services():
    """Cleanup external service connections"""
    from app.core.cache import cleanup_redis
    await cleanup_redis()

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Ganitel - Multi-service travel platform API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan
)

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add custom security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Middleware setup (order matters!)
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["api.ganitel.com", "*.ganitel.com"]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Custom middleware
app.add_middleware(MonitoringMiddleware)
app.add_middleware(RateLimitingMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthMiddleware)

# Exception handlers
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": None,
            "errors": [
                {
                    "code": "VALIDATION_ERROR",
                    "message": str(exc),
                    "field": getattr(exc, "field", None),
                    "details": getattr(exc, "details", {})
                }
            ],
            "meta": {
                "request_id": getattr(request.state, "request_id", None),
                "timestamp": time.time()
            }
        }
    )

@app.exception_handler(AuthenticationError)
async def auth_exception_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(
        status_code=401,
        content={
            "success": False,
            "data": None,
            "errors": [
                {
                    "code": "AUTHENTICATION_ERROR",
                    "message": str(exc),
                    "details": {}
                }
            ],
            "meta": {
                "request_id": getattr(request.state, "request_id", None),
                "timestamp": time.time()
            }
        }
    )

@app.exception_handler(AuthorizationError)
async def authorization_exception_handler(request: Request, exc: AuthorizationError):
    return JSONResponse(
        status_code=403,
        content={
            "success": False,
            "data": None,
            "errors": [
                {
                    "code": "AUTHORIZATION_ERROR",
                    "message": str(exc),
                    "details": {}
                }
            ],
            "meta": {
                "request_id": getattr(request.state, "request_id", None),
                "timestamp": time.time()
            }
        }
    )

@app.exception_handler(NotFoundError)
async def not_found_exception_handler(request: Request, exc: NotFoundError):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "data": None,
            "errors": [
                {
                    "code": "NOT_FOUND",
                    "message": str(exc),
                    "details": {}
                }
            ],
            "meta": {
                "request_id": getattr(request.state, "request_id", None),
                "timestamp": time.time()
            }
        }
    )

@app.exception_handler(ConflictError)
async def conflict_exception_handler(request: Request, exc: ConflictError):
    return JSONResponse(
        status_code=409,
        content={
            "success": False,
            "data": None,
            "errors": [
                {
                    "code": "CONFLICT_ERROR",
                    "message": str(exc),
                    "details": getattr(exc, "details", {})
                }
            ],
            "meta": {
                "request_id": getattr(request.state, "request_id", None),
                "timestamp": time.time()
            }
        }
    )

@app.exception_handler(RateLimitError)
async def rate_limit_exception_handler(request: Request, exc: RateLimitError):
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "data": None,
            "errors": [
                {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": str(exc),
                    "details": {
                        "retry_after": getattr(exc, "retry_after", 60)
                    }
                }
            ],
            "meta": {
                "request_id": getattr(request.state, "request_id", None),
                "timestamp": time.time()
            }
        }
    )

# Include API routers
app.include_router(health.router, prefix=f"{API_PREFIX}", tags=["Health"])
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{API_PREFIX}/users", tags=["Users"])
app.include_router(providers.router, prefix=f"{API_PREFIX}/providers", tags=["Providers"])
app.include_router(services.router, prefix=f"{API_PREFIX}/services", tags=["Services"])
app.include_router(packages.router, prefix=f"{API_PREFIX}/packages", tags=["Packages"])
app.include_router(cart.router, prefix=f"{API_PREFIX}/cart", tags=["Shopping Cart"])
app.include_router(bookings.router, prefix=f"{API_PREFIX}/bookings", tags=["Bookings"])
app.include_router(payments.router, prefix=f"{API_PREFIX}/payments", tags=["Payments"])
app.include_router(reviews.router, prefix=f"{API_PREFIX}/reviews", tags=["Reviews"])
app.include_router(messaging.router, prefix=f"{API_PREFIX}/conversations", tags=["Messaging"])
app.include_router(admin.router, prefix=f"{API_PREFIX}/admin", tags=["Admin"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Ganitel API",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if settings.DEBUG else None
    }

# Development server
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    )
```

