# 📊 Ganitel V2 Backend - Database Models & Schemas Implementation

This document provides complete implementation details for all SQLAlchemy models and Pydantic schemas.

---

## 🏗️ Base Model Architecture

### **Base Model Class (app/models/base.py)**
```python
from sqlalchemy import Column, DateTime, String, Boolean, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declared_attr
from datetime import datetime
import uuid

from app.database import Base

class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class SoftDeleteMixin:
    """Mixin for soft delete functionality"""
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    
    def soft_delete(self):
        """Mark record as deleted"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    def restore(self):
        """Restore soft-deleted record"""
        self.is_deleted = False
        self.deleted_at = None

class BaseModel(Base, TimestampMixin, SoftDeleteMixin):
    """Base model class for all database models"""
    __abstract__ = True
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()")
    )
    
    @declared_attr
    def __tablename__(cls):
        """Auto-generate table name from class name"""
        return cls.__name__.lower() + 's'
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
    
    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
```

---

## 👥 User Models (app/models/users.py)

```python
from sqlalchemy import Column, String, Boolean, Enum, Text, JSON, DateTime, Index
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.models.base import BaseModel

class UserRole(str, PyEnum):
    """User role enumeration"""
    TRAVELER = "traveler"
    PROVIDER = "provider"
    ADMIN = "admin"

class UserStatus(str, PyEnum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"

class User(BaseModel):
    """User model for all platform users"""
    
    # Basic Information
    email = Column(String(255), unique=True, index=True, nullable=True)
    whatsapp = Column(String(20), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    
    # Authentication
    role = Column(Enum(UserRole), default=UserRole.TRAVELER, nullable=False, index=True)
    status = Column(Enum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False, index=True)
    
    # Verification Status
    email_verified = Column(Boolean, default=False, nullable=False)
    whatsapp_verified = Column(Boolean, default=False, nullable=False)
    email_verified_at = Column(DateTime, nullable=True)
    whatsapp_verified_at = Column(DateTime, nullable=True)
    
    # Profile Information
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String(20), nullable=True)
    
    # Contact Information
    secondary_phone = Column(String(20), nullable=True)
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    
    # Preferences (JSON field for flexibility)
    preferences = Column(JSON, default=dict, nullable=False)
    # Example preferences structure:
    # {
    #     "language": "fr",
    #     "currency": "XAF",
    #     "timezone": "Africa/Douala",
    #     "notifications": {
    #         "email": True,
    #         "whatsapp": True,
    #         "marketing": False
    #     },
    #     "dietary_restrictions": ["vegetarian"],
    #     "interests": ["culture", "food", "adventure"]
    # }
    
    # Location Information
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    
    # Platform Activity
    last_login_at = Column(DateTime, nullable=True)
    login_count = Column(String(10), default="0", nullable=False)
    
    # Relationships
    provider_profile = relationship("Provider", back_populates="user", uselist=False)
    bookings = relationship("Booking", back_populates="guest")
    reviews = relationship("Review", back_populates="reviewer")
    cart_items = relationship("CartItem", back_populates="user")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_user_whatsapp_status', 'whatsapp', 'status'),
        Index('idx_user_role_status', 'role', 'status'),
        Index('idx_user_created_at', 'created_at'),
    )
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_verified(self) -> bool:
        """Check if user is fully verified"""
        return self.whatsapp_verified and (not self.email or self.email_verified)
    
    @property
    def preferred_language(self) -> str:
        """Get user's preferred language"""
        return self.preferences.get("language", "fr")
    
    @property
    def preferred_currency(self) -> str:
        """Get user's preferred currency"""
        return self.preferences.get("currency", "XAF")

class UserOTP(BaseModel):
    """OTP verification model"""
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    contact = Column(String(20), nullable=False, index=True)
    otp_code = Column(String(10), nullable=False)
    contact_type = Column(Enum(ContactType), nullable=False)
    purpose = Column(String(50), nullable=False)  # "login", "registration", "verification"
    
    # OTP Metadata
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    
    # Rate limiting
    last_sent_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User")
    
    @property
    def is_expired(self) -> bool:
        """Check if OTP is expired"""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_verified(self) -> bool:
        """Check if OTP is verified"""
        return self.verified_at is not None
    
    @property
    def can_retry(self) -> bool:
        """Check if can retry OTP"""
        return self.attempts < self.max_attempts and not self.is_expired

class ContactType(str, PyEnum):
    """Contact type enumeration"""
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"
```

