from datetime import UTC, datetime
from typing import cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ConflictError
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.bookings.schemas import InitiatePaymentOut, PaymentProvider
from app.modules.experience_bookings.models import ExperienceBooking, ExperienceBookingStatus
from app.modules.outbox import service as outbox_service
from app.modules.payments.models import Payment, PaymentStatus
from app.modules.payments.providers import get_provider
from app.modules.payments.providers.base import PaymentEvent


async def initiate_payment(
    session: AsyncSession, *, booking: Booking, provider_name: str, idempotency_key: str
) -> InitiatePaymentOut:
    if booking.status != BookingStatus.PENDING_PAYMENT:
        raise ConflictError(
            code="payment.booking_not_pending",
            extra={"current_status": booking.status.value},
        )
    provider = get_provider(provider_name)
    payment = Payment(
        booking_id=booking.id,
        provider=provider.name,
        idempotency_key=idempotency_key,
        amount=booking.total_amount,
        currency=booking.total_currency,
        status=PaymentStatus.PENDING,
    )
    session.add(payment)
    await session.flush()

    intent = await provider.create_intent(
        payment=payment, return_url=get_settings().PAYMENT_RETURN_URL
    )
    payment.provider_intent_id = intent.provider_intent_id
    payment.raw_init_response = intent.raw
    booking.payment_id = payment.id
    await session.commit()
    await session.refresh(payment)

    return InitiatePaymentOut(
        payment_id=payment.id,
        provider=cast(PaymentProvider, provider.name),
        provider_intent_id=intent.provider_intent_id,
        client_action=intent.client_action,
    )


async def initiate_experience_payment(
    session: AsyncSession,
    *,
    experience_booking: ExperienceBooking,
    provider_name: str,
    idempotency_key: str,
) -> InitiatePaymentOut:
    if experience_booking.status != ExperienceBookingStatus.PENDING_PAYMENT:
        raise ConflictError(
            code="payment.experience_booking_not_pending",
            extra={"current_status": experience_booking.status.value},
        )
    provider = get_provider(provider_name)
    payment = Payment(
        experience_booking_id=experience_booking.id,
        provider=provider.name,
        idempotency_key=idempotency_key,
        amount=experience_booking.total_amount,
        currency=experience_booking.total_currency,
        status=PaymentStatus.PENDING,
    )
    session.add(payment)
    await session.flush()

    intent = await provider.create_intent(
        payment=payment, return_url=get_settings().PAYMENT_RETURN_URL
    )
    payment.provider_intent_id = intent.provider_intent_id
    payment.raw_init_response = intent.raw
    await session.flush()
    return InitiatePaymentOut(
        payment_id=payment.id,
        provider=cast(PaymentProvider, provider.name),
        provider_intent_id=intent.provider_intent_id,
        client_action=intent.client_action,
    )


async def apply_webhook_event(
    session: AsyncSession, *, provider_name: str, event: PaymentEvent
) -> Payment | None:
    """Idempotently transition payment + linked target (booking or
    experience_booking) based on a verified provider event."""
    payment = (
        await session.execute(
            select(Payment).where(
                Payment.provider == provider_name.lower(),
                Payment.provider_intent_id == event.provider_intent_id,
            )
        )
    ).scalar_one_or_none()
    if payment is None:
        return None
    payment.raw_last_event = event.raw

    if event.status == "captured" and payment.status != PaymentStatus.CAPTURED:
        payment.status = PaymentStatus.CAPTURED
        payment.captured_at = datetime.now(UTC)
        if payment.booking_id is not None:
            await _on_capture_booking(session, payment)
        elif payment.experience_booking_id is not None:
            await _on_capture_experience_booking(session, payment)
    elif event.status == "failed" and payment.status not in {
        PaymentStatus.CAPTURED,
        PaymentStatus.REFUNDED,
    }:
        payment.status = PaymentStatus.FAILED
        payment.failed_at = datetime.now(UTC)

    await session.commit()
    await session.refresh(payment)
    return payment


async def _on_capture_booking(session: AsyncSession, payment: Payment) -> None:
    booking = await session.get(Booking, payment.booking_id)
    if booking is None or booking.status != BookingStatus.PENDING_PAYMENT:
        return
    booking.status = BookingStatus.CONFIRMED
    booking.confirmed_at = datetime.now(UTC)
    booking.hold_expires_at = None
    await outbox_service.enqueue(
        session,
        event_type="booking.confirmed",
        aggregate_type="booking",
        aggregate_id=booking.id,
        payload={
            "booking_id": str(booking.id),
            "payment_id": str(payment.id),
            "amount": str(payment.amount),
            "currency": payment.currency,
        },
    )


async def _on_capture_experience_booking(session: AsyncSession, payment: Payment) -> None:
    exp_booking = await session.get(ExperienceBooking, payment.experience_booking_id)
    if exp_booking is None or exp_booking.status != ExperienceBookingStatus.PENDING_PAYMENT:
        return
    exp_booking.status = ExperienceBookingStatus.CONFIRMED
    exp_booking.hold_expires_at = None
    await outbox_service.enqueue(
        session,
        event_type="experience_booking.confirmed",
        aggregate_type="experience_booking",
        aggregate_id=exp_booking.id,
        payload={
            "experience_booking_id": str(exp_booking.id),
            "payment_id": str(payment.id),
            "amount": str(payment.amount),
            "currency": payment.currency,
        },
    )
