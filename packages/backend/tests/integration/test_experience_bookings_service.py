"""Service-layer tests for experience_bookings: lifecycle and validations.

Each test sets up an experience with prices and a guest, then exercises
one service path. Real Postgres via the integration conftest.
"""

from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.core.money import Currency
from app.modules.experience_bookings import service as eb_service
from app.modules.experience_bookings.models import ExperienceBookingStatus
from app.modules.experience_bookings.schemas import ExperienceBookingCreateIn
from app.modules.experiences.models import Experience, ExperiencePrice, ExperienceStatus
from app.modules.users.models import User

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _make_user(session, *, is_host: bool = False) -> User:
    user = User(
        auth_user_id=uuid4().hex,
        email=f"{('host' if is_host else 'guest')}-{uuid4().hex[:8]}@example.com",
        display_name="Host" if is_host else "Guest",
        is_host=is_host,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def _make_experience(
    session,
    host: User,
    *,
    capacity: int = 8,
    currency: str = "XAF",
    amount: Decimal = Decimal("15000"),
    city: str = "Limbe",
    country_code: str = "CM",
    status: ExperienceStatus = ExperienceStatus.PUBLISHED,
) -> Experience:
    exp = Experience(
        host_id=host.id,
        title="Canoe tour",
        description="",
        experience_type="tour",
        city=city,
        country_code=country_code,
        location=from_shape(Point(9.21, 4.02), srid=4326),
        capacity=capacity,
        duration_minutes=120,
        status=status,
    )
    session.add(exp)
    await session.commit()
    await session.refresh(exp)
    exp.prices.append(ExperiencePrice(experience_id=exp.id, currency=currency, amount=amount))
    await session.commit()
    await session.refresh(exp)
    return exp


@pytest.mark.asyncio
async def test_create_request_happy_path(session):
    host = await _make_user(session, is_host=True)
    guest = await _make_user(session)
    exp = await _make_experience(session, host)

    when = date.today() + timedelta(days=5)
    booking = await eb_service.create_request(
        session,
        guest=guest,
        payload=ExperienceBookingCreateIn(
            experience_id=exp.id,
            requested_date=when,
            party_size=2,
            currency=Currency.XAF,
        ),
    )

    assert booking.status == ExperienceBookingStatus.REQUESTED
    assert booking.guest_id == guest.id
    assert booking.host_id == host.id
    assert booking.experience_id == exp.id
    assert booking.party_size == 2
    assert booking.requested_date == when
    assert booking.subtotal_amount == Decimal("30000")
    assert booking.total_amount == Decimal("30000")
    assert booking.host_payout_amount == Decimal("30000")
    assert booking.subtotal_currency == "XAF"
    assert booking.confirm_deadline_at is not None
    assert booking.hold_expires_at is None
    assert booking.payment_id is None


@pytest.mark.asyncio
async def test_create_request_rejects_past_date(session):
    host = await _make_user(session, is_host=True)
    guest = await _make_user(session)
    exp = await _make_experience(session, host)

    with pytest.raises(ValidationError) as e:
        await eb_service.create_request(
            session,
            guest=guest,
            payload=ExperienceBookingCreateIn(
                experience_id=exp.id,
                requested_date=date.today() - timedelta(days=1),
                party_size=1,
                currency=Currency.XAF,
            ),
        )
    assert e.value.code == "experience.date_past"


@pytest.mark.asyncio
async def test_create_request_rejects_unpublished_experience(session):
    host = await _make_user(session, is_host=True)
    guest = await _make_user(session)
    exp = await _make_experience(session, host, status=ExperienceStatus.DRAFT)

    with pytest.raises(NotFoundError) as e:
        await eb_service.create_request(
            session,
            guest=guest,
            payload=ExperienceBookingCreateIn(
                experience_id=exp.id,
                requested_date=date.today() + timedelta(days=3),
                party_size=1,
                currency=Currency.XAF,
            ),
        )
    assert e.value.code == "experience.not_found"


@pytest.mark.asyncio
async def test_create_request_rejects_self_booking(session):
    host = await _make_user(session, is_host=True)
    exp = await _make_experience(session, host)

    with pytest.raises(ForbiddenError) as e:
        await eb_service.create_request(
            session,
            guest=host,
            payload=ExperienceBookingCreateIn(
                experience_id=exp.id,
                requested_date=date.today() + timedelta(days=3),
                party_size=1,
                currency=Currency.XAF,
            ),
        )
    assert e.value.code == "experience.self_booking"


@pytest.mark.asyncio
async def test_create_request_rejects_party_size_above_capacity(session):
    host = await _make_user(session, is_host=True)
    guest = await _make_user(session)
    exp = await _make_experience(session, host, capacity=4)

    with pytest.raises(ValidationError) as e:
        await eb_service.create_request(
            session,
            guest=guest,
            payload=ExperienceBookingCreateIn(
                experience_id=exp.id,
                requested_date=date.today() + timedelta(days=3),
                party_size=5,
                currency=Currency.XAF,
            ),
        )
    assert e.value.code == "experience.party_size_invalid"


@pytest.mark.asyncio
async def test_create_request_rejects_unavailable_currency(session):
    host = await _make_user(session, is_host=True)
    guest = await _make_user(session)
    exp = await _make_experience(session, host, currency="XAF")

    with pytest.raises(ValidationError) as e:
        await eb_service.create_request(
            session,
            guest=guest,
            payload=ExperienceBookingCreateIn(
                experience_id=exp.id,
                requested_date=date.today() + timedelta(days=3),
                party_size=1,
                currency=Currency.XOF,
            ),
        )
    assert e.value.code == "experience.currency_unavailable"


@pytest.mark.asyncio
async def test_get_returns_for_guest_and_host(session):
    host = await _make_user(session, is_host=True)
    guest = await _make_user(session)
    exp = await _make_experience(session, host)

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

    fetched_as_guest = await eb_service.get(session, booking.id, viewer=guest)
    fetched_as_host = await eb_service.get(session, booking.id, viewer=host)
    assert fetched_as_guest.id == booking.id
    assert fetched_as_host.id == booking.id


@pytest.mark.asyncio
async def test_get_denies_third_party(session):
    host = await _make_user(session, is_host=True)
    guest = await _make_user(session)
    other = await _make_user(session)
    exp = await _make_experience(session, host)

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

    with pytest.raises(ForbiddenError):
        await eb_service.get(session, booking.id, viewer=other)
