## 📋 Booking Models (app/models/bookings.py)

```python
from sqlalchemy import Column, String, Text, Enum, Numeric, Boolean, JSON, Integer, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum as PyEnum
from decimal import Decimal
from datetime import datetime

from app.models.base import BaseModel

class BookingStatus(str, PyEnum):
    """Booking status enumeration"""
    PENDING = "pending"              # Waiting for provider confirmation
    CONFIRMED = "confirmed"          # Confirmed by provider
    PAID = "paid"                    # Payment received
    CHECKED_IN = "checked_in"        # Guest has checked in
    ACTIVE = "active"                # Service is currently being used
    COMPLETED = "completed"          # Service completed successfully
    CANCELLED_BY_GUEST = "cancelled_by_guest"
    CANCELLED_BY_PROVIDER = "cancelled_by_provider"
    CANCELLED_BY_ADMIN = "cancelled_by_admin"
    REFUNDED = "refunded"
    NO_SHOW = "no_show"

class PaymentStatus(str, PyEnum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class Booking(BaseModel):
    """Main booking model"""
    
    # Booking Identification
    booking_number = Column(String(20), unique=True, nullable=False, index=True)
    
    # Relationships
    guest_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    package_id = Column(UUID(as_uuid=True), ForeignKey("packages.id"), nullable=True, index=True)
    
    # Booking Dates
    check_in_date = Column(DateTime, nullable=False, index=True)
    check_out_date = Column(DateTime, nullable=False, index=True)
    booking_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Guest Information
    guest_count_adults = Column(Integer, default=1, nullable=False)
    guest_count_children = Column(Integer, default=0, nullable=False)
    guest_count_infants = Column(Integer, default=0, nullable=False)
    
    # Contact Information
    guest_phone = Column(String(20), nullable=False)
    guest_email = Column(String(255), nullable=True)
    guest_notes = Column(Text, nullable=True)
    special_requests = Column(Text, nullable=True)
    
    # Pricing Details
    base_price = Column(Numeric(12, 2), nullable=False)
    total_nights = Column(Integer, nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    
    # Fees and Taxes
    service_fee = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    tax_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    discount_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="XAF", nullable=False)
    
    # Payment Information
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    payment_method = Column(String(50), nullable=True)
    payment_due_date = Column(DateTime, nullable=True)
    
    # Booking Status
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False, index=True)
    confirmed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_by = Column(UUID(as_uuid=True), nullable=True)  # User ID who cancelled
    
    # Check-in/out Information
    actual_check_in = Column(DateTime, nullable=True)
    actual_check_out = Column(DateTime, nullable=True)
    early_check_in_requested = Column(Boolean, default=False, nullable=False)
    late_check_out_requested = Column(Boolean, default=False, nullable=False)
    
    # Provider Actions
    provider_notes = Column(Text, nullable=True)
    provider_response_date = Column(DateTime, nullable=True)
    
    # Pricing Breakdown (JSON for detailed breakdown)
    pricing_breakdown = Column(JSON, default=dict, nullable=False)
    # Example: {
    #     "base_rate": {"amount": 50000, "nights": 3, "total": 150000},
    #     "taxes": [
    #         {"name": "VAT", "rate": 0.19, "amount": 28500}
    #     ],
    #     "fees": [
    #         {"name": "Service Fee", "amount": 7500},
    #         {"name": "Cleaning Fee", "amount": 15000}
    #     ],
    #     "discounts": [
    #         {"name": "Week-long stay discount", "amount": -15000}
    #     ]
    # }
    
    # Guest Preferences
    guest_preferences = Column(JSON, default=dict, nullable=False)
    # Example: {
    #     "arrival_time": "15:00",
    #     "dietary_restrictions": ["vegetarian"],
    #     "accessibility_needs": ["wheelchair_access"],
    #     "communication_language": "fr"
    # }
    
    # Commission Tracking
    commission_rate = Column(Numeric(5, 4), nullable=False)
    commission_amount = Column(Numeric(12, 2), nullable=False)
    commission_paid = Column(Boolean, default=False, nullable=False)
    commission_paid_at = Column(DateTime, nullable=True)
    
    # Relationships
    guest = relationship("User", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")
    package = relationship("Package", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking")
    reviews = relationship("Review", back_populates="booking")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_booking_dates', 'check_in_date', 'check_out_date'),
        Index('idx_booking_status_payment', 'status', 'payment_status'),
        Index('idx_booking_guest_service', 'guest_id', 'service_id'),
        Index('idx_booking_confirmation', 'confirmed_at', 'status'),
    )
    
    @property
    def duration_nights(self) -> int:
        """Calculate number of nights"""
        return (self.check_out_date.date() - self.check_in_date.date()).days
    
    @property
    def total_guests(self) -> int:
        """Calculate total number of guests"""
        return self.guest_count_adults + self.guest_count_children + self.guest_count_infants
    
    @property
    def is_active(self) -> bool:
        """Check if booking is currently active"""
        now = datetime.utcnow()
        return (self.status in [BookingStatus.CONFIRMED, BookingStatus.PAID, BookingStatus.CHECKED_IN, BookingStatus.ACTIVE] and
                self.check_in_date <= now <= self.check_out_date)
    
    @property
    def can_be_cancelled(self) -> bool:
        """Check if booking can be cancelled"""
        return self.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.PAID]
    
    @property
    def is_past_due(self) -> bool:
        """Check if payment is past due"""
        if not self.payment_due_date:
            return False
        return datetime.utcnow() > self.payment_due_date and self.payment_status == PaymentStatus.PENDING

class Payment(BaseModel):
    """Payment transaction model"""
    
    # Payment Identification
    transaction_id = Column(String(100), unique=True, nullable=False, index=True)
    external_transaction_id = Column(String(100), nullable=True, index=True)  # From payment gateway
    
    # Relationships
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Payment Details
    amount = Column(Numeric(12, 2), nullable=False, index=True)
    currency = Column(String(3), default="XAF", nullable=False)
    payment_method = Column(String(50), nullable=False, index=True)
    # Methods: mobile_money, bank_transfer, card, cash
    
    # Payment Gateway Information
    gateway_provider = Column(String(50), nullable=True)  # tranzak, orange_money, mtn_money
    gateway_transaction_id = Column(String(100), nullable=True)
    gateway_reference = Column(String(100), nullable=True)
    
    # Payment Status
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    initiated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    
    # Error Handling
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Payment Metadata
    payment_metadata = Column(JSON, default=dict, nullable=False)
    # Example: {
    #     "phone_number": "+237677123456",
    #     "network": "MTN",
    #     "customer_name": "John Doe",
    #     "ip_address": "192.168.1.1",
    #     "user_agent": "Mozilla/5.0..."
    # }
    
    # Fees and Commission
    gateway_fee = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    platform_fee = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    net_amount = Column(Numeric(12, 2), nullable=False)  # Amount after fees
    
    # Refund Information
    refund_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    refund_reason = Column(Text, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    refund_transaction_id = Column(String(100), nullable=True)
    
    # Relationships
    booking = relationship("Booking", back_populates="payments")
    user = relationship("User")
    
    @property
    def is_successful(self) -> bool:
        """Check if payment is successful"""
        return self.status == PaymentStatus.COMPLETED
    
    @property
    def is_refunded(self) -> bool:
        """Check if payment is refunded"""
        return self.status in [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED]

class Review(BaseModel):
    """Review and rating model"""
    
    # Relationships
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Rating (1-5 stars)
    overall_rating = Column(Integer, nullable=False, index=True)
    
    # Detailed Ratings
    cleanliness_rating = Column(Integer, nullable=True)
    communication_rating = Column(Integer, nullable=True)
    value_rating = Column(Integer, nullable=True)
    location_rating = Column(Integer, nullable=True)
    accuracy_rating = Column(Integer, nullable=True)
    
    # Review Content
    title = Column(String(200), nullable=True)
    comment = Column(Text, nullable=True)
    
    # Review Metadata
    language = Column(String(5), default="fr", nullable=False)
    would_recommend = Column(Boolean, nullable=True)
    
    # Moderation
    is_published = Column(Boolean, default=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    moderated_at = Column(DateTime, nullable=True)
    moderated_by = Column(UUID(as_uuid=True), nullable=True)
    moderation_notes = Column(Text, nullable=True)
    
    # Provider Response
    provider_response = Column(Text, nullable=True)
    provider_response_date = Column(DateTime, nullable=True)
    
    # Helpful Votes
    helpful_votes = Column(Integer, default=0, nullable=False)
    total_votes = Column(Integer, default=0, nullable=False)
    
    # Relationships
    booking = relationship("Booking", back_populates="reviews")
    service = relationship("Service", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")
    
    @property
    def average_detailed_rating(self) -> float:
        """Calculate average of detailed ratings"""
        ratings = [r for r in [
            self.cleanliness_rating,
            self.communication_rating,
            self.value_rating,
            self.location_rating,
            self.accuracy_rating
        ] if r is not None]
        
        if not ratings:
            return self.overall_rating
        
        return sum(ratings) / len(ratings)
    
    @property
    def helpfulness_score(self) -> float:
        """Calculate helpfulness score (0-1)"""
        if self.total_votes == 0:
            return 0.0
        return self.helpful_votes / self.total_votes

class CartItem(BaseModel):
    """Shopping cart items for multi-service bookings"""
    
    # Relationships
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    package_id = Column(UUID(as_uuid=True), ForeignKey("packages.id"), nullable=True)
    
    # Booking Details
    check_in_date = Column(DateTime, nullable=False)
    check_out_date = Column(DateTime, nullable=False)
    guest_count_adults = Column(Integer, default=1, nullable=False)
    guest_count_children = Column(Integer, default=0, nullable=False)
    guest_count_infants = Column(Integer, default=0, nullable=False)
    
    # Pricing (calculated at time of addition)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="XAF", nullable=False)
    
    # Cart Metadata
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    price_valid_until = Column(DateTime, nullable=False)  # Price lock expiration
    
    # Special Options
    special_requests = Column(Text, nullable=True)
    selected_options = Column(JSON, default=dict, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="cart_items")
    service = relationship("Service")
    package = relationship("Package")
    
    @property
    def is_price_valid(self) -> bool:
        """Check if price is still valid"""
        return datetime.utcnow() <= self.price_valid_until
    
    @property
    def total_nights(self) -> int:
        """Calculate number of nights"""
        return (self.check_out_date.date() - self.check_in_date.date()).days
```

