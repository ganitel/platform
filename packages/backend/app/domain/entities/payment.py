"""
Ganitel V2 Backend - Payment Entity
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as pgUUID

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class PaymentStatus(str, Enum):
    """Payment status lifecycle"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentProvider(str, Enum):
    """Payment providers"""
    TRANZAK = "tranzak"
    MOBILE_MONEY = "mobile_money"
    CARD = "card"


class Payment(AuditableEntity, SoftDeleteEntity):
    """
    Payment entity representing financial transactions
    """
    __tablename__ = "payments"

    booking_id = Column(pgUUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    provider = Column(String(50), nullable=False)  # tranzak, mobile_money, card
    transaction_id = Column(String(255), unique=True, nullable=True, index=True)  # Provider transaction ID
    status = Column(String(50), default=PaymentStatus.PENDING.value, nullable=False, index=True)
    
    # Additional payment details
    payment_method = Column(String(50), nullable=True)  # mtn, orange, visa, etc.
    currency = Column(String(10), default="XAF", nullable=False)
    
    # Provider response data
    provider_response = Column(String(2000), nullable=True)  # JSON string of provider response
    error_message = Column(String(500), nullable=True)
    
    # Refund information
    refund_amount = Column(Numeric(10, 2), nullable=True)
    refund_reason = Column(String(500), nullable=True)
    refunded_at = Column(String(50), nullable=True)

    def can_be_refunded(self) -> bool:
        """Check if payment can be refunded"""
        return self.status == PaymentStatus.COMPLETED.value and self.refund_amount is None

    def mark_completed(self, transaction_id: str, provider_response: str = None):
        """Mark payment as completed"""
        self.status = PaymentStatus.COMPLETED.value
        self.transaction_id = transaction_id
        self.provider_response = provider_response
        self.updated_at = datetime.utcnow()

    def mark_failed(self, error_message: str):
        """Mark payment as failed"""
        self.status = PaymentStatus.FAILED.value
        self.error_message = error_message
        self.updated_at = datetime.utcnow()

    def process_refund(self, refund_amount: float, reason: str):
        """Process a refund"""
        if not self.can_be_refunded():
            raise ValueError("Payment cannot be refunded")
        
        if refund_amount > float(self.amount):
            raise ValueError("Refund amount cannot exceed payment amount")
        
        self.status = PaymentStatus.REFUNDED.value
        self.refund_amount = refund_amount
        self.refund_reason = reason
        self.refunded_at = datetime.utcnow().isoformat()
        self.updated_at = datetime.utcnow()

    def __repr__(self):
        return f"<Payment(id={self.id}, booking_id={self.booking_id}, status={self.status}, amount={self.amount})>"
