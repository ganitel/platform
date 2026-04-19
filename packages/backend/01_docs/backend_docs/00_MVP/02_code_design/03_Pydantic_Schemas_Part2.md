## 📋 Booking Schemas (app/schemas/bookings.py)

```python
from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, Dict, List, Any
from datetime import datetime, date
from decimal import Decimal

from app.schemas.base import BaseSchema, ResponseMixin, PaginationParams
from app.schemas.users import UserSummary
from app.schemas.services import ServiceSummary
from app.models.bookings import BookingStatus, PaymentStatus

class BookingCreate(BaseSchema):
    """Schema for booking creation"""
    service_id: UUID = Field(..., description="Service to book")
    package_id: Optional[UUID] = Field(None, description="Package if booking a package")
    
    # Booking Dates
    check_in_date: datetime = Field(..., description="Check-in date and time")
    check_out_date: datetime = Field(..., description="Check-out date and time")
    
    # Guest Information
    guest_count_adults: int = Field(default=1, ge=1, le=20)
    guest_count_children: int = Field(default=0, ge=0, le=10)
    guest_count_infants: int = Field(default=0, ge=0, le=5)
    
    # Contact Information
    guest_phone: str = Field(..., description="Guest contact phone")
    guest_email: Optional[EmailStr] = Field(None, description="Guest contact email")
    guest_notes: Optional[str] = Field(None, max_length=1000)
    special_requests: Optional[str] = Field(None, max_length=1000)
    
    # Guest Preferences
    guest_preferences: Dict[str, Any] = Field(default={})
    
    # Coupon
    coupon_code: Optional[str] = Field(None, max_length=50)
    
    @validator('guest_phone')
    def validate_guest_phone(cls, v):
        # Use the same WhatsApp pattern validation
        if not re.match(r'^\+[1-9]\d{1,14}$', v):
            raise ValueError('Invalid phone number format')
        return v
    
    @root_validator
    def validate_dates(cls, values):
        check_in = values.get('check_in_date')
        check_out = values.get('check_out_date')
        
        if check_in and check_out:
            if check_out <= check_in:
                raise ValueError('Check-out date must be after check-in date')
            
            # Check if dates are in the future
            now = datetime.utcnow()
            if check_in < now:
                raise ValueError('Check-in date must be in the future')
            
            # Maximum booking advance (2 years)
            max_advance = now.replace(year=now.year + 2)
            if check_in > max_advance:
                raise ValueError('Booking too far in advance')
        
        return values
    
    @root_validator
    def validate_guest_count(cls, values):
        adults = values.get('guest_count_adults', 1)
        children = values.get('guest_count_children', 0)
        infants = values.get('guest_count_infants', 0)
        
        total_guests = adults + children + infants
        if total_guests > 30:  # Reasonable maximum
            raise ValueError('Total guest count exceeds maximum allowed')
        
        return values

class BookingUpdate(BaseSchema):
    """Schema for booking updates"""
    # Guest Information (can be updated before confirmation)
    guest_count_adults: Optional[int] = Field(None, ge=1, le=20)
    guest_count_children: Optional[int] = Field(None, ge=0, le=10)
    guest_count_infants: Optional[int] = Field(None, ge=0, le=5)
    
    # Contact Information
    guest_phone: Optional[str] = None
    guest_email: Optional[EmailStr] = None
    guest_notes: Optional[str] = Field(None, max_length=1000)
    special_requests: Optional[str] = Field(None, max_length=1000)
    
    # Guest Preferences
    guest_preferences: Optional[Dict[str, Any]] = None
    
    # Provider can update these
    provider_notes: Optional[str] = Field(None, max_length=1000)

class BookingStatusUpdate(BaseSchema):
    """Schema for booking status updates (provider/admin only)"""
    status: BookingStatus
    notes: Optional[str] = Field(None, max_length=1000)
    cancellation_reason: Optional[str] = Field(None, max_length=500)

class BookingResponse(BaseSchema, ResponseMixin):
    """Schema for booking response"""
    booking_number: str
    
    # Relationships
    guest_id: UUID
    service_id: UUID
    package_id: Optional[UUID]
    
    # Booking Dates
    check_in_date: datetime
    check_out_date: datetime
    booking_date: datetime
    
    # Guest Information
    guest_count_adults: int
    guest_count_children: int
    guest_count_infants: int
    
    # Contact Information
    guest_phone: str
    guest_email: Optional[str]
    guest_notes: Optional[str]
    special_requests: Optional[str]
    
    # Pricing Details
    base_price: Decimal
    total_nights: int
    subtotal: Decimal
    service_fee: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    
    # Payment Information
    payment_status: PaymentStatus
    payment_method: Optional[str]
    payment_due_date: Optional[datetime]
    
    # Booking Status
    status: BookingStatus
    confirmed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    cancellation_reason: Optional[str]
    cancelled_by: Optional[UUID]
    
    # Check-in/out Information
    actual_check_in: Optional[datetime]
    actual_check_out: Optional[datetime]
    early_check_in_requested: bool
    late_check_out_requested: bool
    
    # Provider Actions
    provider_notes: Optional[str]
    provider_response_date: Optional[datetime]
    
    # Pricing Breakdown
    pricing_breakdown: Dict[str, Any]
    
    # Guest Preferences
    guest_preferences: Dict[str, Any]
    
    # Commission Tracking
    commission_rate: Decimal
    commission_amount: Decimal
    commission_paid: bool
    commission_paid_at: Optional[datetime]
    
    # Computed properties
    duration_nights: int
    total_guests: int
    is_active: bool
    can_be_cancelled: bool
    is_past_due: bool

class BookingWithDetails(BookingResponse):
    """Booking response with related details"""
    guest: UserSummary
    service: ServiceSummary
    package: Optional["PackageSummary"] = None  # Forward reference
    payments: List["PaymentResponse"] = []
    reviews: List["ReviewResponse"] = []

class BookingSummary(BaseSchema):
    """Simplified booking schema for listings"""
    id: UUID
    booking_number: str
    service_id: UUID
    guest_id: UUID
    check_in_date: datetime
    check_out_date: datetime
    total_amount: Decimal
    currency: str
    status: BookingStatus
    payment_status: PaymentStatus
    total_guests: int
    created_at: datetime

class BookingListParams(PaginationParams):
    """Parameters for booking listing"""
    guest_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    provider_id: Optional[UUID] = None
    status: Optional[BookingStatus] = None
    payment_status: Optional[PaymentStatus] = None
    check_in_from: Optional[date] = None
    check_in_to: Optional[date] = None
    booking_from: Optional[date] = None
    booking_to: Optional[date] = None
    search: Optional[str] = Field(None, min_length=2, max_length=100)
    sort_by: str = Field(default="created_at", regex="^(created_at|check_in_date|total_amount|status)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")

# Cart Schemas
class CartItemAdd(BaseSchema):
    """Schema for adding items to cart"""
    service_id: UUID
    package_id: Optional[UUID] = None
    check_in_date: datetime
    check_out_date: datetime
    guest_count_adults: int = Field(default=1, ge=1, le=20)
    guest_count_children: int = Field(default=0, ge=0, le=10)
    guest_count_infants: int = Field(default=0, ge=0, le=5)
    special_requests: Optional[str] = Field(None, max_length=1000)
    selected_options: Dict[str, Any] = Field(default={})
    
    @root_validator
    def validate_dates(cls, values):
        check_in = values.get('check_in_date')
        check_out = values.get('check_out_date')
        
        if check_in and check_out:
            if check_out <= check_in:
                raise ValueError('Check-out date must be after check-in date')
            
            now = datetime.utcnow()
            if check_in < now:
                raise ValueError('Check-in date must be in the future')
        
        return values

class CartItemResponse(BaseSchema, ResponseMixin):
    """Schema for cart item response"""
    user_id: UUID
    service_id: UUID
    package_id: Optional[UUID]
    check_in_date: datetime
    check_out_date: datetime
    guest_count_adults: int
    guest_count_children: int
    guest_count_infants: int
    unit_price: Decimal
    total_price: Decimal
    currency: str
    added_at: datetime
    price_valid_until: datetime
    special_requests: Optional[str]
    selected_options: Dict[str, Any]
    is_price_valid: bool
    total_nights: int

class CartSummary(BaseSchema):
    """Schema for cart summary"""
    total_items: int
    subtotal: Decimal
    estimated_fees: Decimal
    estimated_taxes: Decimal
    estimated_total: Decimal
    currency: str
    items: List[CartItemResponse]
```

