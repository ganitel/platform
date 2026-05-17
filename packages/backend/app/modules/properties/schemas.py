"""Pydantic schemas for properties — listing inputs, public search
results, and full detail responses. Money is exposed via the shared
`Money` value object so the wire shape is `{amount, currency}` even
though storage splits it into two columns."""

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.money import Money
from app.modules.media.schemas import MediaPublic
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
    house_rules: str | None = Field(default=None, max_length=4000)
    cancellation_policy: CancellationPolicy = CancellationPolicy.MODERATE
    base_price: Money
    content_language: ContentLanguage = "fr"


class PropertyUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, max_length=10_000)
    property_type: str | None = None
    city: str | None = None
    country_code: CountryCode | None = None
    location: GeoPoint | None = None
    capacity: int | None = Field(default=None, ge=1, le=64)
    bedrooms: int | None = Field(default=None, ge=0, le=32)
    beds: int | None = Field(default=None, ge=0, le=64)
    bathrooms: int | None = Field(default=None, ge=0, le=32)
    amenities: list[str] | None = None
    parking_available: ParkingAvailability | None = None
    elevator: bool | None = None
    accessible: bool | None = None
    private_bathroom: bool | None = None
    kitchen_type: KitchenType | None = None
    events_allowed: bool | None = None
    family_friendly: bool | None = None
    child_friendly: bool | None = None
    house_rules: str | None = None
    cancellation_policy: CancellationPolicy | None = None
    base_price: Money | None = None
    content_language: ContentLanguage | None = None


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
    smoking_allowed: bool | None
    pets_allowed: bool | None
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


class PropertyPublic(BaseModel):
    """Returned in search results — leaner than detail."""

    id: UUID
    title: str
    property_type: str
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
    cover_photo: MediaPublic | None
    distance_km: float | None = None


class PropertyDetail(PropertyPublic):
    description: str
    house_rules: str | None
    cancellation_policy: CancellationPolicy
    content_language: ContentLanguage
    status: PropertyStatus
    host: HostPublic
    photos: list[MediaPublic]
    created_at: datetime
    published_at: datetime | None


class AttachPhotoIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    media_id: UUID
    position: int = Field(default=0, ge=0, le=64)


class SearchOut(BaseModel):
    items: list[PropertyPublic]
    total: int
    limit: int
    offset: int
