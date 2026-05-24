"""Pydantic schemas for experiences — listing inputs, public search
results, and full detail responses. Shared building blocks (Money,
GeoPoint, HostPublic, CountryCode, ContentLanguage) are reused from
the properties module to avoid drift."""

from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.money import Money
from app.modules.experiences.models import (
    ExperienceCancellationPolicy,
    ExperienceStatus,
)
from app.modules.media.schemas import MediaItemPublic, MediaPublic
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
    address: str | None = Field(default=None, max_length=300)
    city: str = Field(..., min_length=1, max_length=120)
    country_code: CountryCode
    location: GeoPoint
    capacity: int = Field(..., ge=1, le=64)
    duration_minutes: int = Field(..., ge=MIN_DURATION_MIN, le=MAX_DURATION_MIN)
    cancellation_policy: ExperienceCancellationPolicy = ExperienceCancellationPolicy.MODERATE
    prices: list[Money] = Field(..., min_length=1, max_length=10)
    content_language: ContentLanguage = "fr"
    media_ids: list[UUID] = Field(default_factory=list, max_length=20)

    @model_validator(mode="after")
    def _unique_currencies(self) -> Self:
        currencies = [p.currency for p in self.prices]
        if len(currencies) != len(set(currencies)):
            raise ValueError("prices must not contain duplicate currencies")
        return self


class ExperienceUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # See PropertyUpdateIn for the rationale on `T = default` vs `T | None`.
    # NOT NULL DB columns are tightened to typed defaults; complex types
    # (`location`, `base_price`) keep `T | None` for omit-semantics and the
    # field_validator below rejects explicit null only.
    title: str = Field(default="", min_length=3, max_length=180)
    description: str = Field(default="", max_length=10_000)
    experience_type: str = ""
    address: str | None = Field(default=None, max_length=300)
    city: str = ""
    country_code: CountryCode = "CM"
    location: GeoPoint | None = None
    capacity: int = Field(default=0, ge=1, le=64)
    duration_minutes: int = Field(
        default=MIN_DURATION_MIN, ge=MIN_DURATION_MIN, le=MAX_DURATION_MIN
    )
    cancellation_policy: ExperienceCancellationPolicy = ExperienceCancellationPolicy.MODERATE
    prices: list[Money] | None = None
    content_language: ContentLanguage = "fr"

    @field_validator("location", mode="after")
    @classmethod
    def _reject_explicit_null_complex(cls, v):
        if v is None:
            raise ValueError("must not be null; omit the field for a partial update")
        return v

    @model_validator(mode="after")
    def _validate_prices(self) -> Self:
        if self.prices is not None:
            currencies = [p.currency for p in self.prices]
            if len(currencies) != len(set(currencies)):
                raise ValueError("prices must not contain duplicate currencies")
            if len(self.prices) == 0:
                raise ValueError("prices must not be empty when provided")
        return self


class ExperiencePublic(BaseModel):
    """Returned in search results — leaner than detail."""

    id: UUID
    title: str
    experience_type: str
    address: str | None
    city: str
    country_code: CountryCode
    location: GeoPoint
    capacity: int
    duration_minutes: int
    prices: list[Money]
    cover_media: MediaPublic | None
    distance_km: float | None = None


class ExperienceDetail(ExperiencePublic):
    description: str
    cancellation_policy: ExperienceCancellationPolicy
    content_language: ContentLanguage
    status: ExperienceStatus
    host: HostPublic
    media: list[MediaItemPublic]
    created_at: datetime
    published_at: datetime | None


class SearchOut(BaseModel):
    items: list[ExperiencePublic]
    total: int
    limit: int
    offset: int


class ExperienceAdminListItem(BaseModel):
    id: UUID
    title: str
    experience_type: str
    city: str
    country_code: CountryCode
    status: ExperienceStatus
    duration_minutes: int
    prices: list[Money]
    cover_media: MediaPublic | None
    created_at: datetime
    published_at: datetime | None


class AdminListOut(BaseModel):
    items: list[ExperienceAdminListItem]
    total: int
    limit: int
    offset: int


class AdminStatusSummary(BaseModel):
    """Status counts for the admin dashboard — single SQL aggregation."""

    draft: int = 0
    published: int = 0
    unlisted: int = 0
    removed: int = 0
    total: int = 0


class AttachMediaIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    media_id: UUID
    position: int = Field(default=0, ge=0, le=64)


class MediaAttachOut(BaseModel):
    id: UUID
    position: int


class ReorderMediaItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    media_item_id: UUID
    position: int = Field(..., ge=0, le=64)


class ReorderMediaIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    order: list[ReorderMediaItem]
