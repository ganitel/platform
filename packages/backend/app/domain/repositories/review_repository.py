"""
Ganitel V2 Backend - Review Repository Interface
"""

from abc import abstractmethod
from uuid import UUID

from app.domain.entities.review import Review
from app.domain.repositories.base_repository import BaseRepository


class IReviewRepository(BaseRepository[Review]):
    """Review repository interface"""

    @abstractmethod
    def get_by_service_id(
        self, service_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Review]:
        """Get reviews by service ID"""
        raise NotImplementedError

    @abstractmethod
    def get_by_user_id(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Review]:
        """Get reviews by user ID"""
        raise NotImplementedError

    @abstractmethod
    def get_by_service_and_user(self, service_id: UUID, user_id: UUID) -> Review | None:
        """Get review by service and user"""
        raise NotImplementedError

    @abstractmethod
    def get_average_rating(self, service_id: UUID) -> float:
        """Get average rating for service"""
        raise NotImplementedError
