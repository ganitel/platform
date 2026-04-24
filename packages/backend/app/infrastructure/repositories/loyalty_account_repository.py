"""
Ganitel V2 Backend - Loyalty Account Repository Implementation
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.loyalty_account import LoyaltyAccount
from app.domain.repositories.loyalty_account_repository import ILoyaltyAccountRepository


class LoyaltyAccountRepository(ILoyaltyAccountRepository):
    """SQLAlchemy implementation of Loyalty Account Repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, loyalty_account: LoyaltyAccount) -> LoyaltyAccount:
        """Create a new loyalty account"""
        self.db.add(loyalty_account)
        self.db.commit()
        self.db.refresh(loyalty_account)
        return loyalty_account

    def get_by_id(self, account_id: UUID) -> LoyaltyAccount | None:
        """Get loyalty account by ID"""
        return (
            self.db.query(LoyaltyAccount)
            .filter(LoyaltyAccount.id == account_id)
            .first()
        )

    def get_by_user_id(self, user_id: UUID) -> LoyaltyAccount | None:
        """Get loyalty account by user ID"""
        return (
            self.db.query(LoyaltyAccount)
            .filter(LoyaltyAccount.user_id == user_id)
            .first()
        )

    def create_for_user(self, user_id: UUID) -> LoyaltyAccount:
        """Create loyalty account for user"""
        account = LoyaltyAccount(user_id=user_id)
        return self.create(account)

    def update(self, loyalty_account: LoyaltyAccount) -> LoyaltyAccount:
        """Update loyalty account"""
        from datetime import datetime

        loyalty_account.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(loyalty_account)
        return loyalty_account

    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all loyalty accounts"""
        return self.db.query(LoyaltyAccount).offset(skip).limit(limit).all()

    def delete(self, account_id: UUID) -> bool:
        """Delete loyalty account"""
        account = self.get_by_id(account_id)
        if account:
            self.db.delete(account)
            self.db.commit()
            return True
        return False