---

## 💳 Payment Schemas (app/schemas/payments.py)

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

from app.schemas.base import BaseSchema, ResponseMixin, PaginationParams
from app.models.bookings import PaymentStatus

class PaymentInitiate(BaseSchema):
    """Schema for payment initiation"""
    booking_id: UUID = Field(..., description="Booking to pay for")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Payment amount")
    payment_method: str = Field(..., regex="^(mobile_money|bank_transfer|card|cash)$")
    
    # Payment method specific data
    payment_metadata: Dict[str, Any] = Field(default={})
    # For mobile money: {"phone_number": "+237677123456", "network": "MTN"}
    # For bank transfer: {"bank_name": "UBA", "account_number": "1234567890"}
    # For card: {"save_card": false, "return_url": "https://..."}
    
    @validator('payment_metadata')
    def validate_payment_metadata(cls, v, values):
        payment_method = values.get('payment_method')
        
        if payment_method == 'mobile_money':
            if 'phone_number' not in v:
                raise ValueError('Phone number is required for mobile money payments')
            if 'network' not in v or v['network'] not in ['MTN', 'ORANGE']:
                raise ValueError('Valid network (MTN/ORANGE) is required for mobile money')
        
        elif payment_method == 'bank_transfer':
            if 'account_number' not in v:
                raise ValueError('Account number is required for bank transfers')
        
        return v

