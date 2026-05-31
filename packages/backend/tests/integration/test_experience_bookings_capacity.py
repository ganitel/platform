"""Per-experience-per-date capacity enforcement."""

from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.core.errors import ConflictError
from app.core.money import Currency
from app.modules.experience_bookings import service as eb_service
from app.modules.experience_bookings.models import ExperienceBookingStatus
from app.modules.experience_bookings.schemas import ExperienceBookingCreateIn
from app.modules.experiences.models import Experience, ExperiencePrice, ExperienceStatus
from app.modules.users.models import User

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


async def _user(session, *, is_host: bool = False) -> User:
    user = User(
        auth_user_id=uuid4().hex,
        email=f"u-{uuid4().hex[:8]}@example.com",
        display_name="U",
        is_host=is_host,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def _experience(session, host: User, *, capacity: int) -> Experience:
    exp = Experience(
        host_id=host.id,
        title="Tour",
        description="",
        experience_type="tour",
        city="Limbe",
        country_code="CM",
        location=from_shape(Point(9.21, 4.02), srid=4326),
        capacity=capacity,
        duration_minutes=120,
        status=ExperienceStatus.PUBLISHED,
    )
    session.add(exp)
    await session.commit()
    await session.refresh(exp)
    exp.prices.append(
        ExperiencePrice(experience_id=exp.id, currency="XAF", amount=Decimal("10000"))
    )
    await session.commit()
    await session.refresh(exp)
    return exp


@pytest.mark.asyncio
async def test_capacity_exceeded_rejects_request(session):
    host = await _user(session, is_host=True)
    g1 = await _user(session)
    g2 = await _user(session)
    exp = await _experience(session, host, capacity=3)

    when = date.today() + timedelta(days=5)

    await eb_service.create_request(
        session,
        guest=g1,
        payload=ExperienceBookingCreateIn(
            experience_id=exp.id, requested_date=when, party_size=2, currency=Currency.XAF
        ),
    )
    with pytest.raises(ConflictError) as e:
        await eb_service.create_request(
            session,
            guest=g2,
            payload=ExperienceBookingCreateIn(
                experience_id=exp.id, requested_date=when, party_size=2, currency=Currency.XAF
            ),
        )
    assert e.value.code == "experience.date_capacity_exceeded"
    assert e.value.extra["available"] == 1


@pytest.mark.asyncio
async def test_capacity_isolated_per_date(session):
    host = await _user(session, is_host=True)
    g1 = await _user(session)
    g2 = await _user(session)
    exp = await _experience(session, host, capacity=3)

    when = date.today() + timedelta(days=5)
    other = date.today() + timedelta(days=6)

    await eb_service.create_request(
        session,
        guest=g1,
        payload=ExperienceBookingCreateIn(
            experience_id=exp.id, requested_date=when, party_size=3, currency=Currency.XAF
        ),
    )
    booking = await eb_service.create_request(
        session,
        guest=g2,
        payload=ExperienceBookingCreateIn(
            experience_id=exp.id, requested_date=other, party_size=3, currency=Currency.XAF
        ),
    )
    assert booking.status == ExperienceBookingStatus.REQUESTED


@pytest.mark.asyncio
async def test_capacity_excludes_terminal_bookings(session):
    """Cancelled bookings free up their capacity slot."""
    host = await _user(session, is_host=True)
    g1 = await _user(session)
    g2 = await _user(session)
    exp = await _experience(session, host, capacity=3)

    when = date.today() + timedelta(days=5)

    first = await eb_service.create_request(
        session,
        guest=g1,
        payload=ExperienceBookingCreateIn(
            experience_id=exp.id, requested_date=when, party_size=3, currency=Currency.XAF
        ),
    )
    first.status = ExperienceBookingStatus.CANCELLED_BY_GUEST
    await session.commit()

    booking = await eb_service.create_request(
        session,
        guest=g2,
        payload=ExperienceBookingCreateIn(
            experience_id=exp.id, requested_date=when, party_size=3, currency=Currency.XAF
        ),
    )
    assert booking.status == ExperienceBookingStatus.REQUESTED
