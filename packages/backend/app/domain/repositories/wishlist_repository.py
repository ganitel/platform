"""
Ganitel V2 Backend - Wishlist Repository Interface
"""
from abc import abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.wishlist import Wishlist
from app.domain.repositories.base_repository import BaseRepository

class IWishlistRepository(BaseRepository[Wishlist]):
    """Wishlist repository interface"""
    
    @abstractmethod
    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Wishlist]:
        """Get wishlist by user ID"""
        raise NotImplementedError
    
    @abstractmethod
    def get_by_user_and_service(self, user_id: UUID, service_id: UUID) -> Optional[Wishlist]:
        """Get wishlist item by user and service"""
        raise NotImplementedError
    
    @abstractmethod
    def remove_by_user_and_service(self, user_id: UUID, service_id: UUID) -> bool:
        """Remove wishlist item"""
        raise NotImplementedError

