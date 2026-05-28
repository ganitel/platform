"""SQLAlchemy ORM model for the `bookings` table. Tracks guest +
property, check-in/out dates, pricing breakdown (subtotal / total /
host payout), and status (`BookingStatus` enum). DB-level
check-constraints guard the obvious invariants."""

from datetime import date, datetime
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
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class BookingStatus(StrEnum):
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    CANCELLED_BY_GUEST = "cancelled_by_guest"
    CANCELLED_BY_HOST = "cancelled_by_host"
    CANCELLED_EXPIRED = "cancelled_expired"
    COMPLETED = "completed"
    DISPUTED = "disputed"


ACTIVE_STATUSES = (BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED)


class Booking(Base):
    __tablename__ = "bookings"
    # DB-level date-overlap exclusion (GiST) is in migration 0003 as raw SQL
    # (bookings_no_overlap) — btree_gist is required and SA can't declare it
    # portably. service.create_booking catches the resulting IntegrityError.
    __table_args__ = (
        CheckConstraint("check_out_date > check_in_date", name="ck_bookings_dates_ordered"),
        CheckConstraint("guest_count >= 1", name="ck_bookings_guest_count_positive"),
        CheckConstraint("subtotal_amount >= 0", name="ck_bookings_subtotal_non_negative"),
        CheckConstraint(
            "(room_type_id IS NULL) = (room_slot_index IS NULL)",
            name="ck_bookings_room_pair",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    guest_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    property_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("properties.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    room_type_id: Mapped[UUID | None] = mapped_column(
        Uuid(),
        ForeignKey("room_types.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    room_slot_index: Mapped[int | None] = mapped_column(Integer, nullable=True)

    check_in_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_out_date: Mapped[date] = mapped_column(Date, nullable=False)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False)

    subtotal_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    subtotal_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    total_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    host_payout_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    host_payout_currency: Mapped[str] = mapped_column(String(3), nullable=False)
    fx_rate_used: Mapped[Decimal | None] = mapped_column(Numeric(20, 10))
    fx_snapshot_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[BookingStatus] = mapped_column(
        Enum(
            BookingStatus,
            name="booking_status",
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
        default=BookingStatus.PENDING_PAYMENT,
        index=True,
    )

    payment_id: Mapped[UUID | None] = mapped_column(
        Uuid(), ForeignKey("payments.id", ondelete="SET NULL"), index=True
    )
    hold_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
