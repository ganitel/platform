"""
Ganitel V2 Backend - Location Repository Implementation
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.entities.location import Location


class LocationRepository:
    """
    SQLAlchemy implementation of Location Repository
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, location: Location) -> Location:
        """Create a new location"""
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        return location

    def get_by_id(self, location_id: UUID) -> Optional[Location]:
        """Get location by ID"""
        return self.db.query(Location).filter(
            Location.id == location_id,
            Location.deleted_at.is_(None)
        ).first()

    def get_by_name(self, name: str) -> Optional[Location]:
        """Get location by name"""
        return self.db.query(Location).filter(
            Location.name == name,
            Location.deleted_at.is_(None)
        ).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Location]:
        """Get all locations with pagination"""
        return self.db.query(Location).filter(
            Location.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count locations with optional filters"""
        query = self.db.query(Location).filter(Location.deleted_at.is_(None))
        return query.count()

    def exists(self, location_id: UUID) -> bool:
        """Check if location exists"""
        return self.db.query(Location).filter(
            Location.id == location_id,
            Location.deleted_at.is_(None)
        ).first() is not None

    def exists_by_name(self, name: str) -> bool:
        """Check if location exists by name"""
        return self.db.query(Location).filter(
            Location.name == name,
            Location.deleted_at.is_(None)
        ).first() is not None
