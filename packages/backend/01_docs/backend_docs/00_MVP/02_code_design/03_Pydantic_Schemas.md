# 🔧 Ganitel V2 Backend - Pydantic Schemas Implementation

This document provides complete implementation details for all Pydantic schemas used for API request/response validation and serialization.

---

## 🏗️ Base Schema Classes (app/schemas/base.py)

```python
from pydantic import BaseModel, ConfigDict, Field, validator
from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID
import re

class BaseSchema(BaseModel):
    """Base schema with common configuration"""
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True,
        use_enum_values=True
    )

class TimestampMixin(BaseModel):
    """Mixin for timestamp fields"""
    created_at: datetime
    updated_at: datetime

class IDMixin(BaseModel):
    """Mixin for ID field"""
    id: UUID

class ResponseMixin(IDMixin, TimestampMixin):
    """Mixin for response schemas"""
    pass

class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints"""
    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=20, ge=1, le=100, description="Page size")
    
    @property
    def offset(self) -> int:
        """Calculate offset for database queries"""
        return (self.page - 1) * self.size

class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: list[Any]
    total: int
    page: int
    size: int
    pages: int
    
    @validator('pages', always=True)
    def calculate_pages(cls, v, values):
        total = values.get('total', 0)
        size = values.get('size', 20)
        return (total + size - 1) // size if total > 0 else 0

class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SuccessResponse(BaseModel):
    """Success response schema"""
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None
```

---

## 👥 User Schemas (app/schemas/users.py)

```python
from pydantic import BaseModel, EmailStr, Field, validator, root_validator
from typing import Optional, Dict, List, Any
from datetime import datetime, date
from enum import Enum
import re

from app.schemas.base import BaseSchema, ResponseMixin, PaginationParams
from app.models.users import UserRole, UserStatus

# Validation Patterns
WHATSAPP_PATTERN = re.compile(r'^\+[1-9]\d{1,14}$')
NAME_PATTERN = re.compile(r'^[a-zA-ZÀ-ÿ\s\-\']{2,50}$')

class UserPreferences(BaseModel):
    """User preferences schema"""
    language: str = Field(default="fr", regex="^(fr|en)$")
    currency: str = Field(default="XAF", regex="^[A-Z]{3}$")
    timezone: str = Field(default="Africa/Douala")
    notifications: Dict[str, bool] = Field(default={
        "email": True,
        "whatsapp": True,
        "marketing": False
    })
    dietary_restrictions: List[str] = Field(default=[])
    interests: List[str] = Field(default=[])

class UserCreate(BaseSchema):
    """Schema for user creation"""
    whatsapp: str = Field(..., description="WhatsApp number with country code")
    first_name: str = Field(..., min_length=2, max_length=100, description="User's first name")
    last_name: str = Field(..., min_length=2, max_length=100, description="User's last name")
    email: Optional[EmailStr] = Field(None, description="User's email address")
    role: UserRole = Field(default=UserRole.TRAVELER, description="User role")
    preferences: Optional[UserPreferences] = Field(default_factory=UserPreferences)
    
    @validator('whatsapp')
    def validate_whatsapp(cls, v):
        if not WHATSAPP_PATTERN.match(v):
            raise ValueError('Invalid WhatsApp number format. Use +country_code followed by number')
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not NAME_PATTERN.match(v):
            raise ValueError('Name must contain only letters, spaces, hyphens, and apostrophes')
        return v.title()

class UserUpdate(BaseSchema):
    """Schema for user updates"""
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    bio: Optional[str] = Field(None, max_length=1000)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, regex="^(male|female|other|prefer_not_to_say)$")
    secondary_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = None
    preferences: Optional[UserPreferences] = None
    country: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=500)
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v is not None and not NAME_PATTERN.match(v):
            raise ValueError('Name must contain only letters, spaces, hyphens, and apostrophes')
        return v.title() if v else v
    
    @validator('date_of_birth')
    def validate_age(cls, v):
        if v and v > date.today():
            raise ValueError('Date of birth cannot be in the future')
        if v and (date.today() - v).days < 365 * 13:  # Minimum 13 years old
            raise ValueError('User must be at least 13 years old')
        return v

class UserResponse(BaseSchema, ResponseMixin):
    """Schema for user response"""
    whatsapp: str
    first_name: str
    last_name: str
    email: Optional[str]
    role: UserRole
    status: UserStatus
    email_verified: bool
    whatsapp_verified: bool
    email_verified_at: Optional[datetime]
    whatsapp_verified_at: Optional[datetime]
    avatar_url: Optional[str]
    bio: Optional[str]
    date_of_birth: Optional[date]
    gender: Optional[str]
    secondary_phone: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    preferences: UserPreferences
    country: Optional[str]
    city: Optional[str]
    address: Optional[str]
    last_login_at: Optional[datetime]
    login_count: str
    
    # Computed properties
    full_name: str
    is_verified: bool
    preferred_language: str
    preferred_currency: str

class UserSummary(BaseSchema):
    """Simplified user schema for listings"""
    id: UUID
    first_name: str
    last_name: str
    avatar_url: Optional[str]
    role: UserRole
    status: UserStatus
    is_verified: bool
    full_name: str

class UserListParams(PaginationParams):
    """Parameters for user listing"""
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    verified_only: bool = False
    search: Optional[str] = Field(None, min_length=2, max_length=100)
    city: Optional[str] = None
    country: Optional[str] = None

# OTP Schemas
class OTPRequest(BaseSchema):
    """Schema for OTP request"""
    contact: str = Field(..., description="Phone number or email")
    contact_type: str = Field(..., regex="^(whatsapp|sms|email)$")
    purpose: str = Field(..., regex="^(login|registration|verification|password_reset)$")
    
    @validator('contact')
    def validate_contact(cls, v, values):
        contact_type = values.get('contact_type')
        if contact_type in ['whatsapp', 'sms']:
            if not WHATSAPP_PATTERN.match(v):
                raise ValueError('Invalid phone number format')
        elif contact_type == 'email':
            # Basic email validation (Pydantic EmailStr is more thorough)
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
                raise ValueError('Invalid email format')
        return v

class OTPVerify(BaseSchema):
    """Schema for OTP verification"""
    contact: str
    otp_code: str = Field(..., min_length=4, max_length=10)
    purpose: str = Field(..., regex="^(login|registration|verification|password_reset)$")

class OTPResponse(BaseSchema):
    """Schema for OTP response"""
    success: bool
    message: str
    expires_in: Optional[int] = Field(None, description="Seconds until expiration")
    can_retry_in: Optional[int] = Field(None, description="Seconds until next retry allowed")
```

