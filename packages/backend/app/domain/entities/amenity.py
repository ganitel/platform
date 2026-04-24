"""
Ganitel V2 Backend - Amenity Entity
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity
from app.domain.entities.property_amenity import PropertyAmenity

if TYPE_CHECKING:
    from app.domain.entities.amenity_category import AmenityCategory


class Amenity(AuditableEntity, SoftDeleteEntity):
    """
    Amenity entity linked to an amenity category
    """

    __tablename__ = "amenities"

    category_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("amenity_categories.id"),
        nullable=False,
        index=True,
    )
    name_en: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name_fr: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    icon_path: Mapped[str | None] = mapped_column(String(255), nullable=True)

    category: Mapped[AmenityCategory | None] = relationship(
        "AmenityCategory", back_populates="amenities"
    )
    property_amenities: Mapped[list[PropertyAmenity]] = relationship(
        PropertyAmenity, back_populates="amenity"
    )

    def __repr__(self):
        return f"<Amenity(id={self.id}, name_en={self.name_en})>"