---

## 🏢 Provider Models (app/models/providers.py)

```python
from sqlalchemy import Column, String, Text, Enum, Numeric, Boolean, JSON, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum as PyEnum
from decimal import Decimal

from app.models.base import BaseModel

class ProviderStatus(str, PyEnum):
    """Provider verification status"""
    PENDING_REVIEW = "pending_review"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    SUSPENDED = "suspended"
    REJECTED = "rejected"

class BusinessType(str, PyEnum):
    """Business type enumeration"""
    INDIVIDUAL = "individual"
    COMPANY = "company"
    AGENCY = "agency"
    GOVERNMENT = "government"

class Provider(BaseModel):
    """Provider profile model"""
    
    # Link to User
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Business Information
    business_name = Column(String(200), nullable=False, index=True)
    business_description = Column(Text, nullable=True)
    business_type = Column(Enum(BusinessType), nullable=False, index=True)
    
    # Legal Information
    registration_number = Column(String(100), nullable=True, index=True)
    tax_id = Column(String(100), nullable=True)
    license_number = Column(String(100), nullable=True)
    
    # Verification Status
    verification_status = Column(Enum(ProviderStatus), default=ProviderStatus.PENDING_REVIEW, nullable=False, index=True)
    verification_date = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    
    # Contact Information
    business_phone = Column(String(20), nullable=True)
    business_whatsapp = Column(String(20), nullable=True)
    business_email = Column(String(255), nullable=True)
    website = Column(String(500), nullable=True)
    
    # Address Information
    street_address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=False, index=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), default="Cameroon", nullable=False, index=True)
    
    # Business Metrics
    average_rating = Column(Numeric(3, 2), default=Decimal("0.00"), nullable=False, index=True)
    total_reviews = Column(Integer, default=0, nullable=False)
    total_bookings = Column(Integer, default=0, nullable=False)
    successful_bookings = Column(Integer, default=0, nullable=False)
    cancelled_bookings = Column(Integer, default=0, nullable=False)
    
    # Response Metrics
    response_rate = Column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    response_time_hours = Column(Numeric(8, 2), default=Decimal("24.00"), nullable=False)
    
    # Financial Information
    bank_name = Column(String(200), nullable=True)
    account_name = Column(String(200), nullable=True)
    account_number = Column(String(50), nullable=True)
    swift_code = Column(String(20), nullable=True)
    mobile_money_number = Column(String(20), nullable=True)
    mobile_money_provider = Column(String(50), nullable=True)
    
    # Commission Settings
    commission_rate = Column(Numeric(5, 4), default=Decimal("0.1000"), nullable=False)  # 10%
    minimum_payout = Column(Numeric(12, 2), default=Decimal("50000.00"), nullable=False)  # 50,000 XAF
    
    # Platform Settings
    instant_booking_enabled = Column(Boolean, default=False, nullable=False)
    auto_accept_bookings = Column(Boolean, default=False, nullable=False)
    
    # Service Categories (JSON array)
    service_categories = Column(JSON, default=list, nullable=False)
    # Example: ["accommodation", "vehicle_rental", "tours"]
    
    # Business Hours (JSON object)
    business_hours = Column(JSON, default=dict, nullable=False)
    # Example: {
    #     "monday": {"open": "08:00", "close": "18:00", "closed": False},
    #     "tuesday": {"open": "08:00", "close": "18:00", "closed": False},
    #     ...
    # }
    
    # Additional Settings
    settings = Column(JSON, default=dict, nullable=False)
    # Example: {
    #     "booking_advance_notice": 24,  # hours
    #     "cancellation_policy": "moderate",
    #     "languages": ["fr", "en"],
    #     "currencies_accepted": ["XAF", "EUR"],
    #     "payment_methods": ["mobile_money", "bank_transfer"]
    # }
    
    # Relationships
    user = relationship("User", back_populates="provider_profile")
    services = relationship("Service", back_populates="provider")
    packages = relationship("Package", back_populates="provider")
    documents = relationship("ProviderDocument", back_populates="provider")
    
    @property
    def success_rate(self) -> float:
        """Calculate booking success rate"""
        if self.total_bookings == 0:
            return 0.0
        return (self.successful_bookings / self.total_bookings) * 100
    
    @property
    def cancellation_rate(self) -> float:
        """Calculate booking cancellation rate"""
        if self.total_bookings == 0:
            return 0.0
        return (self.cancelled_bookings / self.total_bookings) * 100
    
    @property
    def is_verified(self) -> bool:
        """Check if provider is verified"""
        return self.verification_status == ProviderStatus.VERIFIED

class ProviderDocument(BaseModel):
    """Provider verification documents"""
    
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False, index=True)
    # Types: business_license, tax_certificate, id_card, insurance, etc.
    
    document_url = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    
    # Verification
    verification_status = Column(String(20), default="pending", nullable=False, index=True)
    verified_by = Column(UUID(as_uuid=True), nullable=True)  # Admin user ID
    verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    
    # Expiration (for documents with expiry dates)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    provider = relationship("Provider", back_populates="documents")
    
    @property
    def is_expired(self) -> bool:
        """Check if document is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_verified(self) -> bool:
        """Check if document is verified"""
        return self.verification_status == "verified"
```

