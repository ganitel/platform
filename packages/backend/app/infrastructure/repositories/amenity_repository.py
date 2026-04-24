"""
Ganitel V2 Backend - Amenity Repository Implementation
"""
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.amenity import Amenity


class AmenityRepository:
    """
    SQLAlchemy implementation of Amenity Repository
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, amenity: Amenity) -> Amenity:
        """Create a new amenity"""
        self.db.add(amenity)
        self.db.commit()
        self.db.refresh(amenity)
        return amenity

    def get_by_id(self, amenity_id: UUID) -> Amenity | None:
        """Get amenity by ID"""
        return self.db.query(Amenity).filter(
            Amenity.id == amenity_id,
            Amenity.deleted_at.is_(None)
        ).first()

    def get_by_category_id(self, category_id: UUID, skip: int = 0, limit: int = 100) -> list[Amenity]:
        """Get amenities by category ID"""
        return self.db.query(Amenity).filter(
            Amenity.category_id == category_id,
            Amenity.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Amenity]:
        """Get all amenities with pagination"""
        return self.db.query(Amenity).filter(
            Amenity.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def count(self, filters: dict[str, Any] | None = None) -> int:
        """Count amenities with optional filters"""
        query = self.db.query(Amenity).filter(Amenity.deleted_at.is_(None))

        if filters and "category_id" in filters:
            query = query.filter(Amenity.category_id == filters["category_id"])

        return query.count()

    def exists(self, amenity_id: UUID) -> bool:
        """Check if amenity exists"""
        return self.db.query(Amenity).filter(
            Amenity.id == amenity_id,
            Amenity.deleted_at.is_(None)
        ).first() is not None