---

## 📦 Package Models (app/models/packages.py)

```python
from sqlalchemy import Column, String, Text, Enum, Numeric, Boolean, JSON, Integer, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from enum import Enum as PyEnum
from decimal import Decimal

from app.models.base import BaseModel

class PackageType(str, PyEnum):
    """Package type enumeration"""
    MULTI_SERVICE = "multi_service"    # Multiple services bundled
    EXPERIENCE = "experience"          # Curated experience package
    SEASONAL = "seasonal"              # Holiday/seasonal packages
    CUSTOM = "custom"                  # Custom packages

class Package(BaseModel):
    """Travel package model"""
    
    # Basic Information
    title = Column(String(200), nullable=False, index=True)
    slug = Column(String(250), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)
    
    # Provider
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False, index=True)
    
    # Package Type and Category
    package_type = Column(Enum(PackageType), nullable=False, index=True)
    categories = Column(ARRAY(String), nullable=False)  # List of category codes
    
    # Pricing
    base_price = Column(Numeric(12, 2), nullable=False, index=True)
    currency = Column(String(3), default="XAF", nullable=False)
    price_includes = Column(ARRAY(String), default=list, nullable=False)
    price_excludes = Column(ARRAY(String), default=list, nullable=False)
    
    # Package Details
    duration_days = Column(Integer, nullable=False)
    min_participants = Column(Integer, default=1, nullable=False)
    max_participants = Column(Integer, nullable=False)
    
    # Availability
    available_from = Column(DateTime, nullable=True)
    available_until = Column(DateTime, nullable=True)
    booking_advance_notice = Column(Integer, default=72, nullable=False)  # hours
    
    # Location
    start_location = Column(String(200), nullable=False)
    end_location = Column(String(200), nullable=True)
    regions_covered = Column(ARRAY(String), nullable=False)
    
    # Package Status
    status = Column(String(20), default="draft", nullable=False, index=True)
    featured = Column(Boolean, default=False, nullable=False, index=True)
    
    # Package Content
    itinerary = Column(JSON, nullable=False)
    # Example: [
    #     {
    #         "day": 1,
    #         "title": "Arrival in Douala",
    #         "description": "Airport pickup and hotel check-in",
    #         "activities": [
    #             {
    #                 "time": "14:00",
    #                 "activity": "Airport pickup",
    #                 "location": "Douala International Airport",
    #                 "duration": 60
    #             }
    #         ],
    #         "accommodation": "service_id_here",
    #         "meals": ["dinner"]
    #     }
    # ]
    
    # Services Included
    included_services = Column(JSON, default=list, nullable=False)
    # Example: [
    #     {
    #         "service_id": "uuid",
    #         "service_type": "accommodation",
    #         "quantity": 3,  # nights
    #         "mandatory": True,
    #         "day_range": [1, 3]
    #     }
    # ]
    
    # Package Policies
    cancellation_policy = Column(String(50), default="moderate", nullable=False)
    terms_and_conditions = Column(Text, nullable=True)
    
    # SEO
    meta_title = Column(String(60), nullable=True)
    meta_description = Column(String(160), nullable=True)
    keywords = Column(ARRAY(String), nullable=True)
    
    # Statistics
    views_count = Column(Integer, default=0, nullable=False)
    booking_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Numeric(3, 2), default=Decimal("0.00"), nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    
    # Relationships
    provider = relationship("Provider", back_populates="packages")
    bookings = relationship("Booking", back_populates="package")
    images = relationship("PackageImage", back_populates="package")
    
    @property
    def price_per_person(self) -> Decimal:
        """Calculate price per person based on minimum participants"""
        return self.base_price / self.min_participants

class PackageImage(BaseModel):
    """Package image model"""
    
    package_id = Column(UUID(as_uuid=True), ForeignKey("packages.id"), nullable=False, index=True)
    
    # Image Information
    url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    alt_text = Column(String(255), nullable=True)
    caption = Column(String(500), nullable=True)
    
    # Display Settings
    is_primary = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Relationships
    package = relationship("Package", back_populates="images")
```

