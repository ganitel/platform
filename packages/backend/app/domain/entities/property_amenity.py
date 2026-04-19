"""
Ganitel V2 Backend - Property Amenity Entity
"""
from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity
from app.domain.entities.property import Property


class PropertyAmenity(AuditableEntity, SoftDeleteEntity):
    """
    Join entity linking properties to amenities
    """
    __tablename__ = "property_amenities"
    __table_args__ = (
        UniqueConstraint("property_id", "amenity_id", name="uq_property_amenity_pair"),
    )

    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True)
    amenity_id = Column(UUID(as_uuid=True), ForeignKey("amenities.id"), nullable=False, index=True)

    property = relationship(Property, back_populates="property_amenities")
    amenity = relationship("Amenity", back_populates="property_amenities")

    def __repr__(self):
        return f"<PropertyAmenity(id={self.id}, property_id={self.property_id}, amenity_id={self.amenity_id})>"