---

## 🏨 Service Models (app/models/services.py)

```python
from sqlalchemy import Column, String, Text, Enum, Numeric, Boolean, JSON, Integer, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from enum import Enum as PyEnum
from decimal import Decimal

from app.models.base import BaseModel

class ServiceStatus(str, PyEnum):
    """Service status enumeration"""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    REJECTED = "rejected"

class ServiceCategory(str, PyEnum):
    """Service category enumeration"""
    ACCOMMODATION = "accommodation"
    VEHICLE_RENTAL = "vehicle_rental"
    DINING = "dining"
    TOURS_ACTIVITIES = "tours_activities"
    WELLNESS = "wellness"
    FLIGHTS = "flights"

class PriceUnit(str, PyEnum):
    """Price unit enumeration"""
    PER_NIGHT = "per_night"
    PER_DAY = "per_day"
    PER_HOUR = "per_hour"
    PER_PERSON = "per_person"
    PER_GROUP = "per_group"
    FIXED = "fixed"

class Service(BaseModel):
    """Main service model"""
    
    # Basic Information
    title = Column(String(200), nullable=False, index=True)
    slug = Column(String(250), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)
    
    # Provider and Category
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False, index=True)
    
    # Pricing
    base_price = Column(Numeric(12, 2), nullable=False, index=True)
    currency = Column(String(3), default="XAF", nullable=False)
    price_unit = Column(Enum(PriceUnit), nullable=False)
    
    # Capacity and Limitations
    capacity = Column(Integer, nullable=False, index=True)
    minimum_booking_duration = Column(Integer, default=1, nullable=False)  # in units
    maximum_booking_duration = Column(Integer, nullable=True)  # in units
    booking_advance_notice = Column(Integer, default=24, nullable=False)  # hours
    
    # Location
    address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=False, index=True)
    country = Column(String(100), default="Cameroon", nullable=False, index=True)
    latitude = Column(Numeric(10, 8), nullable=True, index=True)
    longitude = Column(Numeric(11, 8), nullable=True, index=True)
    
    # Availability and Booking
    instant_booking = Column(Boolean, default=False, nullable=False, index=True)
    requires_approval = Column(Boolean, default=True, nullable=False)
    cancellation_policy = Column(String(50), default="moderate", nullable=False)
    
    # Service Status
    status = Column(Enum(ServiceStatus), default=ServiceStatus.DRAFT, nullable=False, index=True)
    featured = Column(Boolean, default=False, nullable=False, index=True)
    
    # SEO and Discoverability
    meta_title = Column(String(60), nullable=True)
    meta_description = Column(String(160), nullable=True)
    keywords = Column(ARRAY(String), nullable=True)
    
    # Statistics
    views_count = Column(Integer, default=0, nullable=False)
    booking_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Numeric(3, 2), default=Decimal("0.00"), nullable=False, index=True)
    total_reviews = Column(Integer, default=0, nullable=False)
    
    # Service-Specific Data (JSON field for flexibility)
    service_specific = Column(JSON, default=dict, nullable=False)
    # This will contain category-specific fields:
    # Accommodation: bedrooms, bathrooms, property_type, check_in_time, etc.
    # Vehicle: make, model, year, fuel_type, transmission, etc.
    # Tours: duration, difficulty, group_size, etc.
    
    # Amenities and Features
    amenities = Column(ARRAY(String), default=list, nullable=False)
    features = Column(JSON, default=dict, nullable=False)
    
    # House Rules and Policies
    house_rules = Column(ARRAY(String), default=list, nullable=False)
    policies = Column(JSON, default=dict, nullable=False)
    
    # Pricing Rules (for dynamic pricing)
    pricing_rules = Column(JSON, default=dict, nullable=False)
    # Example: {
    #     "seasonal_rates": [
    #         {
    #             "start_date": "2025-12-15",
    #             "end_date": "2026-01-15",
    #             "adjustment_type": "percentage",
    #             "adjustment_value": 25,
    #             "reason": "Holiday season"
    #         }
    #     ],
    #     "length_of_stay_discounts": [
    #         {"min_nights": 7, "discount_percentage": 10},
    #         {"min_nights": 30, "discount_percentage": 20}
    #     ]
    # }
    
    # Relationships
    provider = relationship("Provider", back_populates="services")
    category = relationship("Category", back_populates="services")
    images = relationship("ServiceImage", back_populates="service", order_by="ServiceImage.sort_order")
    reviews = relationship("Review", back_populates="service")
    bookings = relationship("Booking", back_populates="service")
    availability_blocks = relationship("ServiceAvailability", back_populates="service")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_service_location', 'city', 'region', 'country'),
        Index('idx_service_category_status', 'category_id', 'status'),
        Index('idx_service_price_range', 'base_price', 'currency'),
        Index('idx_service_rating', 'average_rating', 'total_reviews'),
        Index('idx_service_featured', 'featured', 'status'),
        Index('idx_service_coordinates', 'latitude', 'longitude'),
    )
    
    @property
    def is_available_for_booking(self) -> bool:
        """Check if service is available for booking"""
        return self.status == ServiceStatus.ACTIVE
    
    @property
    def has_coordinates(self) -> bool:
        """Check if service has location coordinates"""
        return self.latitude is not None and self.longitude is not None

class Category(BaseModel):
    """Service category model"""
    
    name = Column(String(100), nullable=False, unique=True, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon_url = Column(String(500), nullable=True)
    
    # Category Configuration
    requires_location = Column(Boolean, default=True, nullable=False)
    requires_dates = Column(Boolean, default=True, nullable=False)
    supports_packages = Column(Boolean, default=True, nullable=False)
    
    # Display Settings
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Category-specific configuration
    config = Column(JSON, default=dict, nullable=False)
    # Example: {
    #     "required_fields": ["property_type", "bedrooms"],
    #     "optional_fields": ["bathrooms", "square_meters"],
    #     "amenities": ["wifi", "pool", "parking"],
    #     "booking_settings": {
    #         "min_advance_hours": 24,
    #         "max_advance_days": 365
    #     }
    # }
    
    # Relationships
    services = relationship("Service", back_populates="category")
    
    @property
    def service_count(self) -> int:
        """Get count of active services in this category"""
        return len([s for s in self.services if s.status == ServiceStatus.ACTIVE])

class ServiceImage(BaseModel):
    """Service image model"""
    
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    
    # Image Information
    url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    original_filename = Column(String(255), nullable=False)
    alt_text = Column(String(255), nullable=True)
    caption = Column(String(500), nullable=True)
    
    # Image Metadata
    file_size = Column(Integer, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=False)
    
    # Display Settings
    is_primary = Column(Boolean, default=False, nullable=False, index=True)
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Relationships
    service = relationship("Service", back_populates="images")

class ServiceAvailability(BaseModel):
    """Service availability calendar"""
    
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    
    # Date Range
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=True, index=True)
    
    # Availability Status
    available = Column(Boolean, default=True, nullable=False, index=True)
    reason = Column(String(100), nullable=True)  # "booked", "maintenance", "blocked"
    
    # Dynamic Pricing
    price_override = Column(Numeric(12, 2), nullable=True)
    minimum_stay = Column(Integer, nullable=True)
    
    # Capacity Management
    total_capacity = Column(Integer, nullable=True)
    available_capacity = Column(Integer, nullable=True)
    
    # Relationships
    service = relationship("Service", back_populates="availability_blocks")
    
    # Indexes
    __table_args__ = (
        Index('idx_availability_service_dates', 'service_id', 'start_date', 'end_date'),
        Index('idx_availability_status', 'available', 'start_date'),
    )
```

This completes the core models. Let me continue with the remaining models for bookings, payments, and other components.