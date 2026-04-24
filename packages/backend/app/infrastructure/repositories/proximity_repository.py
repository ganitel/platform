"""
Ganitel V2 Backend - Proximity Repository Implementation
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.proximity import Proximity
from app.domain.repositories.proximity_repository import IProximityRepository


class ProximityRepository(IProximityRepository):
    """SQLAlchemy implementation of proximity repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, proximity: Proximity) -> Proximity:
        self.db.add(proximity)
        self.db.commit()
        self.db.refresh(proximity)
        return proximity

    def get_by_id(self, proximity_id: UUID) -> Proximity | None:
        return (
            self.db.query(Proximity)
            .filter(
                Proximity.id == proximity_id,
                Proximity.deleted_at.is_(None),
            )
            .first()
        )

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Proximity]:
        return (
            self.db.query(Proximity)
            .filter(Proximity.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, proximity: Proximity) -> Proximity:
        proximity.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(proximity)
        return proximity

    def delete(self, proximity_id: UUID) -> bool:
        proximity = self.get_by_id(proximity_id)
        if proximity:
            self.db.delete(proximity)
            self.db.commit()
            return True
        return False

    def soft_delete(self, proximity_id: UUID) -> bool:
        proximity = self.get_by_id(proximity_id)
        if proximity:
            proximity.soft_delete()
            self.db.commit()
            return True
        return False

    def count(self, filters: dict[str, Any] | None = None) -> int:
        query = self.db.query(Proximity).filter(Proximity.deleted_at.is_(None))
        if filters:
            for key, value in filters.items():
                if hasattr(Proximity, key):
                    query = query.filter(getattr(Proximity, key) == value)
        return query.count()

    def exists(self, proximity_id: UUID) -> bool:
        return (
            self.db.query(Proximity)
            .filter(
                Proximity.id == proximity_id,
                Proximity.deleted_at.is_(None),
            )
            .first()
            is not None
        )

    def get_by_property(
        self, property_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Proximity]:
        """Get all proximities for a property"""
        return (
            self.db.query(Proximity)
            .filter(
                Proximity.property_id == property_id,
                Proximity.deleted_at.is_(None),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_property_destination(
        self, property_id: UUID, destination_name: str
    ) -> Proximity | None:
        """Get a specific proximity by property and destination"""
        return (
            self.db.query(Proximity)
            .filter(
                Proximity.property_id == property_id,
                Proximity.destination_name == destination_name,
                Proximity.deleted_at.is_(None),
            )
            .first()
        )

    def delete_by_property(self, property_id: UUID) -> int:
        """Delete all proximities for a property"""
        proximities = (
            self.db.query(Proximity)
            .filter(
                Proximity.property_id == property_id,
                Proximity.deleted_at.is_(None),
            )
            .all()
        )
        count = len(proximities)
        for proximity in proximities:
            self.db.delete(proximity)
        self.db.commit()
        return count
