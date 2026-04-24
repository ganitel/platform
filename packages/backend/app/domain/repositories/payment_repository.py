"""
Ganitel V2 Backend - Payment Repository Interface
"""
from abc import abstractmethod
from uuid import UUID

from app.domain.entities.payment import Payment
from app.domain.repositories.base_repository import BaseRepository


class IPaymentRepository(BaseRepository[Payment]):
    """Payment repository interface"""

    @abstractmethod
    def get_by_booking_id(self, booking_id: UUID) -> Payment | None:
        """Get payment by booking ID"""
        raise NotImplementedError

    @abstractmethod
    def get_by_transaction_id(self, transaction_id: str) -> Payment | None:
        """Get payment by provider transaction ID"""
        raise NotImplementedError

    @abstractmethod
    def get_user_payments(self, user_id: UUID, skip: int = 0, limit: int = 100) -> list[Payment]:
        """Get all payments for a user"""
        raise NotImplementedError
