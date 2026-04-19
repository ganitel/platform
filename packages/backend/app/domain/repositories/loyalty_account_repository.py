"""
Ganitel V2 Backend - Loyalty Account Repository Interface
"""
from abc import abstractmethod
from typing import Optional
from uuid import UUID

from app.domain.entities.loyalty_account import LoyaltyAccount
from app.domain.repositories.base_repository import BaseRepository

class ILoyaltyAccountRepository(BaseRepository[LoyaltyAccount]):
    """Loyalty Account repository interface"""
    
    @abstractmethod
    def get_by_user_id(self, user_id: UUID) -> Optional[LoyaltyAccount]:
        """Get loyalty account by user ID"""
        raise NotImplementedError
    
    @abstractmethod
    def create_for_user(self, user_id: UUID) -> LoyaltyAccount:
        """Create loyalty account for user"""
        raise NotImplementedError

