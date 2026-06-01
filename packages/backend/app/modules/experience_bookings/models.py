"""SQLAlchemy ORM model for the `experience_bookings` table.

Distinct from `Booking` (stays) because the lifecycle is different:
requested → host confirms → guest pays → confirmed. Stays go
hold → pay → confirmed in one step.
"""

from datetime import date, datetime, time
from decimal import Decimal
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Time,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ExperienceBookingStatus(StrEnum):
    REQUESTED = "requested"
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    HOST_DECLINED = "host_declined"
    CANCELLED_BY_GUEST = "cancelled_by_guest"
    CANCELLED_BY_HOST = "cancelled_by_host"
    CANCELLED_EXPIRED = "cancelled_expired"
    COMPLETED = "completed"
    DISPUTED = "disputed"


NON_TERMINAL_STATUSES = (
    ExperienceBookingStatus.REQUESTED,
    ExperienceBookingStatus.PENDING_PAYMENT,
    ExperienceBookingStatus.CONFIRMED,
)

ACTIVE_PRE_CONFIRM_STATUSES = (
    ExperienceBookingStatus.REQUESTED,
    ExperienceBookingStatus.PENDING_PAYMENT,
)


class ExperienceBooking(Base):
    __tablename__ = "experience_bookings"
    __table_args__ = (
        CheckConstraint("party_size >= 1", name="ck_experience_bookings_party_size_positive"),
        CheckConstraint(
            "subtotal_amount >= 0", name="ck_experience_bookings_subtotal_non_negative"
        ),
        CheckConstraint("total_amount >= 0", name="ck_experience_bookings_total_non_negative"),
        CheckConstraint(
            "host_payout_amount >= 0", name="ck_experience_bookings_payout_non_negative"
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    guest_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    experience_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("experiences.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    host_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    requested_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time | None] = mapped_column(Time())
    party_size: Mapped[int] = mapped_column(Integer, nullable=False)

    subtotal_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    subtotal_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    total_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    host_payout_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    host_payout_currency: Mapped[str] = mapped_column(String(3), nullable=False)

    status: Mapped[ExperienceBookingStatus] = mapped_column(
        Enum(
            ExperienceBookingStatus,
            name="experience_booking_status",
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
        default=ExperienceBookingStatus.REQUESTED,
        index=True,
    )

    payment_id: Mapped[UUID | None] = mapped_column(
        Uuid(), ForeignKey("payments.id", ondelete="SET NULL")
    )

    confirm_deadline_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    hold_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    host_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
