"""
Ganitel V2 Backend - Transaction Repository Implementation
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.entities.transaction import Transaction
from app.domain.repositories.transaction_repository import ITransactionRepository

class TransactionRepository(ITransactionRepository):
    """SQLAlchemy implementation of Transaction Repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, transaction: Transaction) -> Transaction:
        """Create a new transaction"""
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
    
    def get_by_id(self, transaction_id: UUID) -> Optional[Transaction]:
        """Get transaction by ID"""
        return self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Transaction]:
        """Get transactions by user ID"""
        return self.db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_wallet_id(self, wallet_id: UUID, skip: int = 0, limit: int = 100) -> List[Transaction]:
        """Get transactions by wallet ID"""
        return self.db.query(Transaction).filter(
            Transaction.wallet_id == wallet_id
        ).order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_reference(self, reference: str) -> Optional[Transaction]:
        """Get transaction by reference"""
        return self.db.query(Transaction).filter(Transaction.reference == reference).first()
    
    def update(self, transaction: Transaction) -> Transaction:
        """Update transaction"""
        from datetime import datetime
        transaction.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
    
    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all transactions"""
        return self.db.query(Transaction).offset(skip).limit(limit).all()
    
    def delete(self, transaction_id: UUID) -> bool:
        """Delete transaction"""
        transaction = self.get_by_id(transaction_id)
        if transaction:
            self.db.delete(transaction)
            self.db.commit()
            return True
        return False

