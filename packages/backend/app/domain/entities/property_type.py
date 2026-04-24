"""
Ganitel V2 Backend - Property Type Entity
"""

from sqlalchemy import Column, String

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class PropertyType(AuditableEntity, SoftDeleteEntity):
    """
    Property type entity (Apartment, Villa, etc.)
    """

    __tablename__ = "property_types"

    name = Column(String(100), nullable=False, index=True, unique=True)

    def __repr__(self):
        return f"<PropertyType(id={self.id}, name={self.name})>"
