"""Booking lifecycle: hold → pay → confirm → cancel/expire. Owns
pricing computation, double-booking checks, payment intent creation
via the configured provider, and outbox events for downstream
consumers (notifications, payouts)."""

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.core.money import Currency, Money
from app.modules.bookings.models import ACTIVE_STATUSES, Booking, BookingStatus
from app.modules.bookings.schemas import BookingCreateIn, BookingPublic
from app.modules.outbox import service as outbox_service
from app.modules.properties.models import Property, PropertyStatus
from app.modules.users.models import User


async def expire_old_holds(session: AsyncSession, *, property_id: UUID | None = None) -> None:
    """Lazy cleanup — flips pending_payment bookings whose hold has elapsed to cancelled_expired.
    Caller is responsible for committing.
    """
    stmt = (
        update(Booking)
        .where(
            Booking.status == BookingStatus.PENDING_PAYMENT,
            Booking.hold_expires_at < datetime.now(UTC),
        )
        .values(
            status=BookingStatus.CANCELLED_EXPIRED,
            cancelled_at=datetime.now(UTC),
            hold_expires_at=None,
        )
    )
    if property_id is not None:
        stmt = stmt.where(Booking.property_id == property_id)
    await session.execute(stmt)


async def create_booking(session: AsyncSession, guest: User, payload: BookingCreateIn) -> Booking:
    today = date.today()
    if payload.check_in_date < today:
        raise ValidationError("check_in_date is in the past", extra={"field": "check_in_date"})
    if payload.check_out_date <= payload.check_in_date:
        raise ValidationError(
            "check_out_date must be after check_in_date",
            extra={"field": "check_out_date"},
        )

    nights = (payload.check_out_date - payload.check_in_date).days

    prop = await session.get(Property, payload.property_id)
    if prop is None or prop.status != PropertyStatus.PUBLISHED:
        raise NotFoundError("property not found or not published")
    if prop.host_id == guest.id:
        raise ForbiddenError("hosts cannot book their own property")
    if payload.guest_count > prop.capacity:
        raise ValidationError(
            "guest_count exceeds property capacity",
            extra={"field": "guest_count", "max": prop.capacity},
        )

    await expire_old_holds(session, property_id=payload.property_id)

    settings = get_settings()
    subtotal = prop.base_price_amount * nights

    booking = Booking(
        guest_id=guest.id,
        property_id=payload.property_id,
        check_in_date=payload.check_in_date,
        check_out_date=payload.check_out_date,
        guest_count=payload.guest_count,
        subtotal_amount=subtotal,
        subtotal_currency=prop.base_price_currency,
        total_amount=subtotal,
        total_currency=prop.base_price_currency,
        host_payout_amount=subtotal,
        host_payout_currency=prop.base_price_currency,
        status=BookingStatus.PENDING_PAYMENT,
        hold_expires_at=datetime.now(UTC) + timedelta(minutes=settings.BOOKING_HOLD_MINUTES),
    )
    session.add(booking)

    await outbox_service.enqueue(
        session,
        event_type="booking.created",
        aggregate_type="booking",
        aggregate_id=booking.id,
        payload={
            "booking_id": str(booking.id),
            "guest_id": str(guest.id),
            "host_id": str(prop.host_id),
            "property_id": str(prop.id),
            "subtotal_amount": str(subtotal),
            "currency": prop.base_price_currency,
        },
    )

    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        if "no_overlap" in str(e.orig).lower() or "exclude" in str(e.orig).lower():
            raise ConflictError(
                "those dates are no longer available",
                extra={"field": "check_in_date"},
            ) from e
        raise

    await session.refresh(booking)
    return booking


async def get_booking(session: AsyncSession, booking_id: UUID, *, viewer: User) -> Booking:
    booking = await session.get(Booking, booking_id)
    if booking is None:
        raise NotFoundError("booking not found")

    # Refresh expiry lazily so frontend sees correct status without a worker.
    if (
        booking.status == BookingStatus.PENDING_PAYMENT
        and booking.hold_expires_at is not None
        and booking.hold_expires_at < datetime.now(UTC)
    ):
        booking.status = BookingStatus.CANCELLED_EXPIRED
        booking.cancelled_at = datetime.now(UTC)
        booking.hold_expires_at = None
        await session.commit()
        await session.refresh(booking)

    # Access control: guest, host, or admin
    if viewer.is_admin:
        return booking
    if booking.guest_id == viewer.id:
        return booking
    prop = await session.get(Property, booking.property_id)
    if prop is not None and prop.host_id == viewer.id:
        return booking
    raise ForbiddenError("you do not have access to this booking")


async def cancel_as_guest(session: AsyncSession, booking: Booking, guest: User) -> Booking:
    if booking.guest_id != guest.id and not guest.is_admin:
        raise ForbiddenError("only the guest can cancel as guest")
    if booking.status not in ACTIVE_STATUSES:
        raise ConflictError(
            f"cannot cancel a booking in status {booking.status.value}",
            extra={"current_status": booking.status.value},
        )
    booking.status = BookingStatus.CANCELLED_BY_GUEST
    booking.cancelled_at = datetime.now(UTC)
    booking.hold_expires_at = None
    await outbox_service.enqueue(
        session,
        event_type="booking.cancelled_by_guest",
        aggregate_type="booking",
        aggregate_id=booking.id,
        payload={"booking_id": str(booking.id)},
    )
    await session.commit()
    await session.refresh(booking)
    return booking


async def cancel_as_host(session: AsyncSession, booking: Booking, host: User) -> Booking:
    prop = await session.get(Property, booking.property_id)
    if prop is None or (prop.host_id != host.id and not host.is_admin):
        raise ForbiddenError("only the host can cancel as host")
    if booking.status not in ACTIVE_STATUSES:
        raise ConflictError(
            f"cannot cancel a booking in status {booking.status.value}",
            extra={"current_status": booking.status.value},
        )
    booking.status = BookingStatus.CANCELLED_BY_HOST
    booking.cancelled_at = datetime.now(UTC)
    booking.hold_expires_at = None
    await outbox_service.enqueue(
        session,
        event_type="booking.cancelled_by_host",
        aggregate_type="booking",
        aggregate_id=booking.id,
        payload={"booking_id": str(booking.id)},
    )
    await session.commit()
    await session.refresh(booking)
    return booking


async def list_for_guest(
    session: AsyncSession, guest: User, *, limit: int = 50, offset: int = 0
) -> list[Booking]:
    stmt = (
        select(Booking)
        .where(Booking.guest_id == guest.id)
        .order_by(Booking.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())


def to_public(booking: Booking) -> BookingPublic:
    nights = (booking.check_out_date - booking.check_in_date).days
    return BookingPublic(
        id=booking.id,
        property_id=booking.property_id,
        guest_id=booking.guest_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        nights=nights,
        guest_count=booking.guest_count,
        subtotal=Money(
            amount=booking.subtotal_amount, currency=Currency(booking.subtotal_currency)
        ),
        total=Money(amount=booking.total_amount, currency=Currency(booking.total_currency)),
        status=booking.status,
        hold_expires_at=booking.hold_expires_at,
        confirmed_at=booking.confirmed_at,
        cancelled_at=booking.cancelled_at,
        created_at=booking.created_at,
    )
