"""
Ganitel V2 Backend - Service Image Entity
"""
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum

from app.domain.entities.base import AuditableEntity


class ImageType(str, Enum):
    """Image type enumeration"""
    MAIN = "main"
    BEDROOM = "bedroom"
    LIVINGROOM = "livingroom"
    BATHROOM = "bathroom"
    KITCHEN = "kitchen"
    EXTERIOR = "exterior"
    AMENITY = "amenity"
    OTHER = "other"


class ServiceImage(AuditableEntity):
    """
    Service Image entity for service photos
    """
    __tablename__ = "service_images"
    
    # Relationships
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    
    # Image Information
    image_url = Column(String(500), nullable=False)
    image_type = Column(String(20), default=ImageType.MAIN.value, nullable=False, index=True)
    alt_text = Column(String(200), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    
    def __repr__(self):
        return f"<ServiceImage(id={self.id}, service_id={self.service_id}, type={self.image_type})>"

