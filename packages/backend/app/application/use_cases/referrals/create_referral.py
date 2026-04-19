"""
Ganitel V2 Backend - Create Referral Use Case
"""
from uuid import UUID

from app.domain.repositories.referral_repository import IReferralRepository
from app.domain.repositories.user_repository import IUserRepository
from app.domain.entities.referral import Referral
from app.exceptions import ValidationError, ConflictError, NotFoundError

class CreateReferralUseCase:
    """Use case for creating a referral"""
    
    def __init__(
        self,
        referral_repository: IReferralRepository,
        user_repository: IUserRepository
    ):
        self.referral_repository = referral_repository
        self.user_repository = user_repository
    
    def execute(self, referrer_id: UUID, referred_user_id: UUID) -> Referral:
        """
        Create a referral
        
        Args:
            referrer_id: User who referred
            referred_user_id: User who was referred
            
        Returns:
            Referral: Created referral
        """
        if referrer_id == referred_user_id:
            raise ValidationError("User cannot refer themselves")
        
        # Check if referrer exists
        referrer = self.user_repository.get_by_id(referrer_id)
        if not referrer:
            raise NotFoundError("Referrer not found")
        
        # Check if referred user exists
        referred_user = self.user_repository.get_by_id(referred_user_id)
        if not referred_user:
            raise NotFoundError("Referred user not found")
        
        # Check if referral already exists
        existing = self.referral_repository.get_by_referred_user_id(referred_user_id)
        if existing:
            raise ConflictError("Referral already exists for this user")
        
        # Create referral
        referral = Referral(
            referrer_id=referrer_id,
            referred_user_id=referred_user_id
        )
        
        return self.referral_repository.create(referral)

