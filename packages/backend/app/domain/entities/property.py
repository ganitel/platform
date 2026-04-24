"""
Ganitel V2 Backend - Property Entity
"""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class Property(AuditableEntity, SoftDeleteEntity):
    """
    Property entity for accommodation listings
    """

    __tablename__ = "properties"

    # Basic Information
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)

    # Relationships
    provider_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    location_id = Column(
        UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False, index=True
    )
    property_type_id = Column(
        UUID(as_uuid=True), ForeignKey("property_types.id"), nullable=False, index=True
    )

    # Location
    address = Column(Text, nullable=False)
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)

    # Pricing
    base_price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="XAF", nullable=False)
    price_per = Column(String(20), default="night", nullable=False)

    # Capacity
    max_guests = Column(Integer, nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    beds = Column(Integer, nullable=True)
    living_rooms = Column(Integer, nullable=True)
    balconies = Column(Integer, nullable=True)

    # Booking Settings
    instant_book = Column(Boolean, default=False, nullable=False)
    min_stay = Column(Integer, default=1, nullable=False)
    max_stay = Column(Integer, nullable=True)

    # Check-in/Check-out
    check_in_time = Column(String(10), default="15:00", nullable=True)
    check_out_time = Column(String(10), default="11:00", nullable=True)

    # Media
    images = Column(ARRAY(String), nullable=True)

    # Relationships
    location = relationship("Location")
    property_type = relationship("PropertyType")
    property_amenities = relationship("PropertyAmenity", back_populates="property")

    def __repr__(self):
        return f"<Property(id={self.id}, title={self.title})>"
