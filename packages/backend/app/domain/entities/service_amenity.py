"""
Ganitel V2 Backend - Service Amenity Entity
"""
from sqlalchemy import Column, String, Text, Integer
from enum import Enum

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class AmenityType(str, Enum):
    """Amenity type enumeration"""
    BASIC = "basic"
    PREMIUM = "premium"
    SAFETY = "safety"
    ACCESSIBILITY = "accessibility"
    ENTERTAINMENT = "entertainment"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    BEDROOM = "bedroom"
    OUTDOOR = "outdoor"
    OTHER = "other"


class ServiceAmenity(AuditableEntity, SoftDeleteEntity):
    """
    Service Amenity entity for service amenities/features
    """
    __tablename__ = "service_amenities"
    
    # Basic Information
    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=True)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)
    amenity_type = Column(String(50), default=AmenityType.BASIC.value, nullable=False, index=True)
    
    # Display
    display_order = Column(Integer, default=0, nullable=False)
    
    def __repr__(self):
        return f"<ServiceAmenity(id={self.id}, name={self.name}, type={self.amenity_type})>"

