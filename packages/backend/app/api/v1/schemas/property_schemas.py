"""
Ganitel V2 Backend - Property API Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, validator
from uuid import UUID


class LocationResponse(BaseModel):
    """Location response schema"""
    id: UUID
    name: str
    region: Optional[str] = None

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
    icon_path: Optional[str] = None

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
    short_description: Optional[str] = None
    location_id: UUID
    property_type_id: UUID
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    base_price: float
    currency: str = "XAF"
    price_per: str = "night"
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    beds: Optional[int] = None
    living_rooms: Optional[int] = None
    balconies: Optional[int] = None
    amenity_ids: Optional[List[UUID]] = []
    images: Optional[List[str]] = []
    instant_book: bool = False
    min_stay: int = 1
    max_stay: Optional[int] = None
    check_in_time: str = "15:00"
    check_out_time: str = "11:00"

    @validator('title')
    def validate_title(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Title must be at least 10 characters long')
        if len(v.strip()) > 200:
            raise ValueError('Title must be less than 200 characters')
        return v.strip()

    @validator('description')
    def validate_description(cls, v):
        if len(v.strip()) < 50:
            raise ValueError('Description must be at least 50 characters long')
        return v.strip()

    @validator('base_price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Base price must be greater than 0')
        if v > 10000000:
            raise ValueError('Base price is too high')
        return v

    @validator('latitude')
    def validate_latitude(cls, v):
        if v is not None and (v < -90 or v > 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @validator('longitude')
    def validate_longitude(cls, v):
        if v is not None and (v < -180 or v > 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v

    @validator('max_guests', 'bedrooms', 'bathrooms', 'beds', 'living_rooms', 'balconies')
    def validate_positive_integers(cls, v):
        if v is not None and v < 0:
            raise ValueError('Value cannot be negative')
        return v

    @validator('min_stay')
    def validate_min_stay(cls, v):
        if v < 1:
            raise ValueError('Minimum stay must be at least 1')
        return v


class PropertyUpdateRequest(BaseModel):
    """Update property request schema"""
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    location_id: Optional[UUID] = None
    property_type_id: Optional[UUID] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    base_price: Optional[float] = None
    currency: Optional[str] = None
    price_per: Optional[str] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    beds: Optional[int] = None
    living_rooms: Optional[int] = None
    balconies: Optional[int] = None
    amenity_ids: Optional[List[UUID]] = None
    images: Optional[List[str]] = None
    instant_book: Optional[bool] = None
    min_stay: Optional[int] = None
    max_stay: Optional[int] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None


# Response Schemas
class PropertyBaseResponse(BaseModel):
    """Base property response schema"""
    id: UUID
    title: str
    description: str
    short_description: Optional[str]
    address: str
    latitude: Optional[float]
    longitude: Optional[float]
    base_price: float
    currency: str
    price_per: str
    max_guests: Optional[int]
    bedrooms: Optional[int]
    bathrooms: Optional[int]
    beds: Optional[int]
    living_rooms: Optional[int]
    balconies: Optional[int]
    images: Optional[List[str]]
    instant_book: bool
    min_stay: int
    max_stay: Optional[int]
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
    property_amenities: List[PropertyAmenityResponse] = []

    class Config:
        from_attributes = True


class PropertyListResponse(BaseModel):
    """Property list response schema"""
    items: List[PropertyResponse]
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
    short_description: Optional[str]
    base_price: float
    currency: str
    location: LocationResponse
    property_type: PropertyTypeResponse
    images: Optional[List[str]]
    instant_book: bool

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Message response schema"""
    message: str
