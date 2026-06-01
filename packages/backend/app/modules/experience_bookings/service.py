"""Service for experience bookings: request, host-confirm, decline,
cancel, lazy expiry. Mirrors the `bookings/service.py` patterns so the
two booking surfaces feel uniform.
"""

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
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
from app.modules.payments import service as payments_service
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


async def get(
    session: AsyncSession,
    booking_id: UUID,
    *,
    viewer: User,
) -> ExperienceBooking:
    booking = await session.get(ExperienceBooking, booking_id)
    if booking is None:
        raise NotFoundError(code="experience_booking.not_found")

    booking = await _refresh_lazy_expirations(session, booking)

    if viewer.is_admin:
        return booking
    if viewer.id in (booking.guest_id, booking.host_id):
        return booking
    raise ForbiddenError(code="experience_booking.access_denied")


async def _refresh_lazy_expirations(
    session: AsyncSession, booking: ExperienceBooking
) -> ExperienceBooking:
    """Mirrors `bookings.get_booking`: if a deadline has elapsed, flip the row to
    `cancelled_expired` lazily on read so frontends don't see stale state.
    """
    now = datetime.now(UTC)
    flipped = False

    if (
        booking.status == ExperienceBookingStatus.REQUESTED
        and booking.confirm_deadline_at is not None
        and booking.confirm_deadline_at < now
    ):
        booking.status = ExperienceBookingStatus.CANCELLED_EXPIRED
        booking.cancelled_at = now
        flipped = True
    elif (
        booking.status == ExperienceBookingStatus.PENDING_PAYMENT
        and booking.hold_expires_at is not None
        and booking.hold_expires_at < now
    ):
        booking.status = ExperienceBookingStatus.CANCELLED_EXPIRED
        booking.cancelled_at = now
        booking.hold_expires_at = None
        flipped = True

    if flipped:
        await outbox_service.enqueue(
            session,
            event_type="experience_booking.cancelled_expired",
            aggregate_type="experience_booking",
            aggregate_id=booking.id,
            payload={"experience_booking_id": str(booking.id)},
        )
        await session.commit()
        await session.refresh(booking)
    return booking


async def confirm_as_host(
    session: AsyncSession,
    *,
    booking_id: UUID,
    host: User,
    provider_name: str,
    idempotency_key: str,
    start_time=None,
) -> ExperienceBooking:
    booking = await session.get(ExperienceBooking, booking_id)
    if booking is None:
        raise NotFoundError(code="experience_booking.not_found")
    if booking.host_id != host.id and not host.is_admin:
        raise ForbiddenError(code="experience_booking.not_host")
    if booking.status != ExperienceBookingStatus.REQUESTED:
        raise ConflictError(
            code="experience_booking.not_confirmable",
            extra={"current_status": booking.status.value},
        )

    settings = get_settings()
    booking.status = ExperienceBookingStatus.PENDING_PAYMENT
    booking.host_confirmed_at = datetime.now(UTC)
    booking.hold_expires_at = datetime.now(UTC) + timedelta(minutes=settings.BOOKING_HOLD_MINUTES)
    if start_time is not None:
        booking.start_time = start_time

    intent = await payments_service.initiate_experience_payment(
        session,
        experience_booking=booking,
        provider_name=provider_name,
        idempotency_key=idempotency_key,
    )
    booking.payment_id = intent.payment_id

    await outbox_service.enqueue(
        session,
        event_type="experience_booking.host_confirmed",
        aggregate_type="experience_booking",
        aggregate_id=booking.id,
        payload={
            "experience_booking_id": str(booking.id),
            "payment_id": str(intent.payment_id),
        },
    )
    await session.commit()
    await session.refresh(booking)
    return booking


async def decline_as_host(
    session: AsyncSession, *, booking_id: UUID, host: User
) -> ExperienceBooking:
    booking = await session.get(ExperienceBooking, booking_id)
    if booking is None:
        raise NotFoundError(code="experience_booking.not_found")
    if booking.host_id != host.id and not host.is_admin:
        raise ForbiddenError(code="experience_booking.not_host")
    if booking.status != ExperienceBookingStatus.REQUESTED:
        raise ConflictError(
            code="experience_booking.not_declinable",
            extra={"current_status": booking.status.value},
        )

    booking.status = ExperienceBookingStatus.HOST_DECLINED
    booking.cancelled_at = datetime.now(UTC)
    await outbox_service.enqueue(
        session,
        event_type="experience_booking.host_declined",
        aggregate_type="experience_booking",
        aggregate_id=booking.id,
        payload={"experience_booking_id": str(booking.id)},
    )
    await session.commit()
    await session.refresh(booking)
    return booking


