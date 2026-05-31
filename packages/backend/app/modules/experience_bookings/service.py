"""Service for experience bookings: request, host-confirm, decline,
cancel, lazy expiry. Mirrors the `bookings/service.py` patterns so the
two booking surfaces feel uniform.
"""

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.core.money import Currency, Money
from app.modules.experience_bookings.models import (
    NON_TERMINAL_STATUSES,
    ExperienceBooking,
    ExperienceBookingStatus,
)
from app.modules.experience_bookings.schemas import (
    ExperienceBookingCreateIn,
    ExperienceBookingPublic,
)
from app.modules.experiences.models import Experience, ExperienceStatus
from app.modules.outbox import service as outbox_service
from app.modules.users.models import User

DEFAULT_CONFIRM_DEADLINE_HOURS = 48


async def create_request(
    session: AsyncSession,
    *,
    guest: User,
    payload: ExperienceBookingCreateIn,
) -> ExperienceBooking:
    today = date.today()
    if payload.requested_date < today:
        raise ValidationError(code="experience.date_past", extra={"field": "requested_date"})

    exp_stmt = select(Experience).where(Experience.id == payload.experience_id).with_for_update()
    exp = (await session.execute(exp_stmt)).scalar_one_or_none()
    if exp is None or exp.status != ExperienceStatus.PUBLISHED:
        raise NotFoundError(code="experience.not_found")
    if exp.host_id == guest.id:
        raise ForbiddenError(code="experience.self_booking")
    if payload.party_size > exp.capacity:
        raise ValidationError(
            code="experience.party_size_invalid",
            extra={"field": "party_size", "max": exp.capacity},
        )

    price = next((p for p in exp.prices if p.currency == payload.currency.value), None)
    if price is None:
        raise ValidationError(code="experience.currency_unavailable", extra={"field": "currency"})

    used_stmt = select(func.coalesce(func.sum(ExperienceBooking.party_size), 0)).where(
        ExperienceBooking.experience_id == exp.id,
        ExperienceBooking.requested_date == payload.requested_date,
        ExperienceBooking.status.in_(NON_TERMINAL_STATUSES),
    )
    used = (await session.execute(used_stmt)).scalar_one()
    if used + payload.party_size > exp.capacity:
        raise ConflictError(
            code="experience.date_capacity_exceeded",
            extra={"available": exp.capacity - used},
        )

    subtotal = price.amount * Decimal(payload.party_size)
    confirm_deadline = datetime.now(UTC) + timedelta(hours=DEFAULT_CONFIRM_DEADLINE_HOURS)

    booking = ExperienceBooking(
        guest_id=guest.id,
        experience_id=exp.id,
        host_id=exp.host_id,
        requested_date=payload.requested_date,
        start_time=payload.start_time,
        party_size=payload.party_size,
        subtotal_amount=subtotal,
        subtotal_currency=price.currency,
        total_amount=subtotal,
        total_currency=price.currency,
        host_payout_amount=subtotal,
        host_payout_currency=price.currency,
        status=ExperienceBookingStatus.REQUESTED,
        confirm_deadline_at=confirm_deadline,
    )
    session.add(booking)
    await session.flush()

    await outbox_service.enqueue(
        session,
        event_type="experience_booking.requested",
        aggregate_type="experience_booking",
        aggregate_id=booking.id,
        payload={
            "experience_booking_id": str(booking.id),
            "guest_id": str(guest.id),
            "host_id": str(exp.host_id),
            "experience_id": str(exp.id),
            "requested_date": booking.requested_date.isoformat(),
            "party_size": booking.party_size,
            "subtotal_amount": str(booking.subtotal_amount),
            "currency": booking.subtotal_currency,
        },
    )
    await session.commit()
    await session.refresh(booking)
    return booking


def to_public(booking: ExperienceBooking, *, experience_title: str) -> ExperienceBookingPublic:
    return ExperienceBookingPublic(
        id=booking.id,
        experience_id=booking.experience_id,
        experience_title=experience_title,
        guest_id=booking.guest_id,
        host_id=booking.host_id,
        requested_date=booking.requested_date,
        start_time=booking.start_time,
        party_size=booking.party_size,
        subtotal=Money(
            amount=booking.subtotal_amount, currency=Currency(booking.subtotal_currency)
        ),
        total=Money(amount=booking.total_amount, currency=Currency(booking.total_currency)),
        status=booking.status,
        confirm_deadline_at=booking.confirm_deadline_at,
        hold_expires_at=booking.hold_expires_at,
        host_confirmed_at=booking.host_confirmed_at,
        cancelled_at=booking.cancelled_at,
        created_at=booking.created_at,
    )
