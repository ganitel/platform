"""
Ganitel V2 Backend - Configuration Settings
"""

from dataclasses import dataclass
from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


@dataclass(frozen=True)
class EnvironmentPolicy:
    """Environment-specific defaults and safety requirements"""

    canonical_name: Literal["development", "test", "staging", "production"]
    default_debug: bool
    default_access_token_expire_minutes: int
    default_refresh_token_expire_days: int
    default_env_workers: int
    default_cors_origins: list[str]
    enforce_strict_secrets: bool


ENVIRONMENT_POLICIES = {
    "development": EnvironmentPolicy(
        canonical_name="development",
        default_debug=True,
        default_access_token_expire_minutes=60,
        default_refresh_token_expire_days=30,
        default_env_workers=2,
        default_cors_origins=["http://localhost:3000", "http://localhost:8000"],
        enforce_strict_secrets=False,
    ),
    "test": EnvironmentPolicy(
        canonical_name="test",
        default_debug=False,
        default_access_token_expire_minutes=30,
        default_refresh_token_expire_days=7,
        default_env_workers=1,
        default_cors_origins=["http://localhost:3000", "http://localhost:8000"],
        enforce_strict_secrets=False,
    ),
    "staging": EnvironmentPolicy(
        canonical_name="staging",
        default_debug=False,
        default_access_token_expire_minutes=30,
        default_refresh_token_expire_days=7,
        default_env_workers=2,
        default_cors_origins=["https://staging.ganitel.com"],
        enforce_strict_secrets=True,
    ),
    "production": EnvironmentPolicy(
        canonical_name="production",
        default_debug=False,
        default_access_token_expire_minutes=15,
        default_refresh_token_expire_days=7,
        default_env_workers=3,
        default_cors_origins=["https://app.ganitel.com"],
        enforce_strict_secrets=True,
    ),
}


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, env_parse_none_str="null", extra="ignore"
    )

    # Application
    APP_NAME: str = "ganitel API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    # Keep local alias for developer experience; treated as development policy.
    ENVIRONMENT: str = "local"
    TESTING: bool = False
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "ganitel-backend"
    JWT_AUDIENCE: str = "ganitel-clients"
    ENV_WORKERS: int = 2
    APP_HOST_PORT: int = 8000
    POSTGRES_HOST_PORT: int = 5432
    TEST_POSTGRES_HOST_PORT: int = 5433
    REDIS_HOST_PORT: int = 6379
    PGADMIN_HOST_PORT: int = 5050

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "ganitel_db"
    POSTGRES_USER: str = "ganitel_user"
    POSTGRES_PASSWORD: str = "ganitel_password"
    DATABASE_URL: str | None = None
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS - Accept both string and list
    CORS_ORIGINS: str | list[str] = ["http://localhost:3000", "http://localhost:8000"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str | list[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS: str | list[str] = ["*"]

    # Tranzak Payment Gateway
    TRANZAK_API_KEY: str = "your-tranzak-api-key"
    TRANZAK_APP_ID: str = "your-tranzak-app-id"
    TRANZAK_APP_KEY: str = "your-tranzak-app-key"
    TRANZAK_BASE_URL: str = "https://dsapi.tranzak.me/xp021/v1"
    TRANZAK_AUTH_BASE_URL: str = "https://dsapi.tranzak.me"
    TRANZAK_WEBHOOK_SECRET: str = "your-webhook-secret"
    TRANZAK_WEBHOOK_AUTH_KEY: str = "your-tranzak-webhook-auth-key"
    TRANZAK_WEBHOOK_ID: str = ""

    # Payment Configuration
    PAYMENT_CALLBACK_URL: str = "http://localhost:8000/api/v1/payments/webhook/tranzak"
    PAYMENT_RETURN_URL: str = "http://localhost:3000/payment/success"

    # Default Admin Account
    ADMIN_EMAIL: str = "admin@ganitel.com"
    ADMIN_PASSWORD: str = "Change_This_Password_123!"
    ADMIN_FIRST_NAME: str = "Admin"
    ADMIN_LAST_NAME: str = "Ganitel"

    # OAuth Configuration
    GOOGLE_CLIENT_ID: str = "your-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "your-google-client-secret"
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/oauth/google/callback"
    FACEBOOK_APP_ID: str = "your-facebook-app-id"
    FACEBOOK_APP_SECRET: str = "your-facebook-app-secret"
    FACEBOOK_REDIRECT_URI: str = (
        "http://localhost:8000/api/v1/auth/oauth/facebook/callback"
    )
    FRONTEND_URL: str = "http://localhost:3000"

    # Orange Money Configuration
    ORANGE_MONEY_CLIENT_ID: str = "your-orange-money-client-id"
    ORANGE_MONEY_CLIENT_SECRET: str = "your-orange-money-client-secret"
    ORANGE_MONEY_MERCHANT_KEY: str = "your-orange-money-merchant-key"
    ORANGE_MONEY_TOKEN_URL: str = "https://api.orange.com/oauth/v2/token"
    ORANGE_MONEY_PAYMENT_URL: str = (
        "https://api.orange.com/orange-money-webpay/cm/v1/webpayment"
    )
    ORANGE_MONEY_WEBHOOK_URL: str = (
        "http://localhost:8000/api/v1/payments/webhook/orange"
    )

    # Mobile Money Configuration
    MOBILE_MONEY_BASIC_AUTH: str = "your-mobile-money-basic-auth"
    MOBILE_MONEY_TOKEN_URL: str = (
        "https://sandbox.momodeveloper.mtn.com/collection/token/"
    )
    MOBILE_MONEY_PAYMENT_URL: str = (
        "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay"
    )
    MOBILE_MONEY_ENVIRONMENT: str = "sandbox"
    MOBILE_MONEY_WEBHOOK_URL: str = (
        "http://localhost:8000/api/v1/payments/webhook/mobile-money"
    )

    # File Upload Configuration
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Cloudflare R2 Configuration
    STORAGE_TYPE: str = "local"  # 'local' or 'r2'
    R2_BUCKET_NAME: str = "ganitel-uploads"
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_PUBLIC_URL: str = "https://cdn.ganitel.com"
    R2_ENDPOINT_URL: str = ""  # Generated from account_id if empty

    @staticmethod
    def _normalize_environment_name(environment: str) -> str:
        normalized = (environment or "").strip().lower()
        if normalized == "local":
            return "development"
        return normalized

    @property
    def effective_environment(self) -> str:
        """Canonical environment name used by validation and policy."""
        return self._normalize_environment_name(self.ENVIRONMENT)

    @property
    def environment_policy(self) -> EnvironmentPolicy:
        return ENVIRONMENT_POLICIES[self.effective_environment]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        if isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://localhost:8000"]

    @field_validator("CORS_ALLOW_METHODS", mode="before")
    @classmethod
    def assemble_cors_methods(cls, v) -> list[str]:
        if isinstance(v, str):
            return [method.strip() for method in v.split(",")]
        if isinstance(v, list):
            return v
        return ["GET", "POST", "PUT", "DELETE", "OPTIONS"]

    @field_validator("CORS_ALLOW_HEADERS", mode="before")
    @classmethod
    def assemble_cors_headers(cls, v) -> list[str]:
        if isinstance(v, str):
            return [header.strip() for header in v.split(",")]
        if isinstance(v, list):
            return v
        return ["*"]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v) -> str:
        if v and isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @field_validator("ENVIRONMENT", mode="before")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        normalized = (v or "").strip().lower()
        allowed = {"local", "development", "test", "staging", "production"}
        if normalized not in allowed:
            raise ValueError(
                "ENVIRONMENT must be one of: local, development, test, staging, production"
            )
        return normalized

    @model_validator(mode="after")
    def build_database_url(self):
        if self.DATABASE_URL:
            # Continue to policy and fail-fast checks
            pass
        else:
            self.DATABASE_URL = URL.create(
                drivername="postgresql",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_SERVER,
                port=self.POSTGRES_PORT,
                database=self.POSTGRES_DB,
            ).render_as_string(hide_password=False)

        policy = self.environment_policy
        provided_fields = set(self.model_fields_set)

        if "DEBUG" not in provided_fields:
            self.DEBUG = policy.default_debug

        if "ACCESS_TOKEN_EXPIRE_MINUTES" not in provided_fields:
            self.ACCESS_TOKEN_EXPIRE_MINUTES = (
                policy.default_access_token_expire_minutes
            )

        if "REFRESH_TOKEN_EXPIRE_DAYS" not in provided_fields:
            self.REFRESH_TOKEN_EXPIRE_DAYS = policy.default_refresh_token_expire_days

        if "ENV_WORKERS" not in provided_fields:
            self.ENV_WORKERS = policy.default_env_workers

        if "CORS_ORIGINS" not in provided_fields:
            self.CORS_ORIGINS = policy.default_cors_origins

        if self.effective_environment == "production" and self.DEBUG:
            raise ValueError("DEBUG must be False in production environment")

        if (
            self.CORS_ALLOW_CREDENTIALS
            and "*" in self.CORS_ORIGINS
            and self.effective_environment != "development"
        ):
            raise ValueError(
                "CORS_ORIGINS cannot contain '*' when credentials are enabled outside development"
            )

        if self.effective_environment in {"staging", "production"} and not (
            15 <= self.ACCESS_TOKEN_EXPIRE_MINUTES <= 30
        ):
            raise ValueError(
                "ACCESS_TOKEN_EXPIRE_MINUTES must be between 15 and 30 for staging/production"
            )

        if self.ENV_WORKERS < 1:
            raise ValueError("ENV_WORKERS must be >= 1")

        if (
            self.effective_environment in {"staging", "production"}
            and self.ENV_WORKERS < 2
        ):
            raise ValueError("ENV_WORKERS must be >= 2 in staging/production")

        host_port_bindings = {
            "APP_HOST_PORT": self.APP_HOST_PORT,
            "POSTGRES_HOST_PORT": self.POSTGRES_HOST_PORT,
            "REDIS_HOST_PORT": self.REDIS_HOST_PORT,
        }

        if self.effective_environment == "development":
            host_port_bindings.update(
                {
                    "TEST_POSTGRES_HOST_PORT": self.TEST_POSTGRES_HOST_PORT,
                    "PGADMIN_HOST_PORT": self.PGADMIN_HOST_PORT,
                }
            )

        invalid_host_port_names = [
            key
            for key, value in host_port_bindings.items()
            if value < 1 or value > 65535
        ]
        if invalid_host_port_names:
            joined = ", ".join(invalid_host_port_names)
            raise ValueError(f"Host port values must be between 1 and 65535: {joined}")

        seen_ports = {}
        duplicate_host_port_names = set()
        for key, value in host_port_bindings.items():
            existing_key = seen_ports.get(value)
            if existing_key:
                duplicate_host_port_names.update({existing_key, key})
            else:
                seen_ports[value] = key

        if duplicate_host_port_names:
            joined = ", ".join(sorted(duplicate_host_port_names))
            raise ValueError(f"Duplicate host ports detected across bindings: {joined}")

        if policy.enforce_strict_secrets:
            if (
                self.SECRET_KEY == "dev-secret-key-change-in-production"
                or len(self.SECRET_KEY) < 32
            ):
                raise ValueError(
                    "SECRET_KEY must be set to a strong value (min 32 chars) in staging/production"
                )

            if (self.ADMIN_EMAIL or "").strip().lower() == "admin@ganitel.com":
                raise ValueError("ADMIN_EMAIL must be changed in staging/production")

            if self.ADMIN_PASSWORD == "Change_This_Password_123!":
                raise ValueError("ADMIN_PASSWORD must be changed in staging/production")

            placeholder_secrets = {
                "TRANZAK_API_KEY": self.TRANZAK_API_KEY,
                "TRANZAK_APP_ID": self.TRANZAK_APP_ID,
                "TRANZAK_APP_KEY": self.TRANZAK_APP_KEY,
                "TRANZAK_WEBHOOK_SECRET": self.TRANZAK_WEBHOOK_SECRET,
                "TRANZAK_WEBHOOK_AUTH_KEY": self.TRANZAK_WEBHOOK_AUTH_KEY,
                "GOOGLE_CLIENT_ID": self.GOOGLE_CLIENT_ID,
                "GOOGLE_CLIENT_SECRET": self.GOOGLE_CLIENT_SECRET,
                "FACEBOOK_APP_ID": self.FACEBOOK_APP_ID,
                "FACEBOOK_APP_SECRET": self.FACEBOOK_APP_SECRET,
                "ORANGE_MONEY_CLIENT_ID": self.ORANGE_MONEY_CLIENT_ID,
                "ORANGE_MONEY_CLIENT_SECRET": self.ORANGE_MONEY_CLIENT_SECRET,
                "ORANGE_MONEY_MERCHANT_KEY": self.ORANGE_MONEY_MERCHANT_KEY,
                "MOBILE_MONEY_BASIC_AUTH": self.MOBILE_MONEY_BASIC_AUTH,
            }

            invalid_secret_names = [
                key
                for key, value in placeholder_secrets.items()
                if not value
                or value.startswith("your-")
                or value.startswith("your_")
                or value.startswith("your")
                or value.startswith("CHANGE_THIS")
            ]

            if invalid_secret_names:
                joined = ", ".join(invalid_secret_names)
                raise ValueError(
                    f"Placeholder secrets detected in staging/production: {joined}"
                )

        return self


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()
