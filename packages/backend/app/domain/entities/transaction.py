"""
Ganitel V2 Backend - Transaction Entity
"""

from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class TransactionType(StrEnum):
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


class TransactionStatus(StrEnum):
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
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    wallet_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("wallets.id"), nullable=True, index=True
    )
    booking_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True, index=True
    )
    payment_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("payments.id"), nullable=True, index=True
    )

    # Transaction Information
    transaction_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="XAF", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=TransactionStatus.PENDING.value, nullable=False, index=True
    )

    # Reference
    reference: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )

    def __repr__(self):
        return f"<Transaction(id={self.id}, type={self.transaction_type}, amount={self.amount}, status={self.status})>"