---

## 🏢 Provider Schemas (app/schemas/providers.py)

```python
from pydantic import BaseModel, EmailStr, Field, validator, root_validator
from typing import Optional, Dict, List
from datetime import datetime
from decimal import Decimal

from app.schemas.base import BaseSchema, ResponseMixin, PaginationParams
from app.schemas.users import UserSummary
from app.models.providers import ProviderStatus, BusinessType

class ProviderCreate(BaseSchema):
    """Schema for provider profile creation"""
    business_name: str = Field(..., min_length=2, max_length=200)
    business_description: Optional[str] = Field(None, max_length=2000)
    business_type: BusinessType
    
    # Legal Information
    registration_number: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=100)
    license_number: Optional[str] = Field(None, max_length=100)
    
    # Contact Information
    business_phone: Optional[str] = None
    business_whatsapp: Optional[str] = None
    business_email: Optional[EmailStr] = None
    website: Optional[str] = Field(None, regex=r'^https?://.+')
    
    # Address Information
    street_address: Optional[str] = Field(None, max_length=300)
    city: str = Field(..., min_length=2, max_length=100)
    region: str = Field(..., min_length=2, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: str = Field(default="Cameroon", max_length=100)
    
    # Financial Information
    bank_name: Optional[str] = Field(None, max_length=200)
    account_name: Optional[str] = Field(None, max_length=200)
    account_number: Optional[str] = Field(None, max_length=50)
    swift_code: Optional[str] = Field(None, max_length=20)
    mobile_money_number: Optional[str] = None
    mobile_money_provider: Optional[str] = Field(None, regex="^(orange|mtn|express_union)$")
    
    # Service Categories
    service_categories: List[str] = Field(default=[])
    
    # Business Hours
    business_hours: Dict[str, Dict[str, Any]] = Field(default={})
    
    # Settings
    settings: Dict[str, Any] = Field(default={})
    
    @validator('business_name')
    def validate_business_name(cls, v):
        if not v.strip():
            raise ValueError('Business name cannot be empty')
        return v.strip()

class ProviderUpdate(BaseSchema):
    """Schema for provider profile updates"""
    business_name: Optional[str] = Field(None, min_length=2, max_length=200)
    business_description: Optional[str] = Field(None, max_length=2000)
    business_type: Optional[BusinessType] = None
    
    # Legal Information
    registration_number: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=100)
    license_number: Optional[str] = Field(None, max_length=100)
    
    # Contact Information
    business_phone: Optional[str] = None
    business_whatsapp: Optional[str] = None
    business_email: Optional[EmailStr] = None
    website: Optional[str] = Field(None, regex=r'^https?://.+')
    
    # Address Information
    street_address: Optional[str] = Field(None, max_length=300)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    region: Optional[str] = Field(None, min_length=2, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    
    # Financial Information
    bank_name: Optional[str] = Field(None, max_length=200)
    account_name: Optional[str] = Field(None, max_length=200)
    account_number: Optional[str] = Field(None, max_length=50)
    swift_code: Optional[str] = Field(None, max_length=20)
    mobile_money_number: Optional[str] = None
    mobile_money_provider: Optional[str] = Field(None, regex="^(orange|mtn|express_union)$")
    
    # Platform Settings
    instant_booking_enabled: Optional[bool] = None
    auto_accept_bookings: Optional[bool] = None
    
    # Service Categories
    service_categories: Optional[List[str]] = None
    
    # Business Hours
    business_hours: Optional[Dict[str, Dict[str, Any]]] = None
    
    # Settings
    settings: Optional[Dict[str, Any]] = None

class ProviderResponse(BaseSchema, ResponseMixin):
    """Schema for provider response"""
    user_id: UUID
    business_name: str
    business_description: Optional[str]
    business_type: BusinessType
    
    # Legal Information
    registration_number: Optional[str]
    tax_id: Optional[str]
    license_number: Optional[str]
    
    # Verification Status
    verification_status: ProviderStatus
    verification_date: Optional[datetime]
    
    # Contact Information
    business_phone: Optional[str]
    business_whatsapp: Optional[str]
    business_email: Optional[str]
    website: Optional[str]
    
    # Address Information
    street_address: Optional[str]
    city: str
    region: str
    postal_code: Optional[str]
    country: str
    
    # Business Metrics
    average_rating: Decimal
    total_reviews: int
    total_bookings: int
    successful_bookings: int
    cancelled_bookings: int
    response_rate: Decimal
    response_time_hours: Decimal
    
    # Financial Information
    commission_rate: Decimal
    minimum_payout: Decimal
    
    # Platform Settings
    instant_booking_enabled: bool
    auto_accept_bookings: bool
    
    # Service Categories
    service_categories: List[str]
    
    # Business Hours
    business_hours: Dict[str, Any]
    
    # Additional Settings
    settings: Dict[str, Any]
    
    # Computed properties
    success_rate: float
    cancellation_rate: float
    is_verified: bool

class ProviderWithUser(ProviderResponse):
    """Provider response with user information"""
    user: UserSummary

class ProviderSummary(BaseSchema):
    """Simplified provider schema for listings"""
    id: UUID
    user_id: UUID
    business_name: str
    business_type: BusinessType
    verification_status: ProviderStatus
    city: str
    region: str
    country: str
    average_rating: Decimal
    total_reviews: int
    service_categories: List[str]
    is_verified: bool

class ProviderListParams(PaginationParams):
    """Parameters for provider listing"""
    status: Optional[ProviderStatus] = None
    business_type: Optional[BusinessType] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    service_category: Optional[str] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    verified_only: bool = False
    search: Optional[str] = Field(None, min_length=2, max_length=100)

# Document Schemas
class DocumentUpload(BaseSchema):
    """Schema for document upload"""
    document_type: str = Field(..., regex="^(business_license|tax_certificate|id_card|insurance|other)$")
    original_filename: str = Field(..., max_length=255)
    file_size: int = Field(..., gt=0, le=10_000_000)  # Max 10MB
    mime_type: str = Field(..., regex=r'^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$')
    expires_at: Optional[datetime] = None

class DocumentResponse(BaseSchema, ResponseMixin):
    """Schema for document response"""
    provider_id: UUID
    document_type: str
    document_url: str
    original_filename: str
    file_size: int
    mime_type: str
    verification_status: str
    verified_by: Optional[UUID]
    verified_at: Optional[datetime]
    verification_notes: Optional[str]
    expires_at: Optional[datetime]
    is_expired: bool
    is_verified: bool

class ProviderVerificationUpdate(BaseSchema):
    """Schema for provider verification updates (admin only)"""
    verification_status: ProviderStatus
    verification_notes: Optional[str] = Field(None, max_length=1000)
```

