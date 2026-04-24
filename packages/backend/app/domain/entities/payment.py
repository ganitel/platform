"""
Ganitel V2 Backend - Payment Entity
"""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class PaymentStatus(StrEnum):
    """Payment status lifecycle"""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentProvider(StrEnum):
    """Payment providers"""

    TRANZAK = "tranzak"
    MOBILE_MONEY = "mobile_money"
    CARD = "card"


class Payment(AuditableEntity, SoftDeleteEntity):
    """
    Payment entity representing financial transactions
    """

    __tablename__ = "payments"

    booking_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("bookings.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    provider: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # tranzak, mobile_money, card
    transaction_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )  # Provider transaction ID
    status: Mapped[str] = mapped_column(
        String(50), default=PaymentStatus.PENDING.value, nullable=False, index=True
    )

    # Additional payment details
    payment_method: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # mtn, orange, visa, etc.
    currency: Mapped[str] = mapped_column(String(10), default="XAF", nullable=False)

    # Provider response data
    provider_response: Mapped[str | None] = mapped_column(
        String(2000), nullable=True
    )  # JSON string of provider response
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Refund information
    refund_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    refund_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    refunded_at: Mapped[str | None] = mapped_column(String(50), nullable=True)

    def can_be_refunded(self) -> bool:
        """Check if payment can be refunded"""
        return (
            self.status == PaymentStatus.COMPLETED.value and self.refund_amount is None
        )

    def mark_completed(self, transaction_id: str, provider_response: str | None = None):
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
        self.refund_amount = refund_amount  # ty: ignore[invalid-assignment]
        self.refund_reason = reason
        self.refunded_at = datetime.utcnow().isoformat()
        self.updated_at = datetime.utcnow()

    def __repr__(self):
        return f"<Payment(id={self.id}, booking_id={self.booking_id}, status={self.status}, amount={self.amount})>"
