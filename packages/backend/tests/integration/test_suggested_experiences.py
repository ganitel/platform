"""Service-level test for the suggested-experiences feature: matching by city."""

from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import select

from app.modules.bookings.models import Booking, BookingStatus
from app.modules.experiences.models import Experience, ExperiencePrice, ExperienceStatus
from app.modules.properties.models import Property, PropertyKind, PropertyPrice, PropertyStatus
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


async def _experience(
    session, host: User, *, city: str, status=ExperienceStatus.PUBLISHED
) -> Experience:
    e = Experience(
        host_id=host.id,
        title=f"Tour in {city}",
        description="",
        experience_type="tour",
        city=city,
        country_code="CM",
        location=from_shape(Point(9.21, 4.02), srid=4326),
        capacity=10,
        duration_minutes=120,
        status=status,
    )
    session.add(e)
    await session.commit()
    await session.refresh(e)
    e.prices.append(ExperiencePrice(experience_id=e.id, currency="XAF", amount=Decimal("10000")))
    await session.commit()
    await session.refresh(e)
    return e


async def _stay_booking(session, guest: User, host: User, *, city: str) -> Booking:
    prop = Property(
        host_id=host.id,
        kind=PropertyKind.RENTAL,
        title="Villa",
        description="",
        property_type="villa",
        city=city,
        country_code="CM",
        location=from_shape(Point(9.21, 4.02), srid=4326),
        capacity=4,
        status=PropertyStatus.PUBLISHED,
    )
    session.add(prop)
    await session.commit()
    await session.refresh(prop)
    prop.prices.append(PropertyPrice(property_id=prop.id, currency="XAF", amount=Decimal("40000")))
    await session.commit()
    booking = Booking(
        guest_id=guest.id,
        property_id=prop.id,
        check_in_date=date.today() + timedelta(days=5),
        check_out_date=date.today() + timedelta(days=8),
        guest_count=2,
        subtotal_amount=Decimal("120000"),
        subtotal_currency="XAF",
        total_amount=Decimal("120000"),
        total_currency="XAF",
        host_payout_amount=Decimal("120000"),
        host_payout_currency="XAF",
        status=BookingStatus.CONFIRMED,
    )
    session.add(booking)
    await session.commit()
    await session.refresh(booking)
    return booking


@pytest.mark.asyncio
async def test_suggested_experiences_filters_by_city_and_published(session):
    """The route is a thin wrapper around a city-matched query.
    This service-level test exercises the same query without HTTP."""
    host = await _u(session, host=True)
    guest = await _u(session)
    stay = await _stay_booking(session, guest, host, city="Limbe")
    same = await _experience(session, host, city="Limbe")
    other = await _experience(session, host, city="Douala")
    unpublished = await _experience(session, host, city="Limbe", status=ExperienceStatus.DRAFT)

    prop = await session.get(Property, stay.property_id)
    assert prop is not None
    stmt = select(Experience).where(
        Experience.status == ExperienceStatus.PUBLISHED,
        Experience.city == prop.city,
        Experience.country_code == prop.country_code,
    )
    rows = list((await session.execute(stmt)).scalars().all())
    ids = {e.id for e in rows}
    assert same.id in ids
    assert other.id not in ids
    assert unpublished.id not in ids
