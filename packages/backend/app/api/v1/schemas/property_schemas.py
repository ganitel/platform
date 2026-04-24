"""
Ganitel V2 Backend - Property API Schemas
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class LocationResponse(BaseModel):
    """Location response schema"""

    id: UUID
    name: str
    region: str | None = None

    class Config:
        from_attributes = True


class PropertyTypeResponse(BaseModel):
    """Property type response schema"""

    id: UUID
    name: str

    class Config:
        from_attributes = True


class AmenityResponse(BaseModel):
    """Amenity response schema"""

    id: UUID
    name_en: str
    name_fr: str
    icon_path: str | None = None

    class Config:
        from_attributes = True


class PropertyAmenityResponse(BaseModel):
    """Property amenity response schema"""

    amenity: AmenityResponse

    class Config:
        from_attributes = True


class ProximityCategoryResponse(BaseModel):
    """Proximity item response"""

    destination_name: str
    minutes_away: int
    travel_mode: str

    class Config:
        from_attributes = True


# Create/Update Schemas
class PropertyCreateRequest(BaseModel):
    """Create property request schema"""

    title: str
    description: str
    short_description: str | None = None
    location_id: UUID
    property_type_id: UUID
    address: str
    latitude: float | None = None
    longitude: float | None = None
    base_price: float
    currency: str = "XAF"
    price_per: str = "night"
    max_guests: int | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    beds: int | None = None
    living_rooms: int | None = None
    balconies: int | None = None
    amenity_ids: list[UUID] | None = []
    images: list[str] | None = []
    instant_book: bool = False
    min_stay: int = 1
    max_stay: int | None = None
    check_in_time: str = "15:00"
    check_out_time: str = "11:00"

    @field_validator("title")
    @classmethod
    def validate_title(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Title must be at least 10 characters long")
        if len(v.strip()) > 200:
            raise ValueError("Title must be less than 200 characters")
        return v.strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v):
        if len(v.strip()) < 50:
            raise ValueError("Description must be at least 50 characters long")
        return v.strip()

    @field_validator("base_price")
    @classmethod
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("Base price must be greater than 0")
        if v > 10000000:
            raise ValueError("Base price is too high")
        return v

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v):
        if v is not None and (v < -90 or v > 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v):
        if v is not None and (v < -180 or v > 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v

    @field_validator(
        "max_guests", "bedrooms", "bathrooms", "beds", "living_rooms", "balconies"
    )
    @classmethod
    def validate_positive_integers(cls, v):
        if v is not None and v < 0:
            raise ValueError("Value cannot be negative")
        return v

    @field_validator("min_stay")
    @classmethod
    def validate_min_stay(cls, v):
        if v < 1:
            raise ValueError("Minimum stay must be at least 1")
        return v


class PropertyUpdateRequest(BaseModel):
    """Update property request schema"""

    title: str | None = None
    description: str | None = None
    short_description: str | None = None
    location_id: UUID | None = None
    property_type_id: UUID | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    base_price: float | None = None
    currency: str | None = None
    price_per: str | None = None
    max_guests: int | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    beds: int | None = None
    living_rooms: int | None = None
    balconies: int | None = None
    amenity_ids: list[UUID] | None = None
    images: list[str] | None = None
    instant_book: bool | None = None
    min_stay: int | None = None
    max_stay: int | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None


# Response Schemas
class PropertyBaseResponse(BaseModel):
    """Base property response schema"""

    id: UUID
    title: str
    description: str
    short_description: str | None
    address: str
    latitude: float | None
    longitude: float | None
    base_price: float
    currency: str
    price_per: str
    max_guests: int | None
    bedrooms: int | None
    bathrooms: int | None
    beds: int | None
    living_rooms: int | None
    balconies: int | None
    images: list[str] | None
    instant_book: bool
    min_stay: int
    max_stay: int | None
    check_in_time: str
    check_out_time: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PropertyResponse(PropertyBaseResponse):
    """Full property response schema with relationships"""

    location: LocationResponse
    property_type: PropertyTypeResponse
    property_amenities: list[PropertyAmenityResponse] = []

    class Config:
        from_attributes = True


class PropertyListResponse(BaseModel):
    """Property list response schema"""

    items: list[PropertyResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

    class Config:
        from_attributes = True


class PropertyDetailResponse(PropertyResponse):
    """Property detail response with additional fields"""

    provider_id: UUID

    class Config:
        from_attributes = True


class PropertyCreateResponse(PropertyResponse):
    """Property create response"""

    provider_id: UUID

    class Config:
        from_attributes = True


class PropertyUpdateResponse(PropertyResponse):
    """Property update response"""

    pass

    class Config:
        from_attributes = True


class PropertySimpleResponse(BaseModel):
    """Simple property response for listings"""

    id: UUID
    title: str
    short_description: str | None
    base_price: float
    currency: str
    location: LocationResponse
    property_type: PropertyTypeResponse
    images: list[str] | None
    instant_book: bool

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Message response schema"""

    message: str
