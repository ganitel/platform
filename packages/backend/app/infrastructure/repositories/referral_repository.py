"""
Ganitel V2 Backend - Referral Repository Implementation
"""

from datetime import UTC
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.referral import Referral
from app.domain.repositories.referral_repository import IReferralRepository


class ReferralRepository(IReferralRepository):
    """SQLAlchemy implementation of Referral Repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, referral: Referral) -> Referral:
        """Create a new referral"""
        self.db.add(referral)
        self.db.commit()
        self.db.refresh(referral)
        return referral

    def get_by_id(self, referral_id: UUID) -> Referral | None:
        """Get referral by ID"""
        return self.db.query(Referral).filter(Referral.id == referral_id).first()

    def get_by_referrer_id(self, referrer_id: UUID) -> list[Referral]:
        """Get referrals by referrer ID"""
        return self.db.query(Referral).filter(Referral.referrer_id == referrer_id).all()

    def get_by_referred_user_id(self, referred_user_id: UUID) -> Referral | None:
        """Get referral by referred user ID"""
        return (
            self.db.query(Referral)
            .filter(Referral.referred_user_id == referred_user_id)
            .first()
        )

    def update(self, referral: Referral) -> Referral:
        """Update referral"""
        from datetime import datetime

        referral.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(referral)
        return referral

    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all referrals"""
        return self.db.query(Referral).offset(skip).limit(limit).all()

    def delete(self, referral_id: UUID) -> bool:
        """Delete referral"""
        referral = self.get_by_id(referral_id)
        if referral:
            self.db.delete(referral)
            self.db.commit()
            return True
        return False
