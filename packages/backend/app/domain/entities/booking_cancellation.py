"""
Ganitel V2 Backend - Booking Cancellation Entity
"""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class CancellationReason(StrEnum):
    """Cancellation reason enumeration"""

    USER_REQUEST = "user_request"
    PROVIDER_REQUEST = "provider_request"
    PAYMENT_FAILED = "payment_failed"
    NO_SHOW = "no_show"
    EMERGENCY = "emergency"
    WEATHER = "weather"
    OTHER = "other"


class CancellationStatus(StrEnum):
    """Cancellation status enumeration"""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSED = "processed"


class BookingCancellation(AuditableEntity):
    """
    Booking Cancellation entity for detailed cancellation tracking
    """

    __tablename__ = "booking_cancellations"

    # Relationships
    booking_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("bookings.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    cancelled_by_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Cancellation Information
    reason: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(20), default=CancellationStatus.PENDING.value, nullable=False, index=True
    )
    cancellation_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Refund Information
    refund_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    refund_percentage: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    refund_status: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # pending, processed, failed

    # Processing
    processed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    processed_by_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    def __repr__(self):
        return f"<BookingCancellation(id={self.id}, booking_id={self.booking_id}, reason={self.reason})>"