---

## 📢 Communication Models (app/models/communications.py)

```python
from sqlalchemy import Column, String, Text, Enum, Boolean, JSON, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum as PyEnum
from datetime import datetime

from app.models.base import BaseModel

class MessageType(str, PyEnum):
    """Message type enumeration"""
    BOOKING_INQUIRY = "booking_inquiry"
    BOOKING_CONFIRMATION = "booking_confirmation"
    PAYMENT_NOTIFICATION = "payment_notification"
    CHECK_IN_REMINDER = "check_in_reminder"
    GENERAL_INQUIRY = "general_inquiry"
    SUPPORT_TICKET = "support_ticket"
    REVIEW_REQUEST = "review_request"
    PROMOTIONAL = "promotional"

class MessageStatus(str, PyEnum):
    """Message status enumeration"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"

class NotificationChannel(str, PyEnum):
    """Notification channel enumeration"""
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"

class Message(BaseModel):
    """Message model for all communications"""
    
    # Participants
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Message Content
    subject = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), nullable=False, index=True)
    
    # Context Information
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=True, index=True)
    
    # Message Status
    status = Column(Enum(MessageStatus), default=MessageStatus.PENDING, nullable=False, index=True)
    channel = Column(Enum(NotificationChannel), nullable=False, index=True)
    
    # Tracking
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    # Error Handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    
    # Message Metadata
    metadata = Column(JSON, default=dict, nullable=False)
    # Example: {
    #     "template_id": "booking_confirmation",
    #     "variables": {"guest_name": "John", "check_in": "2025-01-15"},
    #     "external_id": "wa_msg_123",
    #     "thread_id": "conversation_uuid"
    # }
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    booking = relationship("Booking")
    service = relationship("Service")
    
    @property
    def is_read(self) -> bool:
        """Check if message is read"""
        return self.read_at is not None

class Conversation(BaseModel):
    """Conversation thread model"""
    
    # Participants
    user1_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    user2_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Context
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=True, index=True)
    
    # Conversation Status
    is_active = Column(Boolean, default=True, nullable=False)
    last_message_at = Column(DateTime, nullable=True)
    
    # Message Counts
    total_messages = Column(Integer, default=0, nullable=False)
    unread_count_user1 = Column(Integer, default=0, nullable=False)
    unread_count_user2 = Column(Integer, default=0, nullable=False)
    
    # Relationships
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    booking = relationship("Booking")
    service = relationship("Service")
```

