"""
Ganitel V2 Backend - Amenity Category Entity
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity

if TYPE_CHECKING:
    from app.domain.entities.amenity import Amenity


class AmenityCategory(AuditableEntity, SoftDeleteEntity):
    """
    Amenity category entity (General, Kitchen, Security, etc.)
    """

    __tablename__ = "amenity_categories"

    name_en: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    name_fr: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    icon_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    amenities: Mapped[list[Amenity]] = relationship(
        "Amenity", back_populates="category"
    )

    def __repr__(self):
        return f"<AmenityCategory(id={self.id}, name_en={self.name_en})>"
