"""
Ganitel V2 Backend - Location Entity
"""
from sqlalchemy import Column, String

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class Location(AuditableEntity, SoftDeleteEntity):
    """
    Location entity for normalized geographic data
    """
    __tablename__ = "locations"

    name = Column(String(100), nullable=False, index=True, unique=True)
    region = Column(String(100), nullable=True)

    def __repr__(self):
        return f"<Location(id={self.id}, name={self.name})>"
