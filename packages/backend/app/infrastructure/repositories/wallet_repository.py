"""
Ganitel V2 Backend - Wallet Repository Implementation
"""
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.wallet import Wallet
from app.domain.repositories.wallet_repository import IWalletRepository


class WalletRepository(IWalletRepository):
    """SQLAlchemy implementation of Wallet Repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, wallet: Wallet) -> Wallet:
        """Create a new wallet"""
        self.db.add(wallet)
        self.db.commit()
        self.db.refresh(wallet)
        return wallet

    def get_by_id(self, wallet_id: UUID) -> Wallet | None:
        """Get wallet by ID"""
        return self.db.query(Wallet).filter(Wallet.id == wallet_id).first()

    def get_by_user_id(self, user_id: UUID) -> Wallet | None:
        """Get wallet by user ID"""
        return self.db.query(Wallet).filter(Wallet.user_id == user_id).first()

    def create_for_user(self, user_id: UUID) -> Wallet:
        """Create wallet for user"""
        wallet = Wallet(user_id=user_id)
        return self.create(wallet)

    def update(self, wallet: Wallet) -> Wallet:
        """Update wallet"""
        from datetime import datetime
        wallet.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(wallet)
        return wallet

    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all wallets"""
        return self.db.query(Wallet).offset(skip).limit(limit).all()

    def delete(self, wallet_id: UUID) -> bool:
        """Delete wallet"""
        wallet = self.get_by_id(wallet_id)
        if wallet:
            self.db.delete(wallet)
            self.db.commit()
            return True
        return False

    def count(self, filters: dict[str, Any] | None = None) -> int:
        """Count wallets with optional filters"""
        query = self.db.query(Wallet)

        if filters:
            for key, value in filters.items():
                if hasattr(Wallet, key) and value is not None:
                    query = query.filter(getattr(Wallet, key) == value)

        return query.count()