---

## 🎯 Marketing Models (app/models/marketing.py)

```python
from sqlalchemy import Column, String, Text, Enum, Numeric, Boolean, JSON, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum as PyEnum
from decimal import Decimal

from app.models.base import BaseModel

class CouponType(str, PyEnum):
    """Coupon type enumeration"""
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_SHIPPING = "free_shipping"

class CouponStatus(str, PyEnum):
    """Coupon status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"

class Coupon(BaseModel):
    """Discount coupon model"""
    
    # Coupon Information
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Discount Configuration
    coupon_type = Column(Enum(CouponType), nullable=False)
    discount_value = Column(Numeric(12, 2), nullable=False)
    max_discount = Column(Numeric(12, 2), nullable=True)  # For percentage coupons
    min_order_amount = Column(Numeric(12, 2), nullable=True)
    
    # Validity
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    status = Column(Enum(CouponStatus), default=CouponStatus.ACTIVE, nullable=False, index=True)
    
    # Usage Limits
    max_uses = Column(Integer, nullable=True)
    max_uses_per_user = Column(Integer, default=1, nullable=False)
    current_uses = Column(Integer, default=0, nullable=False)
    
    # Targeting
    applicable_categories = Column(JSON, default=list, nullable=False)
    applicable_services = Column(JSON, default=list, nullable=False)
    user_restrictions = Column(JSON, default=dict, nullable=False)
    
    @property
    def is_valid(self) -> bool:
        """Check if coupon is currently valid"""
        now = datetime.utcnow()
        return (self.status == CouponStatus.ACTIVE and
                self.valid_from <= now <= self.valid_until and
                (self.max_uses is None or self.current_uses < self.max_uses))

class NewsletterSubscription(BaseModel):
    """Newsletter subscription model"""
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    whatsapp = Column(String(20), nullable=True, index=True)
    
    # Subscription Preferences
    is_active = Column(Boolean, default=True, nullable=False)
    interests = Column(JSON, default=list, nullable=False)
    preferred_language = Column(String(5), default="fr", nullable=False)
    
    # Tracking
    source = Column(String(100), nullable=True)  # website, app, event
    subscribed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    unsubscribed_at = Column(DateTime, nullable=True)
    
    # Engagement
    last_email_sent = Column(DateTime, nullable=True)
    last_email_opened = Column(DateTime, nullable=True)
    total_emails_sent = Column(Integer, default=0, nullable=False)
    total_emails_opened = Column(Integer, default=0, nullable=False)
```

This completes the comprehensive database models documentation. The file now contains all the essential models needed for the Ganitel platform with proper relationships, indexes, and business logic methods.
