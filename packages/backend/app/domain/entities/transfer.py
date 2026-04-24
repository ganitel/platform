"""
Ganitel V2 Backend - Transfer Entity
"""

from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class TransferType(StrEnum):
    """Transfer type enumeration"""

    POINTS = "points"
    MONEY = "money"


class TransferStatus(StrEnum):
    """Transfer status enumeration"""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"


class Transfer(AuditableEntity):
    """
    Transfer entity for user-to-user transfers
    """

    __tablename__ = "transfers"

    # Relationships
    sender_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    receiver_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Transfer Information
    transfer_type: Mapped[str] = mapped_column(
        String(20), default=TransferType.MONEY.value, nullable=False
    )
    value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="XAF", nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=TransferStatus.PENDING.value, nullable=False, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Reference
    reference: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )

    def __repr__(self):
        return f"<Transfer(id={self.id}, sender={self.sender_id}, receiver={self.receiver_id}, value={self.value})>"
