"""
Ganitel V2 Backend - Coupon Repository Interface
"""

from abc import abstractmethod
from uuid import UUID

from app.domain.entities.coupon import Coupon
from app.domain.repositories.base_repository import BaseRepository


class ICouponRepository(BaseRepository[Coupon]):
    """Coupon repository interface"""

    @abstractmethod
    def get_by_code(self, code: str) -> Coupon | None:
        """Get coupon by code"""
        raise NotImplementedError

    @abstractmethod
    def get_active_coupons(self, skip: int = 0, limit: int = 100) -> list[Coupon]:
        """Get active coupons"""
        raise NotImplementedError

    @abstractmethod
    def increment_usage(self, coupon_id: UUID) -> bool:
        """Increment coupon usage count"""
        raise NotImplementedError
