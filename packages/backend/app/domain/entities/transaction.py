"""
Ganitel V2 Backend - Transaction Entity
"""
from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum

from app.domain.entities.base import AuditableEntity


class TransactionType(str, Enum):
    """Transaction type enumeration"""
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    PAYMENT = "payment"
    REFUND = "refund"
    TRANSFER = "transfer"
    POINT_EARNED = "point_earned"
    POINT_EXCHANGE = "point_exchange"
    DEDUCTION = "deduction"
    BONUS = "bonus"


class TransactionStatus(str, Enum):
    """Transaction status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"


class Transaction(AuditableEntity):
    """
    Transaction entity for wallet transactions
    """
    __tablename__ = "transactions"
    
    # Relationships
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=True, index=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True, index=True)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True, index=True)
    
    # Transaction Information
    transaction_type = Column(String(50), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    points = Column(Integer, default=0, nullable=False)
    currency = Column(String(10), default="XAF", nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default=TransactionStatus.PENDING.value, nullable=False, index=True)
    
    # Reference
    reference = Column(String(100), unique=True, nullable=True, index=True)
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, type={self.transaction_type}, amount={self.amount}, status={self.status})>"

