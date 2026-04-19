"""
Ganitel V2 Backend - Transaction Repository Interface
"""
from abc import abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.transaction import Transaction
from app.domain.repositories.base_repository import BaseRepository

class ITransactionRepository(BaseRepository[Transaction]):
    """Transaction repository interface"""
    
    @abstractmethod
    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Transaction]:
        """Get transactions by user ID"""
        raise NotImplementedError
    
    @abstractmethod
    def get_by_wallet_id(self, wallet_id: UUID, skip: int = 0, limit: int = 100) -> List[Transaction]:
        """Get transactions by wallet ID"""
        raise NotImplementedError
    
    @abstractmethod
    def get_by_reference(self, reference: str) -> Optional[Transaction]:
        """Get transaction by reference"""
        raise NotImplementedError

