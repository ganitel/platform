"""Pydantic schemas for properties — listing inputs, public search
results, and full detail responses. Money is exposed via the shared
`Money` value object so the wire shape is `{amount, currency}` even
though storage splits it into two columns."""

from datetime import datetime, time
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.money import Money
from app.modules.media.schemas import MediaItemPublic, MediaPublic
from app.modules.properties.models import (
    CancellationPolicy,
    KitchenType,
    ParkingAvailability,
    PropertyStatus,
)

# ISO 3166-1 alpha-2, uppercase. Clients normalize to uppercase before sending.
CountryCode = Annotated[str, Field(min_length=2, max_length=2, pattern=r"^[A-Z]{2}$")]
ContentLanguage = Literal["fr", "en"]


class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class PropertyCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=3, max_length=180)
    description: str = Field(default="", max_length=10_000)
    property_type: str = Field(..., min_length=2, max_length=40)
    address: str | None = Field(default=None, max_length=300)
    city: str = Field(..., min_length=1, max_length=120)
    country_code: CountryCode
    location: GeoPoint
    capacity: int = Field(..., ge=1, le=64)
    bedrooms: int = Field(default=0, ge=0, le=32)
    beds: int = Field(default=0, ge=0, le=64)
    bathrooms: int = Field(default=0, ge=0, le=32)
    amenities: list[str] = Field(default_factory=list, max_length=64)
    parking_available: ParkingAvailability = ParkingAvailability.NONE
    elevator: bool = False
    accessible: bool = False
    private_bathroom: bool = False
    kitchen_type: KitchenType = KitchenType.NONE
    events_allowed: bool = False
    family_friendly: bool = False
    child_friendly: bool = False
    pets_allowed: bool = False
    smoking_allowed: bool = False
    check_in_time: time | None = None
    check_out_time: time | None = None
    house_rules: str | None = Field(default=None, max_length=4000)
    cancellation_policy: CancellationPolicy = CancellationPolicy.MODERATE
    base_price: Money
    content_language: ContentLanguage = "fr"
    media_ids: list[UUID] = Field(default_factory=list, max_length=20)


class PropertyUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Fields backed by NOT NULL DB columns use a typed default (not `T | None`)
    # so Pydantic rejects explicit `null` natively. Defaults aren't validated
    # (Pydantic v2 default) so the "always-omittable" partial-update semantics
    # still work via the service's `exclude_unset=True`. Fields below that ARE
    # `T | None`/`time | None` are nullable in the DB and accept null on the
    # wire as a "clear this field" signal. The complex types (`location`,
    # `base_price`) need `T | None = None` for omittability, so they have a
    # validator below that rejects explicit null only.
    title: str = Field(default="", min_length=3, max_length=180)
    description: str = Field(default="", max_length=10_000)
    property_type: str = ""
    address: str | None = Field(default=None, max_length=300)
    city: str = ""
    country_code: CountryCode = "CM"
    location: GeoPoint | None = None
    capacity: int = Field(default=0, ge=1, le=64)
    bedrooms: int = Field(default=0, ge=0, le=32)
    beds: int = Field(default=0, ge=0, le=64)
    bathrooms: int = Field(default=0, ge=0, le=32)
    amenities: list[str] = Field(default_factory=list)
    parking_available: ParkingAvailability = ParkingAvailability.NONE
    elevator: bool = False
    accessible: bool = False
    private_bathroom: bool = False
    kitchen_type: KitchenType = KitchenType.NONE
    events_allowed: bool = False
    family_friendly: bool = False
    child_friendly: bool = False
    pets_allowed: bool = False
    smoking_allowed: bool = False
    check_in_time: time | None = None  # DB column is nullable
    check_out_time: time | None = None  # DB column is nullable
    house_rules: str | None = None  # DB column is nullable
    cancellation_policy: CancellationPolicy = CancellationPolicy.MODERATE
    base_price: Money | None = None
    content_language: ContentLanguage = "fr"

    @field_validator("location", "base_price", mode="after")
    @classmethod
    def _reject_explicit_null_complex(cls, v):
        if v is None:
            raise ValueError("must not be null; omit the field for a partial update")
        return v


class HostPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str
    avatar_url: str | None


class PropertyShowcaseAmenities(BaseModel):
    """Curated amenity flags for listing cards and quick filters."""

    has_wifi: bool
    has_ac: bool
    has_gym: bool
    smoking_allowed: bool
    pets_allowed: bool
    highlights: dict[str, bool]


class PropertyListingMetadata(BaseModel):
    parking_available: ParkingAvailability
    elevator: bool
    accessible: bool
    private_bathroom: bool
    kitchen_type: KitchenType
    events_allowed: bool
    family_friendly: bool
    child_friendly: bool
    pets_allowed: bool
    smoking_allowed: bool
    check_in_time: time | None
    check_out_time: time | None


class PropertyPublic(BaseModel):
    """Returned in search results — leaner than detail."""

    id: UUID
    title: str
    property_type: str
    address: str | None
    city: str
    country_code: CountryCode
    location: GeoPoint
    capacity: int
    bedrooms: int
    beds: int
    bathrooms: int
    base_price: Money
    amenities: list[str]
    showcase_amenities: PropertyShowcaseAmenities
    listing_metadata: PropertyListingMetadata
    cover_media: MediaPublic | None
    distance_km: float | None = None


class PropertyDetail(PropertyPublic):
    description: str
    house_rules: str | None
    cancellation_policy: CancellationPolicy
    content_language: ContentLanguage
    status: PropertyStatus
    host: HostPublic
    media: list[MediaItemPublic]
    created_at: datetime
    published_at: datetime | None


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


class SearchOut(BaseModel):
    items: list[PropertyPublic]
    total: int
    limit: int
    offset: int


class PropertyAdminListItem(BaseModel):
    id: UUID
    title: str
    property_type: str
    city: str
    country_code: CountryCode
    status: PropertyStatus
    base_price: Money
    cover_media: MediaPublic | None
    created_at: datetime
    published_at: datetime | None


class AdminListOut(BaseModel):
    items: list[PropertyAdminListItem]
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
