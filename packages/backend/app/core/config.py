"""Application settings loaded from env via pydantic-settings.

`get_settings()` is cached and is the single source of truth for
config. Anything that varies by environment (DB URL, JWT JWKS,
CORS origins, payment/SMS provider keys, …) belongs here."""

from functools import lru_cache
from typing import Annotated, Literal, cast

from pydantic import BaseModel, Field, PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class PaymentSettings(BaseModel):
    """Tranzak + booking payment flow (flat env: TRANZAK_*, PAYMENT_*, BOOKING_*)."""

    PAYMENT_PROVIDER: Literal["tranzak", "stripe", "noop"] | None = None
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

    Reads use presigned GET URLs from the S3 API. The client uses **path-style** addressing, which
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
    MEDIA_GET_URL_TTL_SECONDS: int = 3600
    MEDIA_PUT_URL_TTL_SECONDS: int = 600
    SUPABASE_PROJECT_URL: str | None = Field(
        default=None,
        description="Supabase project URL (https://<ref>.supabase.co) used to build public object and image-transform URLs. Distinct from S3_ENDPOINT_URL which is the S3 protocol endpoint used for writes.",
    )
    SUPABASE_IMAGE_TRANSFORMS_ENABLED: bool = Field(
        default=False,
        description="Set to true when on a Supabase paid plan that includes Image Transformations. When false, image_transform_url falls back to public_url.",
    )


class Settings(PaymentSettings, ObjectStorageSettings, BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    DEBUG: bool = False
    APP_NAME: str = "ganitel API"
    APP_VERSION: str = "0.1.0"

    # Defaults assume local Postgres (with PostGIS). Env overrides in real deployments.
    DATABASE_URL: PostgresDsn = cast(
        PostgresDsn,
        "postgresql+asyncpg://ganitel:ganitel@localhost:5432/ganitel",
    )

    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(default_factory=list)

    # Auth — backend only verifies session JWTs against the provider's JWKS.
    # Provider-neutral so we can swap (Supabase Auth, better-auth, Clerk, ...).
    JWT_JWKS_URL: str | None = None
    JWT_ISSUER: str | None = None

    # Africa's Talking (SMS) — outbound only, used for OTP delivery to African
    # numbers via the Supabase Auth Send SMS Hook. AT_BASE_URL points at sandbox
    # by default for safe local testing; flip to api.africastalking.com in prod.
    AT_USERNAME: str = "sandbox"
    AT_API_KEY: str | None = None
    AT_SENDER_ID: str | None = None
    AT_BASE_URL: str = "https://api.sandbox.africastalking.com"

    # Twilio — outbound SMS for non-African numbers. The hook routes by country
    # code: African → AT, everything else → Twilio. Configure either
    # TWILIO_FROM_NUMBER (a Twilio-owned number) or TWILIO_MESSAGING_SERVICE_SID.
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_FROM_NUMBER: str | None = None
    TWILIO_MESSAGING_SERVICE_SID: str | None = None

    # Supabase Auth Send SMS Hook secret (Standard Webhooks).
    # Format from Supabase: "v1,whsec_<base64>" — paste it as-is.
    SUPABASE_AUTH_HOOK_SECRET: str | None = None

    # Resend (transactional email) — used to notify admins when a team member
    # submits the /add-team form. Submissions still succeed if these are unset;
    # we just log a warning instead of sending the review email.
    RESEND_API_KEY: str | None = None
    RESEND_FROM_EMAIL: str = "ganitel <noreply@ganitel.com>"

    # Public base URL used to build links in outbound email (e.g., review pages).
    APP_BASE_URL: str = "http://localhost:3000"

    # Secret used to sign short-lived review tokens for admin approval links.
    # Falls back to an unsafe dev default if unset; production must override.
    TEAM_REVIEW_SECRET: str = "dev-only-change-me"
    TEAM_REVIEW_TOKEN_TTL_SECONDS: int = 60 * 60 * 24 * 7

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_csv(cls, v: object) -> object:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @model_validator(mode="after")
    def _require_supabase_url_in_prod(self) -> "Settings":
        if self.ENVIRONMENT == "production" and not self.SUPABASE_PROJECT_URL:
            raise ValueError(
                "SUPABASE_PROJECT_URL is required in production — "
                "media endpoints raise per-request RuntimeError without it."
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
