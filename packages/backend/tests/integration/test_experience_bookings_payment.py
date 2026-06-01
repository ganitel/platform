"""End-to-end payment flow for an experience booking using the noop provider."""

from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.core.money import Currency
from app.modules.experience_bookings import service as eb_service
from app.modules.experience_bookings.models import ExperienceBookingStatus
from app.modules.experience_bookings.schemas import ExperienceBookingCreateIn
from app.modules.experiences.models import Experience, ExperiencePrice, ExperienceStatus
from app.modules.payments import service as payments_service
from app.modules.payments.models import Payment
from app.modules.payments.providers.base import PaymentEvent
from app.modules.users.models import User

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _u(session, *, host: bool = False) -> User:
    u = User(
        auth_user_id=uuid4().hex,
        email=f"u-{uuid4().hex[:8]}@example.com",
        display_name="U",
        is_host=host,
    )
    session.add(u)
    await session.commit()
    await session.refresh(u)
    return u


async def _exp(session, host: User) -> Experience:
    e = Experience(
        host_id=host.id,
        title="Tour",
        description="",
        experience_type="tour",
        city="Limbe",
        country_code="CM",
        location=from_shape(Point(9.21, 4.02), srid=4326),
        capacity=10,
        duration_minutes=120,
        status=ExperienceStatus.PUBLISHED,
    )
    session.add(e)
    await session.commit()
    await session.refresh(e)
    e.prices.append(ExperiencePrice(experience_id=e.id, currency="XAF", amount=Decimal("10000")))
    await session.commit()
    await session.refresh(e)
    return e


@pytest.mark.asyncio
async def test_host_confirm_creates_payment_intent(session):
    host = await _u(session, host=True)
    guest = await _u(session)
    exp = await _exp(session, host)

    booking = await eb_service.create_request(
        session,
        guest=guest,
        payload=ExperienceBookingCreateIn(
            experience_id=exp.id,
            requested_date=date.today() + timedelta(days=5),
            party_size=1,
            currency=Currency.XAF,
        ),
    )
    confirmed = await eb_service.confirm_as_host(
        session,
        booking_id=booking.id,
        host=host,
        provider_name="noop",
        idempotency_key="key-1",
    )
    assert confirmed.status == ExperienceBookingStatus.PENDING_PAYMENT
    assert confirmed.payment_id is not None
    assert confirmed.hold_expires_at is not None
    assert confirmed.host_confirmed_at is not None


@pytest.mark.asyncio
async def test_payment_webhook_confirms_experience_booking(session):
    host = await _u(session, host=True)
    guest = await _u(session)
    exp = await _exp(session, host)

    booking = await eb_service.create_request(
        session,
        guest=guest,
        payload=ExperienceBookingCreateIn(
            experience_id=exp.id,
            requested_date=date.today() + timedelta(days=5),
            party_size=1,
            currency=Currency.XAF,
        ),
    )
    await eb_service.confirm_as_host(
        session,
        booking_id=booking.id,
        host=host,
        provider_name="noop",
        idempotency_key="key-1",
    )
    await session.refresh(booking)

    payment = await session.get(Payment, booking.payment_id)
    assert payment is not None and payment.provider_intent_id is not None

    await payments_service.apply_webhook_event(
        session,
        provider_name="noop",
        event=PaymentEvent(
            provider_intent_id=payment.provider_intent_id,
            status="captured",
            raw={},
        ),
    )

    await session.refresh(booking)
    assert booking.status == ExperienceBookingStatus.CONFIRMED
