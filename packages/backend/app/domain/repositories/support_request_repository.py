"""
Ganitel V2 Backend - Support Request Repository Interface
"""

from abc import abstractmethod
from uuid import UUID

from app.domain.entities.support_request import SupportRequest, SupportRequestStatus
from app.domain.repositories.base_repository import BaseRepository


class ISupportRequestRepository(BaseRepository[SupportRequest]):
    """Support Request repository interface"""

    @abstractmethod
    def get_by_user_id(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[SupportRequest]:
        """Get support requests by user ID"""
        raise NotImplementedError

    @abstractmethod
    def get_by_status(
        self, status: SupportRequestStatus, skip: int = 0, limit: int = 100
    ) -> list[SupportRequest]:
        """Get support requests by status"""
        raise NotImplementedError

    @abstractmethod
    def get_by_assigned_to(
        self, assigned_to_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[SupportRequest]:
        """Get support requests assigned to user"""
        raise NotImplementedError
