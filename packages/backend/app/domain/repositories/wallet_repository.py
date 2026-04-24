"""
Ganitel V2 Backend - Wallet Repository Interface
"""

from abc import abstractmethod
from uuid import UUID

from app.domain.entities.wallet import Wallet
from app.domain.repositories.base_repository import BaseRepository


class IWalletRepository(BaseRepository[Wallet]):
    """Wallet repository interface"""

    @abstractmethod
    def get_by_user_id(self, user_id: UUID) -> Wallet | None:
        """Get wallet by user ID"""
        raise NotImplementedError

    @abstractmethod
    def create_for_user(self, user_id: UUID) -> Wallet:
        """Create wallet for user"""
        raise NotImplementedError
