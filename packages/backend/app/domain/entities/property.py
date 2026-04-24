"""
Ganitel V2 Backend - Property Entity
"""

from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity

if TYPE_CHECKING:
    from app.domain.entities.location import Location
    from app.domain.entities.property_amenity import PropertyAmenity
    from app.domain.entities.property_type import PropertyType


class Property(AuditableEntity, SoftDeleteEntity):
    """
    Property entity for accommodation listings
    """

    __tablename__ = "properties"

    # Basic Information
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    provider_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    location_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("locations.id"), nullable=False, index=True
    )
    property_type_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("property_types.id"),
        nullable=False,
        index=True,
    )

    # Location
    address: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 8), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(11, 8), nullable=True)

    # Pricing
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="XAF", nullable=False)
    price_per: Mapped[str] = mapped_column(String(20), default="night", nullable=False)

    # Capacity
    max_guests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    beds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    living_rooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    balconies: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Booking Settings
    instant_book: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    min_stay: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_stay: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Check-in/Check-out
    check_in_time: Mapped[str | None] = mapped_column(
        String(10), default="15:00", nullable=True
    )
    check_out_time: Mapped[str | None] = mapped_column(
        String(10), default="11:00", nullable=True
    )

    # Media
    images: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    # Relationships
    location: Mapped[Location | None] = relationship("Location")
    property_type: Mapped[PropertyType | None] = relationship("PropertyType")
    property_amenities: Mapped[list[PropertyAmenity]] = relationship(
        "PropertyAmenity", back_populates="property"
    )

    def __repr__(self):
        return f"<Property(id={self.id}, title={self.title})>"
