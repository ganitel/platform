"""
Ganitel V2 Backend - Service Entity (Accommodation/Listing)
"""

from enum import StrEnum

from sqlalchemy import JSON, Boolean, Column, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class ServiceType(StrEnum):
    """Service type enumeration"""

    ACCOMMODATION = "accommodation"
    TOUR = "tour"
    ACTIVITY = "activity"
    TRANSPORT = "transport"
    DINING = "dining"
    WELLNESS = "wellness"


class AccommodationType(StrEnum):
    """Accommodation type enumeration"""

    HOTEL = "hotel"
    APARTMENT = "apartment"
    HOUSE = "house"
    VILLA = "villa"
    GUESTHOUSE = "guesthouse"
    HOSTEL = "hostel"
    RESORT = "resort"
    LODGE = "lodge"


class ServiceStatus(StrEnum):
    """Service status enumeration"""

    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    INACTIVE = "inactive"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class Service(AuditableEntity, SoftDeleteEntity):
    """
    Service entity representing all types of services (accommodations, tours, etc.)
    """

    __tablename__ = "services"

    # Basic Information
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)

    # Service Classification
    service_type = Column(String(50), nullable=False, index=True)  # ServiceType enum
    accommodation_type = Column(
        String(50), nullable=True
    )  # AccommodationType enum (for accommodations)
    status = Column(
        String(50), default=ServiceStatus.DRAFT.value, nullable=False, index=True
    )

    # Provider Information
    provider_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Location
    country = Column(String(100), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    address = Column(Text, nullable=False)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)

    # Pricing
    base_price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="XAF", nullable=False)
    price_per = Column(
        String(20), default="night", nullable=False
    )  # night, person, hour, etc.

    # Capacity
    max_guests = Column(Integer, nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    beds = Column(Integer, nullable=True)

    # Features & Amenities
    amenities = Column(ARRAY(String), nullable=True)  # List of amenity IDs or names
    features = Column(JSON, nullable=True)  # Flexible features object
    house_rules = Column(ARRAY(String), nullable=True)  # List of rules

    # Booking Settings
    instant_book = Column(Boolean, default=False, nullable=False)
    min_stay = Column(Integer, default=1, nullable=False)
    max_stay = Column(Integer, nullable=True)
    advance_booking_days = Column(Integer, default=365, nullable=False)

    # Check-in/Check-out
    check_in_time = Column(String(10), default="15:00", nullable=True)
    check_out_time = Column(String(10), default="11:00", nullable=True)

    # Media
    images = Column(ARRAY(String), nullable=True)  # List of image URLs
    videos = Column(ARRAY(String), nullable=True)  # List of video URLs
    virtual_tour_url = Column(String(500), nullable=True)

    # SEO & Marketing
    slug = Column(String(250), unique=True, index=True, nullable=True)
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    tags = Column(ARRAY(String), nullable=True)  # Search tags

    # Statistics
    view_count = Column(Integer, default=0, nullable=False)
    booking_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Numeric(3, 2), default=0.0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)

    # Availability
    availability_calendar = Column(JSON, nullable=True)  # Flexible availability data
    blocked_dates = Column(ARRAY(String), nullable=True)  # ISO date strings

    @property
    def is_available_for_booking(self) -> bool:
        """Check if service is available for booking"""
        return (
            self.is_active
            and not self.is_deleted
            and self.status == ServiceStatus.ACTIVE.value
            and self.provider_id is not None
        )

    @property
    def primary_image(self) -> str:
        """Get primary image URL"""
        if self.images and len(self.images) > 0:
            return self.images[0]
        return None

    @property
    def location_string(self) -> str:
        """Get formatted location string"""
        return f"{self.city}, {self.country}"

    @property
    def price_display(self) -> str:
        """Get formatted price display"""
        return f"{self.base_price} {self.currency}/{self.price_per}"

    def add_image(self, image_url: str):
        """Add image to service"""
        if not self.images:
            self.images = []
        if image_url not in self.images:
            self.images.append(image_url)

    def remove_image(self, image_url: str):
        """Remove image from service"""
        if self.images and image_url in self.images:
            self.images.remove(image_url)

    def add_amenity(self, amenity: str):
        """Add amenity to service"""
        if not self.amenities:
            self.amenities = []
        if amenity not in self.amenities:
            self.amenities.append(amenity)

    def remove_amenity(self, amenity: str):
        """Remove amenity from service"""
        if self.amenities and amenity in self.amenities:
            self.amenities.remove(amenity)

    def update_rating(self, new_rating: float, review_count: int):
        """Update average rating"""
        if review_count > 0:
            total_rating = self.average_rating * self.review_count + new_rating
            self.review_count = review_count
            self.average_rating = round(total_rating / self.review_count, 2)

    def increment_view_count(self):
        """Increment view count"""
        self.view_count += 1

    def increment_booking_count(self):
        """Increment booking count"""
        self.booking_count += 1

    def generate_slug(self):
        """Generate URL slug from title"""
        import re

        slug = re.sub(r"[^\w\s-]", "", self.title.lower())
        slug = re.sub(r"[-\s]+", "-", slug)
        self.slug = f"{slug}-{str(self.id)[:8]}"

    def __repr__(self):
        return f"<Service(id={self.id}, title={self.title}, type={self.service_type})>"
