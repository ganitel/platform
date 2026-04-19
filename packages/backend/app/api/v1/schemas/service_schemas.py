"""
Ganitel V2 Backend - Service API Schemas
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, validator
from enum import Enum

class ServiceType(str, Enum):
    ACCOMMODATION = "accommodation"
    TOUR = "tour"
    ACTIVITY = "activity"
    TRANSPORT = "transport"
    DINING = "dining"
    WELLNESS = "wellness"

class AccommodationType(str, Enum):
    HOTEL = "hotel"
    APARTMENT = "apartment"
    HOUSE = "house"
    VILLA = "villa"
    GUESTHOUSE = "guesthouse"
    HOSTEL = "hostel"
    RESORT = "resort"
    LODGE = "lodge"

class ServiceStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    INACTIVE = "inactive"
    REJECTED = "rejected"
    ARCHIVED = "archived"

# Request Schemas
class ServiceCreateRequest(BaseModel):
    title: str
    description: str
    short_description: Optional[str] = None
    service_type: ServiceType
    accommodation_type: Optional[AccommodationType] = None
    country: str
    city: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    base_price: float
    currency: str = "XAF"
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    beds: Optional[int] = None
    amenities: Optional[List[str]] = []
    house_rules: Optional[List[str]] = []
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
    
    @validator('max_guests', 'bedrooms', 'bathrooms', 'beds')
    def validate_positive_integers(cls, v):
        if v is not None and v < 0:
            raise ValueError('Value cannot be negative')
        return v
    
    @validator('min_stay')
    def validate_min_stay(cls, v):
        if v < 1:
            raise ValueError('Minimum stay must be at least 1')
        return v

class ServiceUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    base_price: Optional[float] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    beds: Optional[int] = None
    amenities: Optional[List[str]] = None
    house_rules: Optional[List[str]] = None
    instant_book: Optional[bool] = None
    min_stay: Optional[int] = None
    max_stay: Optional[int] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None

# Response Schemas
class ServiceLocationResponse(BaseModel):
    country: str
    city: str
    address: str
    latitude: Optional[float]
    longitude: Optional[float]

class ServicePricingResponse(BaseModel):
    base_price: float
    currency: str
    price_per: str

class ServiceCapacityResponse(BaseModel):
    max_guests: Optional[int]
    bedrooms: Optional[int]
    bathrooms: Optional[int]
    beds: Optional[int]

class ServiceRatingResponse(BaseModel):
    average: float
    count: int

class ServiceBookingInfoResponse(BaseModel):
    instant_book: bool
    min_stay: int
    max_stay: Optional[int]
    check_in_time: Optional[str]
    check_out_time: Optional[str]

class ServiceStatsResponse(BaseModel):
    view_count: int
    booking_count: int

class ServiceResponse(BaseModel):
    id: str
    title: str
    description: str
    short_description: Optional[str]
    service_type: ServiceType
    accommodation_type: Optional[AccommodationType]
    status: ServiceStatus
    provider_id: str
    location: ServiceLocationResponse
    pricing: ServicePricingResponse
    capacity: ServiceCapacityResponse
    amenities: List[str]
    house_rules: List[str]
    images: List[str]
    primary_image: Optional[str]
    rating: ServiceRatingResponse
    booking_info: ServiceBookingInfoResponse
    stats: ServiceStatsResponse
    slug: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    @classmethod
    def from_orm(cls, service):
        return cls(
            id=str(service.id),
            title=service.title,
            description=service.description,
            short_description=service.short_description,
            service_type=ServiceType(service.service_type),
            accommodation_type=AccommodationType(service.accommodation_type) if service.accommodation_type else None,
            status=ServiceStatus(service.status),
            provider_id=str(service.provider_id),
            location=ServiceLocationResponse(
                country=service.country,
                city=service.city,
                address=service.address,
                latitude=float(service.latitude) if service.latitude else None,
                longitude=float(service.longitude) if service.longitude else None
            ),
            pricing=ServicePricingResponse(
                base_price=float(service.base_price),
                currency=service.currency,
                price_per=service.price_per
            ),
            capacity=ServiceCapacityResponse(
                max_guests=service.max_guests,
                bedrooms=service.bedrooms,
                bathrooms=service.bathrooms,
                beds=service.beds
            ),
            amenities=service.amenities or [],
            house_rules=service.house_rules or [],
            images=service.images or [],
            primary_image=service.primary_image,
            rating=ServiceRatingResponse(
                average=float(service.average_rating),
                count=service.review_count
            ),
            booking_info=ServiceBookingInfoResponse(
                instant_book=service.instant_book,
                min_stay=service.min_stay,
                max_stay=service.max_stay,
                check_in_time=service.check_in_time,
                check_out_time=service.check_out_time
            ),
            stats=ServiceStatsResponse(
                view_count=service.view_count,
                booking_count=service.booking_count
            ),
            slug=service.slug,
            created_at=service.created_at,
            updated_at=service.updated_at
        )
    
    class Config:
        from_attributes = True

class ServiceListResponse(BaseModel):
    services: List[ServiceResponse]
    total: int
    page: int
    per_page: int
    pages: int

class ServiceSearchFilters(BaseModel):
    query: Optional[str]
    service_type: Optional[str]
    location: Optional[str]
    price_range: Optional[str]
    amenities: Optional[List[str]]
    guests: Optional[int]
    dates: Optional[str]

class ServiceSearchPagination(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool

class ServiceSearchResponse(BaseModel):
    services: List[Dict[str, Any]]
    pagination: ServiceSearchPagination
    filters_applied: ServiceSearchFilters

class MessageResponse(BaseModel):
    message: str
    success: bool = True