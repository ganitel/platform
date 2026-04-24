"""
Ganitel V2 Backend - Referral Repository Interface
"""
from abc import abstractmethod
from uuid import UUID

from app.domain.entities.referral import Referral
from app.domain.repositories.base_repository import BaseRepository


class IReferralRepository(BaseRepository[Referral]):
    """Referral repository interface"""

    @abstractmethod
    def get_by_referrer_id(self, referrer_id: UUID) -> list[Referral]:
        """Get referrals by referrer ID"""
        raise NotImplementedError

    @abstractmethod
    def get_by_referred_user_id(self, referred_user_id: UUID) -> Referral | None:
        """Get referral by referred user ID"""
        raise NotImplementedError

