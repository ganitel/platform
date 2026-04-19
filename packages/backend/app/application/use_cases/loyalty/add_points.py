"""
Ganitel V2 Backend - Add Loyalty Points Use Case
"""
from uuid import UUID
from decimal import Decimal

from app.domain.repositories.loyalty_account_repository import ILoyaltyAccountRepository
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import NotFoundError, ValidationError

class AddLoyaltyPointsUseCase:
    """Use case for adding loyalty points"""
    
    def __init__(
        self,
        loyalty_repository: ILoyaltyAccountRepository,
        user_repository: IUserRepository
    ):
        self.loyalty_repository = loyalty_repository
        self.user_repository = user_repository
    
    def execute(self, user_id: UUID, points: int, reason: str = None) -> dict:
        """
        Add loyalty points to user account
        
        Args:
            user_id: User ID
            points: Points to add
            reason: Reason for adding points
            
        Returns:
            dict: Updated loyalty account
        """
        if points <= 0:
            raise ValidationError("Points must be greater than zero")
        
        # Check if user exists
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")
        
        # Get or create loyalty account
        account = self.loyalty_repository.get_by_user_id(user_id)
        if not account:
            account = self.loyalty_repository.create_for_user(user_id)
        
        # Add points
        account.add_points(points)
        account = self.loyalty_repository.update(account)
        
        return {
            "account": account,
            "points_added": points,
            "reason": reason
        }

