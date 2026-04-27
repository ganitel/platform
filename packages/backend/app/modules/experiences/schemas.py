"""Pydantic schemas for experiences — listing inputs, public search
results, and full detail responses. Shared building blocks (Money,
GeoPoint, HostPublic, CountryCode, ContentLanguage) are reused from
the properties module to avoid drift."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.money import Money
from app.modules.experiences.models import (
    ExperienceCancellationPolicy,
    ExperienceStatus,
)
from app.modules.media.schemas import MediaPublic
from app.modules.properties.schemas import (
    ContentLanguage,
    CountryCode,
    GeoPoint,
    HostPublic,
)

# Bounds: 15 minutes minimum (no point listing an experience shorter than
# that) up to a full 24-hour day.
MIN_DURATION_MIN = 15
MAX_DURATION_MIN = 24 * 60


class ExperienceCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=3, max_length=180)
    description: str = Field(default="", max_length=10_000)
    experience_type: str = Field(..., min_length=2, max_length=40)
    city: str = Field(..., min_length=1, max_length=120)
    country_code: CountryCode
    location: GeoPoint
    capacity: int = Field(..., ge=1, le=64)
    duration_minutes: int = Field(..., ge=MIN_DURATION_MIN, le=MAX_DURATION_MIN)
    cancellation_policy: ExperienceCancellationPolicy = ExperienceCancellationPolicy.MODERATE
    base_price: Money
    content_language: ContentLanguage = "fr"


class ExperienceUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, max_length=10_000)
    experience_type: str | None = None
    city: str | None = None
    country_code: CountryCode | None = None
    location: GeoPoint | None = None
    capacity: int | None = Field(default=None, ge=1, le=64)
    duration_minutes: int | None = Field(default=None, ge=MIN_DURATION_MIN, le=MAX_DURATION_MIN)
    cancellation_policy: ExperienceCancellationPolicy | None = None
    base_price: Money | None = None
    content_language: ContentLanguage | None = None


class ExperiencePublic(BaseModel):
    """Returned in search results — leaner than detail."""

    id: UUID
    title: str
    experience_type: str
    city: str
    country_code: CountryCode
    location: GeoPoint
    capacity: int
    duration_minutes: int
    base_price: Money
    cover_photo: MediaPublic | None
    distance_km: float | None = None


class ExperienceDetail(ExperiencePublic):
    description: str
    cancellation_policy: ExperienceCancellationPolicy
    content_language: ContentLanguage
    status: ExperienceStatus
    host: HostPublic
    photos: list[MediaPublic]
    created_at: datetime
    published_at: datetime | None


class SearchOut(BaseModel):
    items: list[ExperiencePublic]
    total: int
    limit: int
    offset: int