async def cancel_as_guest(
    session: AsyncSession, *, booking_id: UUID, guest: User
) -> ExperienceBooking:
    booking = await session.get(ExperienceBooking, booking_id)
    if booking is None:
        raise NotFoundError(code="experience_booking.not_found")
    if booking.guest_id != guest.id and not guest.is_admin:
        raise ForbiddenError(code="experience_booking.not_guest")
    if booking.status not in NON_TERMINAL_STATUSES:
        raise ConflictError(
            code="experience_booking.not_cancellable",
            extra={"current_status": booking.status.value},
        )

    booking.status = ExperienceBookingStatus.CANCELLED_BY_GUEST
    booking.cancelled_at = datetime.now(UTC)
    booking.hold_expires_at = None
    await outbox_service.enqueue(
        session,
        event_type="experience_booking.cancelled_by_guest",
        aggregate_type="experience_booking",
        aggregate_id=booking.id,
        payload={"experience_booking_id": str(booking.id)},
    )
    await session.commit()
    await session.refresh(booking)
    return booking


async def cancel_as_host(
    session: AsyncSession, *, booking_id: UUID, host: User
) -> ExperienceBooking:
    booking = await session.get(ExperienceBooking, booking_id)
    if booking is None:
        raise NotFoundError(code="experience_booking.not_found")
    if booking.host_id != host.id and not host.is_admin:
        raise ForbiddenError(code="experience_booking.not_host")
    if booking.status != ExperienceBookingStatus.CONFIRMED:
        raise ConflictError(
            code="experience_booking.not_cancellable_by_host",
            extra={"current_status": booking.status.value},
        )

    booking.status = ExperienceBookingStatus.CANCELLED_BY_HOST
    booking.cancelled_at = datetime.now(UTC)
    await outbox_service.enqueue(
        session,
        event_type="experience_booking.cancelled_by_host",
        aggregate_type="experience_booking",
        aggregate_id=booking.id,
        payload={"experience_booking_id": str(booking.id)},
    )
    await session.commit()
    await session.refresh(booking)
    return booking


async def list_for_guest(
    session: AsyncSession, *, guest: User, limit: int = 50, offset: int = 0
) -> list[ExperienceBooking]:
    stmt = (
        select(ExperienceBooking)
        .where(ExperienceBooking.guest_id == guest.id)
        .order_by(ExperienceBooking.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())


async def list_pending_for_host(
    session: AsyncSession, *, host: User, limit: int = 50, offset: int = 0
) -> list[ExperienceBooking]:
    stmt = (
        select(ExperienceBooking)
        .where(
            ExperienceBooking.host_id == host.id,
            ExperienceBooking.status == ExperienceBookingStatus.REQUESTED,
        )
        .order_by(ExperienceBooking.confirm_deadline_at.asc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())


async def sweep_expired(session: AsyncSession) -> int:
    """Bulk-flip rows whose deadlines have elapsed to `cancelled_expired`.
    Returns the total number of rows updated. Designed to be called by a
    scheduled worker, mirroring `bookings.expire_old_holds`.
    """
    now = datetime.now(UTC)
    total = 0

    requested_stmt = (
        update(ExperienceBooking)
        .where(
            ExperienceBooking.status == ExperienceBookingStatus.REQUESTED,
            ExperienceBooking.confirm_deadline_at < now,
        )
        .values(status=ExperienceBookingStatus.CANCELLED_EXPIRED, cancelled_at=now)
    )
    result = await session.execute(requested_stmt)
    total += getattr(result, "rowcount", 0) or 0

    pending_stmt = (
        update(ExperienceBooking)
        .where(
            ExperienceBooking.status == ExperienceBookingStatus.PENDING_PAYMENT,
            ExperienceBooking.hold_expires_at < now,
        )
        .values(
            status=ExperienceBookingStatus.CANCELLED_EXPIRED,
            cancelled_at=now,
            hold_expires_at=None,
        )
    )
    result = await session.execute(pending_stmt)
    total += getattr(result, "rowcount", 0) or 0

    await session.commit()
    return total


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