class PaymentResponse(BaseSchema, ResponseMixin):
    """Schema for payment response"""
    transaction_id: str
    external_transaction_id: Optional[str]
    booking_id: UUID
    user_id: UUID
    amount: Decimal
    currency: str
    payment_method: str
    gateway_provider: Optional[str]
    gateway_transaction_id: Optional[str]
    gateway_reference: Optional[str]
    status: PaymentStatus
    initiated_at: datetime
    completed_at: Optional[datetime]
    failed_at: Optional[datetime]
    error_code: Optional[str]
    error_message: Optional[str]
    retry_count: int
    payment_metadata: Dict[str, Any]
    gateway_fee: Decimal
    platform_fee: Decimal
    net_amount: Decimal
    refund_amount: Decimal
    refund_reason: Optional[str]
    refunded_at: Optional[datetime]
    refund_transaction_id: Optional[str]
    is_successful: bool
    is_refunded: bool

class PaymentCallback(BaseSchema):
    """Schema for payment gateway callbacks"""
    transaction_id: str
    external_transaction_id: str
    status: str
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    gateway_fee: Optional[Decimal] = None
    callback_data: Dict[str, Any] = Field(default={})
    signature: Optional[str] = None  # For webhook verification

class RefundRequest(BaseSchema):
    """Schema for refund requests"""
    payment_id: UUID = Field(..., description="Payment to refund")
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2, description="Partial refund amount")
    reason: str = Field(..., min_length=10, max_length=500, description="Refund reason")
    
    @validator('reason')
    def validate_reason(cls, v):
        if not v.strip():
            raise ValueError('Refund reason cannot be empty')
        return v.strip()

class PaymentSummary(BaseSchema):
    """Simplified payment schema for listings"""
    id: UUID
    transaction_id: str
    booking_id: UUID
    amount: Decimal
    currency: str
    payment_method: str
    status: PaymentStatus
    initiated_at: datetime
    completed_at: Optional[datetime]

class PaymentListParams(PaginationParams):
    """Parameters for payment listing"""
    booking_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    status: Optional[PaymentStatus] = None
    payment_method: Optional[str] = None
    gateway_provider: Optional[str] = None
    amount_from: Optional[Decimal] = Field(None, ge=0)
    amount_to: Optional[Decimal] = Field(None, ge=0)
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    search: Optional[str] = Field(None, min_length=2, max_length=100)
    sort_by: str = Field(default="initiated_at", regex="^(initiated_at|amount|status)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")
