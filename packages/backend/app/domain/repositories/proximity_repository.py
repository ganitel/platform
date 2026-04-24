"""
Ganitel V2 Backend - Proximity Repository Interface
"""
from abc import abstractmethod
from uuid import UUID

from app.domain.entities.proximity import Proximity
from app.domain.repositories.base_repository import BaseRepository


class IProximityRepository(BaseRepository[Proximity]):
    """
    Proximity repository interface defining proximity-specific operations
    """

    @abstractmethod
    def get_by_property(self, property_id: UUID, skip: int = 0, limit: int = 100) -> list[Proximity]:
        """Get all proximities for a property"""
        raise NotImplementedError

    @abstractmethod
    def get_by_property_destination(self, property_id: UUID, destination_name: str) -> Proximity | None:
        """Get a specific proximity by property and destination"""
        raise NotImplementedError

    @abstractmethod
    def delete_by_property(self, property_id: UUID) -> int:
        """Delete all proximities for a property"""
        raise NotImplementedError
