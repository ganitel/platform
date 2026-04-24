"""
Ganitel V2 Backend - Policy Repository Interface
"""

from abc import abstractmethod

from app.domain.entities.policy import Policy, PolicyType
from app.domain.repositories.base_repository import BaseRepository


class IPolicyRepository(BaseRepository[Policy]):
    """Policy repository interface"""

    @abstractmethod
    def get_by_slug(self, slug: str) -> Policy | None:
        """Get policy by slug"""
        raise NotImplementedError

    @abstractmethod
    def get_by_type(
        self, policy_type: PolicyType, skip: int = 0, limit: int = 100
    ) -> list[Policy]:
        """Get policies by type"""
        raise NotImplementedError

    @abstractmethod
    def get_active_policies(self, skip: int = 0, limit: int = 100) -> list[Policy]:
        """Get active policies"""
        raise NotImplementedError
