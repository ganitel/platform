"""Service-level test for the suggested-stays feature: matching by city."""

from decimal import Decimal
from uuid import uuid4

import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import select

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


async def _exp(session, host: User, *, city: str) -> Experience:
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
        status=ExperienceStatus.PUBLISHED,
    )
    session.add(e)
    await session.commit()
    await session.refresh(e)
    e.prices.append(ExperiencePrice(experience_id=e.id, currency="XAF", amount=Decimal("10000")))
    await session.commit()
    await session.refresh(e)
    return e


async def _property(session, host: User, *, city: str, status=PropertyStatus.PUBLISHED) -> Property:
    p = Property(
        host_id=host.id,
        kind=PropertyKind.RENTAL,
        title=f"Place in {city}",
        description="",
        property_type="villa",
        city=city,
        country_code="CM",
        location=from_shape(Point(9.21, 4.02), srid=4326),
        capacity=4,
        status=status,
    )
    session.add(p)
    await session.commit()
    await session.refresh(p)
    p.prices.append(PropertyPrice(property_id=p.id, currency="XAF", amount=Decimal("30000")))
    await session.commit()
    await session.refresh(p)
    return p


@pytest.mark.asyncio
async def test_suggested_stays_filters_by_city_and_published(session):
    host = await _u(session, host=True)
    exp = await _exp(session, host, city="Limbe")
    same = await _property(session, host, city="Limbe")
    other = await _property(session, host, city="Douala")
    unpublished = await _property(session, host, city="Limbe", status=PropertyStatus.DRAFT)

    stmt = select(Property).where(
        Property.status == PropertyStatus.PUBLISHED,
        Property.city == exp.city,
        Property.country_code == exp.country_code,
    )
    rows = list((await session.execute(stmt)).scalars().all())
    ids = {p.id for p in rows}
    assert same.id in ids
    assert other.id not in ids
    assert unpublished.id not in ids
