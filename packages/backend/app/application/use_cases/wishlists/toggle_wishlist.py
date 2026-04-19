"""
Ganitel V2 Backend - Toggle Wishlist Use Case
"""
from uuid import UUID

from app.domain.repositories.wishlist_repository import IWishlistRepository
from app.domain.repositories.service_repository import IServiceRepository
from app.domain.entities.wishlist import Wishlist
from app.exceptions import NotFoundError

class ToggleWishlistUseCase:
    """Use case for adding/removing service from wishlist"""
    
    def __init__(
        self,
        wishlist_repository: IWishlistRepository,
        service_repository: IServiceRepository
    ):
        self.wishlist_repository = wishlist_repository
        self.service_repository = service_repository
    
    def execute(self, user_id: UUID, service_id: UUID) -> dict:
        """
        Toggle wishlist item (add if not exists, remove if exists)
        
        Args:
            user_id: User ID
            service_id: Service ID
            
        Returns:
            dict: Action taken and wishlist item
        """
        # Check if service exists
        service = self.service_repository.get_by_id(service_id)
        if not service:
            raise NotFoundError("Service not found")
        
        # Check if already in wishlist
        existing = self.wishlist_repository.get_by_user_and_service(user_id, service_id)
        
        if existing:
            # Remove from wishlist
            self.wishlist_repository.remove_by_user_and_service(user_id, service_id)
            return {
                "action": "removed",
                "message": "Service removed from wishlist",
                "service_id": str(service_id)
            }
        else:
            # Add to wishlist
            wishlist = Wishlist(user_id=user_id, service_id=service_id)
            wishlist = self.wishlist_repository.create(wishlist)
            return {
                "action": "added",
                "message": "Service added to wishlist",
                "wishlist_item": wishlist,
                "service_id": str(service_id)
            }

