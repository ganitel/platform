from datetime import UTC, datetime
from typing import cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ConflictError
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.bookings.schemas import InitiatePaymentOut, PaymentProvider
from app.modules.outbox import service as outbox_service
from app.modules.payments.models import Payment, PaymentStatus
from app.modules.payments.providers import get_provider
from app.modules.payments.providers.base import PaymentEvent


async def initiate_payment(
    session: AsyncSession, *, booking: Booking, provider_name: str, idempotency_key: str
) -> InitiatePaymentOut:
    if booking.status != BookingStatus.PENDING_PAYMENT:
        raise ConflictError(
            f"booking is in status {booking.status.value}, cannot initiate payment",
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


async def apply_webhook_event(
    session: AsyncSession, *, provider_name: str, event: PaymentEvent
) -> Payment | None:
    """Idempotently transitions payment + booking based on a verified provider event."""
    payment = (
        await session.execute(
            select(Payment).where(Payment.provider_intent_id == event.provider_intent_id)
        )
    ).scalar_one_or_none()
    if payment is None:
        return None
    payment.raw_last_event = event.raw

    if event.status == "captured" and payment.status != PaymentStatus.CAPTURED:
        payment.status = PaymentStatus.CAPTURED
        payment.captured_at = datetime.now(UTC)
        booking = await session.get(Booking, payment.booking_id)
        if booking is not None and booking.status == BookingStatus.PENDING_PAYMENT:
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
    elif event.status == "failed" and payment.status not in {
        PaymentStatus.CAPTURED,
        PaymentStatus.REFUNDED,
    }:
        payment.status = PaymentStatus.FAILED
        payment.failed_at = datetime.now(UTC)

    await session.commit()
    await session.refresh(payment)
    return payment
