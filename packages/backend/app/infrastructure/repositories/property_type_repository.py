"""
Ganitel V2 Backend - Property Type Repository Implementation
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.entities.property_type import PropertyType


class PropertyTypeRepository:
    """
    SQLAlchemy implementation of Property Type Repository
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, property_type: PropertyType) -> PropertyType:
        """Create a new property type"""
        self.db.add(property_type)
        self.db.commit()
        self.db.refresh(property_type)
        return property_type

    def get_by_id(self, property_type_id: UUID) -> Optional[PropertyType]:
        """Get property type by ID"""
        return self.db.query(PropertyType).filter(
            PropertyType.id == property_type_id,
            PropertyType.deleted_at.is_(None)
        ).first()

    def get_by_name(self, name: str) -> Optional[PropertyType]:
        """Get property type by name"""
        return self.db.query(PropertyType).filter(
            PropertyType.name == name,
            PropertyType.deleted_at.is_(None)
        ).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[PropertyType]:
        """Get all property types with pagination"""
        return self.db.query(PropertyType).filter(
            PropertyType.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count property types with optional filters"""
        query = self.db.query(PropertyType).filter(PropertyType.deleted_at.is_(None))
        return query.count()

    def exists(self, property_type_id: UUID) -> bool:
        """Check if property type exists"""
        return self.db.query(PropertyType).filter(
            PropertyType.id == property_type_id,
            PropertyType.deleted_at.is_(None)
        ).first() is not None

    def exists_by_name(self, name: str) -> bool:
        """Check if property type exists by name"""
        return self.db.query(PropertyType).filter(
            PropertyType.name == name,
            PropertyType.deleted_at.is_(None)
        ).first() is not None
