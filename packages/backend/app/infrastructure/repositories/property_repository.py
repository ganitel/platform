"""
Ganitel V2 Backend - Property Repository Implementation
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

from app.domain.entities.property import Property


class PropertyRepository:
    """
    SQLAlchemy implementation of Property Repository
    """

    def __init__(self, db: Session):
        self.db = db
        self.session = db

    def create(self, property: Property) -> Property:
        """Create a new property"""
        self.db.add(property)
        self.db.commit()
        self.db.refresh(property)
        return property

    def get_by_id(self, property_id: UUID) -> Optional[Property]:
        """Get property by ID"""
        return self.db.query(Property).filter(
            Property.id == property_id,
            Property.deleted_at.is_(None)
        ).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Property]:
        """Get all properties with pagination"""
        return self.db.query(Property).filter(
            Property.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def update(self, property_id: UUID, updates: Dict[str, Any]) -> Property:
        """Update an existing property"""
        property = self.get_by_id(property_id)
        if property:
            for key, value in updates.items():
                if hasattr(property, key):
                    setattr(property, key, value)
            property.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(property)
        return property

    def delete(self, property_id: UUID) -> bool:
        """Soft delete a property"""
        property = self.get_by_id(property_id)
        if property:
            property.soft_delete()
            self.db.commit()
            return True
        return False

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count properties with optional filters"""
        query = self.db.query(Property).filter(Property.deleted_at.is_(None))

        if filters:
            query = self._apply_filters(query, filters)

        return query.count()

    def exists(self, property_id: UUID) -> bool:
        """Check if property exists"""
        return self.db.query(Property).filter(
            Property.id == property_id,
            Property.deleted_at.is_(None)
        ).first() is not None

    def find_by_criteria(self, criteria: Dict[str, Any], skip: int = 0, limit: int = 100) -> List[Property]:
        """Find properties by criteria"""
        query = self.db.query(Property).filter(Property.deleted_at.is_(None))

        query = self._apply_filters(query, criteria)

        return query.offset(skip).limit(limit).all()

    def get_by_provider_id(self, provider_id: UUID, skip: int = 0, limit: int = 100) -> List[Property]:
        """Get properties by provider ID"""
        return self.db.query(Property).filter(
            Property.provider_id == provider_id,
            Property.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def get_by_location_id(self, location_id: UUID, skip: int = 0, limit: int = 100) -> List[Property]:
        """Get properties by location ID"""
        return self.db.query(Property).filter(
            Property.location_id == location_id,
            Property.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def get_by_property_type_id(self, property_type_id: UUID, skip: int = 0, limit: int = 100) -> List[Property]:
        """Get properties by property type ID"""
        return self.db.query(Property).filter(
            Property.property_type_id == property_type_id,
            Property.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def _apply_filters(self, query, filters: Dict[str, Any]):
        """Apply filters to query"""
        if "provider_id" in filters:
            query = query.filter(Property.provider_id == filters["provider_id"])
        if "location_id" in filters:
            query = query.filter(Property.location_id == filters["location_id"])
        if "property_type_id" in filters:
            query = query.filter(Property.property_type_id == filters["property_type_id"])
        if "title" in filters:
            query = query.filter(Property.title.ilike(f"%{filters['title']}%"))
        
        return query
