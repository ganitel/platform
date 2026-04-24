"""
Ganitel V2 Backend - View Tracking Repository Interface
"""
from abc import abstractmethod
from uuid import UUID

from app.domain.entities.view_tracking import ViewTracking
from app.domain.repositories.base_repository import BaseRepository


class IViewTrackingRepository(BaseRepository[ViewTracking]):
    """View Tracking repository interface"""

    @abstractmethod
    def get_by_entity(self, entity_type: str, entity_id: UUID, skip: int = 0, limit: int = 100) -> list[ViewTracking]:
        """Get views by entity"""
        raise NotImplementedError

    @abstractmethod
    def get_view_count(self, entity_type: str, entity_id: UUID) -> int:
        """Get view count for entity"""
        raise NotImplementedError

    @abstractmethod
    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> list[ViewTracking]:
        """Get views by user ID"""
        raise NotImplementedError