```

---

## ⭐ Review Schemas (app/schemas/reviews.py)

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

from app.schemas.base import BaseSchema, ResponseMixin, PaginationParams
from app.schemas.users import UserSummary

class ReviewCreate(BaseSchema):
    """Schema for review creation"""
    booking_id: UUID = Field(..., description="Booking being reviewed")
    overall_rating: int = Field(..., ge=1, le=5, description="Overall rating (1-5 stars)")
    
    # Detailed Ratings (optional)
    cleanliness_rating: Optional[int] = Field(None, ge=1, le=5)
    communication_rating: Optional[int] = Field(None, ge=1, le=5)
    value_rating: Optional[int] = Field(None, ge=1, le=5)
    location_rating: Optional[int] = Field(None, ge=1, le=5)
    accuracy_rating: Optional[int] = Field(None, ge=1, le=5)
    
    # Review Content
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    comment: Optional[str] = Field(None, min_length=10, max_length=2000)
    
    # Additional Information
    language: str = Field(default="fr", regex="^(fr|en)$")
    would_recommend: Optional[bool] = None
    
    @validator('comment')
    def validate_comment(cls, v):
        if v and not v.strip():
            raise ValueError('Comment cannot be empty if provided')
        return v.strip() if v else v

class ReviewUpdate(BaseSchema):
    """Schema for review updates"""
    overall_rating: Optional[int] = Field(None, ge=1, le=5)
    cleanliness_rating: Optional[int] = Field(None, ge=1, le=5)
    communication_rating: Optional[int] = Field(None, ge=1, le=5)
    value_rating: Optional[int] = Field(None, ge=1, le=5)
    location_rating: Optional[int] = Field(None, ge=1, le=5)
    accuracy_rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    comment: Optional[str] = Field(None, min_length=10, max_length=2000)
    would_recommend: Optional[bool] = None

class ReviewResponse(BaseSchema, ResponseMixin):
    """Schema for review response"""
    booking_id: UUID
    service_id: UUID
    reviewer_id: UUID
    overall_rating: int
    cleanliness_rating: Optional[int]
    communication_rating: Optional[int]
    value_rating: Optional[int]
    location_rating: Optional[int]
    accuracy_rating: Optional[int]
    title: Optional[str]
    comment: Optional[str]
    language: str
    would_recommend: Optional[bool]
    is_published: bool
    is_verified: bool
    moderated_at: Optional[datetime]
    moderated_by: Optional[UUID]
    moderation_notes: Optional[str]
    provider_response: Optional[str]
    provider_response_date: Optional[datetime]
    helpful_votes: int
    total_votes: int
    average_detailed_rating: float
    helpfulness_score: float

class ReviewWithReviewer(ReviewResponse):
    """Review response with reviewer information"""
    reviewer: UserSummary

class ReviewSummary(BaseSchema):
    """Simplified review schema for listings"""
    id: UUID
    service_id: UUID
    reviewer_id: UUID
    overall_rating: int
    title: Optional[str]
    comment: Optional[str]
    created_at: datetime
    reviewer_name: str
    reviewer_avatar: Optional[str]

class ReviewListParams(PaginationParams):
    """Parameters for review listing"""
    service_id: Optional[UUID] = None
    reviewer_id: Optional[UUID] = None
    booking_id: Optional[UUID] = None
    min_rating: Optional[int] = Field(None, ge=1, le=5)
    max_rating: Optional[int] = Field(None, ge=1, le=5)
    published_only: bool = True
    verified_only: bool = False
    language: Optional[str] = Field(None, regex="^(fr|en)$")
    sort_by: str = Field(default="created_at", regex="^(created_at|rating|helpfulness)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")

class ProviderResponse(BaseSchema):
    """Schema for provider response to review"""
    review_id: UUID = Field(..., description="Review being responded to")
    response: str = Field(..., min_length=10, max_length=1000, description="Provider response")
    
    @validator('response')
    def validate_response(cls, v):
        if not v.strip():
            raise ValueError('Response cannot be empty')
        return v.strip()

class ReviewHelpful(BaseSchema):
    """Schema for marking review as helpful"""
    helpful: bool = Field(..., description="Whether review is helpful or not")
```

---

## 📦 Package Schemas (app/schemas/packages.py)

