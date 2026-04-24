"""
Ganitel V2 Backend - Amenity Entity
"""
from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity
from app.domain.entities.property_amenity import PropertyAmenity


class Amenity(AuditableEntity, SoftDeleteEntity):
    """
    Amenity entity linked to an amenity category
    """
    __tablename__ = "amenities"

    category_id = Column(UUID(as_uuid=True), ForeignKey("amenity_categories.id"), nullable=False, index=True)
    name_en = Column(String(100), nullable=False, index=True)
    name_fr = Column(String(100), nullable=False, index=True)
    icon_path = Column(String(255), nullable=True)

    category = relationship("AmenityCategory", back_populates="amenities")
    property_amenities = relationship(PropertyAmenity, back_populates="amenity")

    def __repr__(self):
        return f"<Amenity(id={self.id}, name_en={self.name_en})>"
