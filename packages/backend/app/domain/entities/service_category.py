"""
Ganitel V2 Backend - Service Category Entity
"""
from sqlalchemy import Column, String, Text, Boolean, Integer

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class ServiceCategory(AuditableEntity, SoftDeleteEntity):
    """
    Service Category entity for categorizing services
    """
    __tablename__ = "service_categories"
    
    # Basic Information
    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=True)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)
    
    # Display
    display_order = Column(Integer, default=0, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    
    def __repr__(self):
        return f"<ServiceCategory(id={self.id}, name={self.name})>"

