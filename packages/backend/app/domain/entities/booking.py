"""
Ganitel V2 Backend - Booking Entity
"""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class BookingStatus(StrEnum):
    """Booking status lifecycle"""

    PENDING = "pending"
    NEGOTIATING = "negotiating"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    FAILED = "failed"
    COMPLETED = "completed"


class Booking(AuditableEntity, SoftDeleteEntity):
    """
    Booking entity representing reservations made by travelers

    NOTE: An EXCLUSION constraint is enforced at the database level to prevent overlapping
    bookings for the same service. The constraint allows only one booking per service for
    any given date range (using daterange with && overlap operator).
    The constraint considers only non-deleted bookings (WHERE deleted_at IS NULL).
    """

    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint(
            "service_id",
            "user_id",
            "start_date",
            "end_date",
            name="uq_booking_unique_period",
        ),
    )

    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    service_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    guests: Mapped[Decimal] = mapped_column(Numeric(5, 0), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default=BookingStatus.PENDING.value, nullable=False, index=True
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    negotiated_price: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    currency: Mapped[str] = mapped_column(String(10), default="XAF", nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    def duration_nights(self) -> int:
        """Return number of nights for the booking"""
        return (self.end_date - self.start_date).days

    def can_be_cancelled(self) -> bool:
        """Check if booking can be cancelled"""
        return self.status in {
            BookingStatus.PENDING.value,
            BookingStatus.NEGOTIATING.value,
            BookingStatus.CONFIRMED.value,
        }

    def cancel(self):
        """Cancel booking"""
        if not self.can_be_cancelled():
            raise ValueError(f"Booking cannot be cancelled from status {self.status}")
        self.status = BookingStatus.CANCELLED.value
        self.updated_at = datetime.now(UTC)

    def confirm(self):
        """Confirm booking"""
        if self.status != BookingStatus.PENDING.value:
            raise ValueError("Only pending bookings can be confirmed")
        self.status = BookingStatus.CONFIRMED.value
        self.updated_at = datetime.now(UTC)

    def mark_failed(self):
        """Mark booking as failed"""
        self.status = BookingStatus.FAILED.value
        self.updated_at = datetime.now(UTC)

    def mark_completed(self):
        """Mark booking as completed"""
        if self.status != BookingStatus.CONFIRMED.value:
            raise ValueError("Only confirmed bookings can be completed")
        self.status = BookingStatus.COMPLETED.value
        self.updated_at = datetime.now(UTC)

    @staticmethod
    def overlaps(start_a: date, end_a: date, start_b: date, end_b: date) -> bool:
        """Check if two date ranges overlap"""
        return start_a < end_b and start_b < end_a

    def __repr__(self):
        return f"<Booking(id={self.id}, service_id={self.service_id}, status={self.status})>"
