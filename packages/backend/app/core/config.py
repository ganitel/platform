"""Application settings loaded from env via pydantic-settings.

`get_settings()` is cached and is the single source of truth for
config. Anything that varies by environment (DB URL, Clerk JWKS,
CORS origins, payment provider keys, …) belongs here."""

from functools import lru_cache
from typing import Annotated, Literal, cast

from pydantic import BaseModel, Field, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class PaymentSettings(BaseModel):
    """Tranzak + booking payment flow (flat env: TRANZAK_*, PAYMENT_*, BOOKING_*)."""

    TRANZAK_BASE_URL: str = "https://dsapi.tranzak.me"
    TRANZAK_APP_ID: str | None = None
    TRANZAK_APP_KEY: str | None = None
    TRANZAK_WEBHOOK_SECRET: str | None = None
    PAYMENT_RETURN_URL: str = "http://localhost:3000/payment/return"
    BOOKING_HOLD_MINUTES: int = 15


class ObjectStorageSettings(BaseModel):
    """S3-compatible object storage (flat env: S3_*, MEDIA_*).

    **Supabase (managed):** enable “S3 connection” in Dashboard → Storage → S3, then set:
    - ``S3_ENDPOINT_URL`` to ``https://<project-ref>.storage.supabase.co/storage/v1/s3``
    - ``S3_REGION`` to the region shown there (must match signing)
    - ``S3_ACCESS_KEY_ID`` / ``S3_SECRET_ACCESS_KEY`` to the generated S3 protocol keys (server-side)
    - ``S3_BUCKET`` to your Storage bucket id

    Public reads: set ``S3_PUBLIC_URL_BASE`` to
    ``https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>`` for public buckets,
    or leave unset to use presigned GET URLs. The S3 client uses **path-style** addressing, which
    matches Supabase's S3 API requirements.
    """

    S3_ENDPOINT_URL: str | None = Field(
        default=None,
        description="S3 API URL. Supabase: …storage.supabase.co/storage/v1/s3. None = default AWS endpoint.",
    )
    S3_REGION: str = Field(
        default="us-east-1",
        description="Region for SigV4. Supabase: use the region from Storage S3 settings (not arbitrary).",
    )
    S3_ACCESS_KEY_ID: str | None = Field(
        default=None,
        description="S3 access key id (Supabase S3 protocol credentials, MinIO key, or AWS key).",
    )
    S3_SECRET_ACCESS_KEY: str | None = Field(
        default=None,
        description="S3 secret access key (Supabase S3 protocol secret, MinIO secret, or AWS secret).",
    )
    S3_BUCKET: str = Field(
        default="ganitel-uploads",
        description="Bucket id / name (Supabase Storage bucket id).",
    )
    S3_PUBLIC_URL_BASE: str | None = Field(
        default=None,
        description=(
            "Optional base URL for browser reads without presigning. "
            "Supabase public bucket: https://<ref>.supabase.co/storage/v1/object/public/<bucket>. "
            "None = presigned GET URLs via the S3 API."
        ),
    )
    MEDIA_GET_URL_TTL_SECONDS: int = 3600
    MEDIA_PUT_URL_TTL_SECONDS: int = 600


class Settings(PaymentSettings, ObjectStorageSettings, BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    DEBUG: bool = False
    APP_NAME: str = "Ganitel API"
    APP_VERSION: str = "0.1.0"

    # Defaults assume local Postgres (with PostGIS) + Redis on standard ports.
    # Env always overrides in real deployments.
    DATABASE_URL: PostgresDsn = cast(
        PostgresDsn,
        "postgresql+asyncpg://ganitel:ganitel@localhost:5432/ganitel",
    )
    REDIS_URL: RedisDsn = cast(RedisDsn, "redis://localhost:6379/0")

    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(default_factory=list)

    # Clerk — backend only verifies tokens; sign-in/sign-up happen on Clerk.
    CLERK_JWKS_URL: str | None = None
    CLERK_ISSUER: str | None = None  # e.g. https://<instance>.clerk.accounts.dev

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_csv(cls, v: object) -> object:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
