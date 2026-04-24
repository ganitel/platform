"""
Ganitel V2 Backend - Transfer Entity
"""

from enum import StrEnum

from sqlalchemy import Column, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID

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
    sender_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    receiver_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Transfer Information
    transfer_type = Column(String(20), default=TransferType.MONEY.value, nullable=False)
    value = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="XAF", nullable=False)
    status = Column(
        String(20), default=TransferStatus.PENDING.value, nullable=False, index=True
    )
    notes = Column(Text, nullable=True)

    # Reference
    reference = Column(String(100), unique=True, nullable=True, index=True)

    def __repr__(self):
        return f"<Transfer(id={self.id}, sender={self.sender_id}, receiver={self.receiver_id}, value={self.value})>"
