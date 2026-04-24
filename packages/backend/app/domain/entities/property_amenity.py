"""
Ganitel V2 Backend - Property Amenity Entity
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity
from app.domain.entities.property import Property

if TYPE_CHECKING:
    from app.domain.entities.amenity import Amenity


class PropertyAmenity(AuditableEntity, SoftDeleteEntity):
    """
    Join entity linking properties to amenities
    """

    __tablename__ = "property_amenities"
    __table_args__ = (
        UniqueConstraint("property_id", "amenity_id", name="uq_property_amenity_pair"),
    )

    property_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True
    )
    amenity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("amenities.id"), nullable=False, index=True
    )

    property: Mapped[Property | None] = relationship(
        Property, back_populates="property_amenities"
    )
    amenity: Mapped[Amenity | None] = relationship(
        "Amenity", back_populates="property_amenities"
    )

    def __repr__(self):
        return f"<PropertyAmenity(id={self.id}, property_id={self.property_id}, amenity_id={self.amenity_id})>"