```python
from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, Dict, List, Any
from datetime import datetime, date
from decimal import Decimal

from app.schemas.base import BaseSchema, ResponseMixin, PaginationParams
from app.schemas.providers import ProviderSummary
from app.models.packages import PackageType

class PackageCreate(BaseSchema):
    """Schema for package creation"""
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=50, max_length=5000)
    short_description: Optional[str] = Field(None, max_length=500)
    
    # Package Type and Category
    package_type: PackageType
    categories: List[str] = Field(..., min_items=1, max_items=5)
    
    # Pricing
    base_price: Decimal = Field(..., gt=0, decimal_places=2)
    currency: str = Field(default="XAF", regex="^[A-Z]{3}$")
    price_includes: List[str] = Field(default=[])
    price_excludes: List[str] = Field(default=[])
    
    # Package Details
    duration_days: int = Field(..., ge=1, le=365)
    min_participants: int = Field(default=1, ge=1, le=100)
    max_participants: int = Field(..., ge=1, le=100)
    
    # Availability
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    booking_advance_notice: int = Field(default=72, ge=1, le=8760)  # hours
    
    # Location
    start_location: str = Field(..., min_length=2, max_length=200)
    end_location: Optional[str] = Field(None, max_length=200)
    regions_covered: List[str] = Field(..., min_items=1, max_items=10)
    
    # Package Content
    itinerary: List[Dict[str, Any]] = Field(..., min_items=1)
    included_services: List[Dict[str, Any]] = Field(default=[])
    
    # Package Policies
    cancellation_policy: str = Field(default="moderate", regex="^(flexible|moderate|strict)$")
    terms_and_conditions: Optional[str] = Field(None, max_length=5000)
    
    # SEO
    meta_title: Optional[str] = Field(None, max_length=60)
    meta_description: Optional[str] = Field(None, max_length=160)
    keywords: Optional[List[str]] = Field(None, max_items=20)
    
    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()
    
    @root_validator
    def validate_participants(cls, values):
        min_participants = values.get('min_participants', 1)
        max_participants = values.get('max_participants')
        
        if max_participants and min_participants > max_participants:
            raise ValueError('Minimum participants cannot be greater than maximum')
        
        return values
    
    @root_validator
    def validate_availability_dates(cls, values):
        available_from = values.get('available_from')
        available_until = values.get('available_until')
        
        if available_from and available_until:
            if available_until <= available_from:
                raise ValueError('Available until date must be after available from date')
        
        return values
    
    @validator('itinerary')
    def validate_itinerary(cls, v, values):
        duration_days = values.get('duration_days', 1)
        
        if len(v) > duration_days:
            raise ValueError('Itinerary cannot have more days than package duration')
        
        # Validate each day in itinerary
        for day_data in v:
            if 'day' not in day_data or 'title' not in day_data:
                raise ValueError('Each itinerary day must have "day" and "title" fields')
            
            if not isinstance(day_data['day'], int) or day_data['day'] < 1:
                raise ValueError('Day number must be a positive integer')
        
        return v

class PackageUpdate(BaseSchema):
    """Schema for package updates"""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=50, max_length=5000)
    short_description: Optional[str] = Field(None, max_length=500)
    
    # Package Type and Category
    package_type: Optional[PackageType] = None
    categories: Optional[List[str]] = Field(None, min_items=1, max_items=5)
    
    # Pricing
    base_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    price_includes: Optional[List[str]] = None
    price_excludes: Optional[List[str]] = None
    
    # Package Details
    duration_days: Optional[int] = Field(None, ge=1, le=365)
    min_participants: Optional[int] = Field(None, ge=1, le=100)
    max_participants: Optional[int] = Field(None, ge=1, le=100)
    
    # Availability
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    booking_advance_notice: Optional[int] = Field(None, ge=1, le=8760)
    
    # Location
    start_location: Optional[str] = Field(None, min_length=2, max_length=200)
    end_location: Optional[str] = Field(None, max_length=200)
    regions_covered: Optional[List[str]] = Field(None, min_items=1, max_items=10)
    
    # Package Content
    itinerary: Optional[List[Dict[str, Any]]] = Field(None, min_items=1)
    included_services: Optional[List[Dict[str, Any]]] = None
    
    # Package Policies
    cancellation_policy: Optional[str] = Field(None, regex="^(flexible|moderate|strict)$")
    terms_and_conditions: Optional[str] = Field(None, max_length=5000)
    
    # SEO
    meta_title: Optional[str] = Field(None, max_length=60)
    meta_description: Optional[str] = Field(None, max_length=160)
    keywords: Optional[List[str]] = Field(None, max_items=20)

class PackageResponse(BaseSchema, ResponseMixin):
    """Schema for package response"""
    title: str
    slug: str
    description: str
    short_description: Optional[str]
    provider_id: UUID
    package_type: PackageType
    categories: List[str]
    base_price: Decimal
    currency: str
    price_includes: List[str]
    price_excludes: List[str]
    duration_days: int
    min_participants: int
    max_participants: int
    available_from: Optional[datetime]
    available_until: Optional[datetime]
    booking_advance_notice: int
    start_location: str
    end_location: Optional[str]
    regions_covered: List[str]
    status: str
    featured: bool
    itinerary: List[Dict[str, Any]]
    included_services: List[Dict[str, Any]]
    cancellation_policy: str
    terms_and_conditions: Optional[str]
    meta_title: Optional[str]
    meta_description: Optional[str]
    keywords: Optional[List[str]]
    views_count: int
    booking_count: int
    average_rating: Decimal
    total_reviews: int
    price_per_person: Decimal

class PackageWithDetails(PackageResponse):
    """Package response with additional details"""
    provider: ProviderSummary
    images: List["PackageImageResponse"]

class PackageSummary(BaseSchema):
    """Simplified package schema for listings"""
    id: UUID
    title: str
    slug: str
    short_description: Optional[str]
    package_type: PackageType
    base_price: Decimal
    currency: str
    duration_days: int
    min_participants: int
    max_participants: int
    start_location: str
    regions_covered: List[str]
    status: str
    featured: bool
    average_rating: Decimal
    total_reviews: int
    primary_image_url: Optional[str] = None
    price_per_person: Decimal

class PackageListParams(PaginationParams):
    """Parameters for package listing"""
    provider_id: Optional[UUID] = None
    package_type: Optional[PackageType] = None
    categories: Optional[List[str]] = None
    regions: Optional[List[str]] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    min_duration: Optional[int] = Field(None, ge=1)
    max_duration: Optional[int] = Field(None, ge=1)
    min_participants: Optional[int] = Field(None, ge=1)
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    featured_only: bool = False
    available_from: Optional[date] = None
    available_to: Optional[date] = None
    search: Optional[str] = Field(None, min_length=2, max_length=100)
    sort_by: str = Field(default="created_at", regex="^(created_at|price|rating|popularity|duration)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")

class PackageImageResponse(BaseSchema, ResponseMixin):
    """Schema for package image response"""
    package_id: UUID
    url: str
    thumbnail_url: Optional[str]
    alt_text: Optional[str]
    caption: Optional[str]
    is_primary: bool
    sort_order: int
```