---

## 🏨 Service Schemas (app/schemas/services.py)

```python
from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, Dict, List, Any
from datetime import datetime, date
from decimal import Decimal

from app.schemas.base import BaseSchema, ResponseMixin, PaginationParams
from app.schemas.providers import ProviderSummary
from app.models.services import ServiceStatus, ServiceCategory, PriceUnit

class ServiceCreate(BaseSchema):
    """Schema for service creation"""
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=50, max_length=5000)
    short_description: Optional[str] = Field(None, max_length=500)
    
    # Category
    category_id: UUID = Field(..., description="Service category ID")
    
    # Pricing
    base_price: Decimal = Field(..., gt=0, decimal_places=2)
    currency: str = Field(default="XAF", regex="^[A-Z]{3}$")
    price_unit: PriceUnit
    
    # Capacity and Limitations
    capacity: int = Field(..., gt=0, le=100)
    minimum_booking_duration: int = Field(default=1, gt=0)
    maximum_booking_duration: Optional[int] = Field(None, gt=0)
    booking_advance_notice: int = Field(default=24, ge=1, le=8760)  # 1 hour to 1 year
    
    # Location
    address: Optional[str] = Field(None, max_length=300)
    city: str = Field(..., min_length=2, max_length=100)
    region: str = Field(..., min_length=2, max_length=100)
    country: str = Field(default="Cameroon", max_length=100)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    
    # Availability and Booking
    instant_booking: bool = Field(default=False)
    requires_approval: bool = Field(default=True)
    cancellation_policy: str = Field(default="moderate", regex="^(flexible|moderate|strict)$")
    
    # SEO
    meta_title: Optional[str] = Field(None, max_length=60)
    meta_description: Optional[str] = Field(None, max_length=160)
    keywords: Optional[List[str]] = Field(None, max_items=20)
    
    # Service-Specific Data
    service_specific: Dict[str, Any] = Field(default={})
    
    # Amenities and Features
    amenities: List[str] = Field(default=[])
    features: Dict[str, Any] = Field(default={})
    
    # House Rules and Policies
    house_rules: List[str] = Field(default=[])
    policies: Dict[str, Any] = Field(default={})
    
    # Pricing Rules
    pricing_rules: Dict[str, Any] = Field(default={})
    
    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()
    
    @root_validator
    def validate_coordinates(cls, values):
        lat = values.get('latitude')
        lng = values.get('longitude')
        if (lat is None) != (lng is None):
            raise ValueError('Both latitude and longitude must be provided together')
        return values
    
    @root_validator
    def validate_duration_limits(cls, values):
        min_duration = values.get('minimum_booking_duration', 1)
        max_duration = values.get('maximum_booking_duration')
        if max_duration and max_duration <= min_duration:
            raise ValueError('Maximum booking duration must be greater than minimum')
        return values

class ServiceUpdate(BaseSchema):
    """Schema for service updates"""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=50, max_length=5000)
    short_description: Optional[str] = Field(None, max_length=500)
    
    # Pricing
    base_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    price_unit: Optional[PriceUnit] = None
    
    # Capacity and Limitations
    capacity: Optional[int] = Field(None, gt=0, le=100)
    minimum_booking_duration: Optional[int] = Field(None, gt=0)
    maximum_booking_duration: Optional[int] = Field(None, gt=0)
    booking_advance_notice: Optional[int] = Field(None, ge=1, le=8760)
    
    # Location
    address: Optional[str] = Field(None, max_length=300)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    region: Optional[str] = Field(None, min_length=2, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    
    # Availability and Booking
    instant_booking: Optional[bool] = None
    requires_approval: Optional[bool] = None
    cancellation_policy: Optional[str] = Field(None, regex="^(flexible|moderate|strict)$")
    
    # SEO
    meta_title: Optional[str] = Field(None, max_length=60)
    meta_description: Optional[str] = Field(None, max_length=160)
    keywords: Optional[List[str]] = Field(None, max_items=20)
    
    # Service-Specific Data
    service_specific: Optional[Dict[str, Any]] = None
    
    # Amenities and Features
    amenities: Optional[List[str]] = None
    features: Optional[Dict[str, Any]] = None
    
    # House Rules and Policies
    house_rules: Optional[List[str]] = None
    policies: Optional[Dict[str, Any]] = None
    
    # Pricing Rules
    pricing_rules: Optional[Dict[str, Any]] = None

class ServiceResponse(BaseSchema, ResponseMixin):
    """Schema for service response"""
    title: str
    slug: str
    description: str
    short_description: Optional[str]
    
    # Provider and Category
    provider_id: UUID
    category_id: UUID
    
    # Pricing
    base_price: Decimal
    currency: str
    price_unit: PriceUnit
    
    # Capacity and Limitations
    capacity: int
    minimum_booking_duration: int
    maximum_booking_duration: Optional[int]
    booking_advance_notice: int
    
    # Location
    address: Optional[str]
    city: str
    region: str
    country: str
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    
    # Availability and Booking
    instant_booking: bool
    requires_approval: bool
    cancellation_policy: str
    
    # Service Status
    status: ServiceStatus
    featured: bool
    
    # SEO
    meta_title: Optional[str]
    meta_description: Optional[str]
    keywords: Optional[List[str]]
    
    # Statistics
    views_count: int
    booking_count: int
    average_rating: Decimal
    total_reviews: int
    
    # Service-Specific Data
    service_specific: Dict[str, Any]
    
    # Amenities and Features
    amenities: List[str]
    features: Dict[str, Any]
    
    # House Rules and Policies
    house_rules: List[str]
    policies: Dict[str, Any]
    
    # Pricing Rules
    pricing_rules: Dict[str, Any]
    
    # Computed properties
    is_available_for_booking: bool
    has_coordinates: bool

class ServiceWithDetails(ServiceResponse):
    """Service response with additional details"""
    provider: ProviderSummary
    category: "CategoryResponse"  # Forward reference
    images: List["ServiceImageResponse"]

class ServiceSummary(BaseSchema):
    """Simplified service schema for listings"""
    id: UUID
    title: str
    slug: str
    short_description: Optional[str]
    base_price: Decimal
    currency: str
    price_unit: PriceUnit
    city: str
    region: str
    country: str
    instant_booking: bool
    status: ServiceStatus
    featured: bool
    average_rating: Decimal
    total_reviews: int
    primary_image_url: Optional[str] = None

class ServiceListParams(PaginationParams):
    """Parameters for service listing"""
    category_id: Optional[UUID] = None
    provider_id: Optional[UUID] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    instant_booking_only: bool = False
    featured_only: bool = False
    available_from: Optional[date] = None
    available_to: Optional[date] = None
    guest_count: Optional[int] = Field(None, ge=1)
    search: Optional[str] = Field(None, min_length=2, max_length=100)
    sort_by: str = Field(default="created_at", regex="^(created_at|price|rating|popularity|distance)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")
    
    @root_validator
    def validate_price_range(cls, values):
        min_price = values.get('min_price')
        max_price = values.get('max_price')
        if min_price and max_price and min_price > max_price:
            raise ValueError('Minimum price cannot be greater than maximum price')
        return values

# Category Schemas
class CategoryResponse(BaseSchema, ResponseMixin):
    """Schema for category response"""
    name: str
    code: str
    description: Optional[str]
    icon_url: Optional[str]
    requires_location: bool
    requires_dates: bool
    supports_packages: bool
    sort_order: int
    is_active: bool
    config: Dict[str, Any]
    service_count: int

# Image Schemas
class ServiceImageResponse(BaseSchema, ResponseMixin):
    """Schema for service image response"""
    service_id: UUID
    url: str
    thumbnail_url: Optional[str]
    original_filename: str
    alt_text: Optional[str]
    caption: Optional[str]
    file_size: int
    width: Optional[int]
    height: Optional[int]
    mime_type: str
    is_primary: bool
    sort_order: int

class ImageUpload(BaseSchema):
    """Schema for image upload"""
    original_filename: str = Field(..., max_length=255)
    file_size: int = Field(..., gt=0, le=10_000_000)  # Max 10MB
    width: Optional[int] = Field(None, gt=0)
    height: Optional[int] = Field(None, gt=0)
    mime_type: str = Field(..., regex=r'^image\/(jpeg|png|gif|webp)$')
    alt_text: Optional[str] = Field(None, max_length=255)
    caption: Optional[str] = Field(None, max_length=500)
    is_primary: bool = Field(default=False)

# Availability Schemas
class AvailabilityCreate(BaseSchema):
    """Schema for availability creation"""
    start_date: datetime
    end_date: Optional[datetime] = None
    available: bool = Field(default=True)
    reason: Optional[str] = Field(None, max_length=100)
    price_override: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    minimum_stay: Optional[int] = Field(None, gt=0)
    total_capacity: Optional[int] = Field(None, gt=0)
    available_capacity: Optional[int] = Field(None, gt=0)
    
    @root_validator
    def validate_dates(cls, values):
        start_date = values.get('start_date')
        end_date = values.get('end_date')
        if end_date and start_date and end_date <= start_date:
            raise ValueError('End date must be after start date')
        return values

class AvailabilityResponse(BaseSchema, ResponseMixin):
    """Schema for availability response"""
    service_id: UUID
    start_date: datetime
    end_date: Optional[datetime]
    available: bool
    reason: Optional[str]
    price_override: Optional[Decimal]
    minimum_stay: Optional[int]
    total_capacity: Optional[int]
    available_capacity: Optional[int]
```

This completes the Pydantic schemas for the core entities. Let me continue with booking and payment schemas in the next part.