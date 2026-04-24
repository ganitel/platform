"""
Ganitel V2 Backend - Amenity Category Entity
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class AmenityCategory(AuditableEntity, SoftDeleteEntity):
    """
    Amenity category entity (General, Kitchen, Security, etc.)
    """

    __tablename__ = "amenity_categories"

    name_en = Column(String(100), nullable=False, unique=True, index=True)
    name_fr = Column(String(100), nullable=False, unique=True, index=True)
    icon_path = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)

    amenities = relationship("Amenity", back_populates="category")

    def __repr__(self):
        return f"<AmenityCategory(id={self.id}, name_en={self.name_en})>"