---

## 📢 Communication Schemas (app/schemas/communications.py)

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.schemas.base import BaseSchema, ResponseMixin, PaginationParams
from app.schemas.users import UserSummary
from app.models.communications import MessageType, MessageStatus, NotificationChannel

class MessageCreate(BaseSchema):
    """Schema for message creation"""
    recipient_id: UUID = Field(..., description="Message recipient")
    content: str = Field(..., min_length=1, max_length=5000, description="Message content")
    subject: Optional[str] = Field(None, max_length=200, description="Message subject")
    message_type: MessageType
    channel: NotificationChannel
    
    # Context Information
    booking_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    
    # Message Metadata
    metadata: Dict[str, Any] = Field(default={})
    
    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Message content cannot be empty')
        return v.strip()

class MessageResponse(BaseSchema, ResponseMixin):
    """Schema for message response"""
    sender_id: Optional[UUID]
    recipient_id: UUID
    subject: Optional[str]
    content: str
    message_type: MessageType
    booking_id: Optional[UUID]
    service_id: Optional[UUID]
    status: MessageStatus
    channel: NotificationChannel
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    read_at: Optional[datetime]
    error_message: Optional[str]
    retry_count: int
    max_retries: int
    metadata: Dict[str, Any]
    is_read: bool

class MessageWithSender(MessageResponse):
    """Message response with sender information"""
    sender: Optional[UserSummary]
    recipient: UserSummary

class MessageListParams(PaginationParams):
    """Parameters for message listing"""
    sender_id: Optional[UUID] = None
    recipient_id: Optional[UUID] = None
    message_type: Optional[MessageType] = None
    status: Optional[MessageStatus] = None
    channel: Optional[NotificationChannel] = None
    booking_id: Optional[UUID] = None
    service_id: Optional[UUID] = None
    unread_only: bool = False
    search: Optional[str] = Field(None, min_length=2, max_length=100)
    sort_by: str = Field(default="created_at", regex="^(created_at|sent_at|status)$")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$")

class ConversationResponse(BaseSchema, ResponseMixin):
    """Schema for conversation response"""
    user1_id: UUID
    user2_id: UUID
    booking_id: Optional[UUID]
    service_id: Optional[UUID]
    is_active: bool
    last_message_at: Optional[datetime]
    total_messages: int
    unread_count_user1: int
    unread_count_user2: int

class ConversationWithUsers(ConversationResponse):
    """Conversation response with user information"""
    user1: UserSummary
    user2: UserSummary
    last_message: Optional[MessageResponse] = None

class NotificationSettings(BaseSchema):
    """Schema for notification settings"""
    email_notifications: bool = True
    whatsapp_notifications: bool = True
    marketing_emails: bool = False
    booking_reminders: bool = True
    payment_notifications: bool = True
    review_requests: bool = True
    promotional_offers: bool = False
```

This completes the comprehensive Pydantic schemas documentation. The file now contains all the essential schemas needed for request/response validation, including proper field validation, custom validators, and relationship handling for the Ganitel platform.