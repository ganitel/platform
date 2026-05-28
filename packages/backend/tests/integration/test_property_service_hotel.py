"""Kind-aware property service projections + publish guard for hotels.

Covers:
- to_detail on a published hotel populates `summary` and `rooms` in
  position order; inactive rooms are still listed but excluded from the
  per-currency min, max capacity, and total inventory.
- to_admin_list_item on a hotel returns `room_count` equal to the number
  of active rooms.
- publish on a hotel with no rooms raises ValidationError(
  code="property.not_ready") with extra["issues"] == {"rooms": "empty"}
  once title + property media are present.
"""

from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.core.errors import ValidationError
from app.core.money import Currency
from app.modules.properties import service as prop_service
from app.modules.properties.models import (
    Property,
    PropertyKind,
    PropertyMediaItem,
    PropertyStatus,
    RoomType,
    RoomTypePrice,
)
from app.modules.users.models import User
from tests.integration.test_listing_media_flow import _request_upload, _seed_user


async def _make_host(session) -> User:
    user = User(
        auth_user_id=uuid4().hex,
        email=f"host-{uuid4().hex[:8]}@example.com",
        display_name="Hotelier",
        is_host=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def _make_hotel(
    session,
    host: User,
    *,
    status: PropertyStatus = PropertyStatus.PUBLISHED,
    title: str = "Test Hotel",
) -> Property:
    prop = Property(
        host_id=host.id,
        kind=PropertyKind.HOTEL,
        title=title,
        description="",
        property_type="boutique",
        city="Douala",
        country_code="CM",
        location=from_shape(Point(9.7, 4.05), srid=4326),
        status=status,
    )
    session.add(prop)
    await session.commit()
    await session.refresh(prop)
    return prop


async def _add_room(
    session,
    hotel: Property,
    *,
    title: str,
    max_guests: int,
    inventory_count: int,
    position: int,
    active: bool = True,
    prices: list[tuple[str, Decimal]] | None = None,
) -> RoomType:
    room = RoomType(
        property_id=hotel.id,
        title=title,
        max_guests=max_guests,
        inventory_count=inventory_count,
        position=position,
        active=active,
    )
    session.add(room)
    await session.commit()
    await session.refresh(room)
    for currency, amount in prices or []:
        session.add(RoomTypePrice(room_type_id=room.id, currency=currency, amount=amount))
    await session.commit()
    await session.refresh(room)
    return room


@pytest.mark.asyncio
async def test_to_detail_hotel_summary_and_rooms(db_session):
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)

    deluxe = await _add_room(
        db_session,
        hotel,
        title="Deluxe King",
        max_guests=2,
        inventory_count=5,
        position=1,
        prices=[("XAF", Decimal("80000"))],
    )
    standard = await _add_room(
        db_session,
        hotel,
        title="Standard Twin",
        max_guests=4,
        inventory_count=10,
        position=0,
        prices=[("XAF", Decimal("50000"))],
    )

    fresh = await prop_service.get(db_session, hotel.id)
    with patch(
        "app.modules.media.service.public_url",
        side_effect=lambda key: f"https://cdn.example/{key}",
    ):
        detail = await prop_service.to_detail(db_session, fresh, host)

    assert detail.summary is not None
    assert detail.summary.min_price is not None
    assert detail.summary.min_price.amount == Decimal("50000")
    assert detail.summary.min_price.currency == Currency.XAF
    assert detail.summary.max_capacity == 4
    assert detail.summary.total_inventory == 15

    assert [r.id for r in detail.rooms] == [standard.id, deluxe.id]
    assert detail.rooms[0].title == "Standard Twin"
    assert detail.rooms[1].title == "Deluxe King"


@pytest.mark.asyncio
async def test_to_detail_hotel_excludes_inactive_from_summary_but_lists_rooms(db_session):
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)

    active = await _add_room(
        db_session,
        hotel,
        title="Active Suite",
        max_guests=3,
        inventory_count=2,
        position=0,
        active=True,
        prices=[("XAF", Decimal("60000"))],
    )
    inactive = await _add_room(
        db_session,
        hotel,
        title="Retired Twin",
        max_guests=6,
        inventory_count=20,
        position=1,
        active=False,
        prices=[("XAF", Decimal("10000"))],
    )

    fresh = await prop_service.get(db_session, hotel.id)
    with patch(
        "app.modules.media.service.public_url",
        side_effect=lambda key: f"https://cdn.example/{key}",
    ):
        detail = await prop_service.to_detail(db_session, fresh, host)

    assert {r.id for r in detail.rooms} == {active.id, inactive.id}
    inactive_in_rooms = next(r for r in detail.rooms if r.id == inactive.id)
    assert inactive_in_rooms.active is False

    assert detail.summary is not None
    assert detail.summary.min_price is not None
    assert detail.summary.min_price.amount == Decimal("60000")
    assert detail.summary.max_capacity == 3
    assert detail.summary.total_inventory == 2


@pytest.mark.asyncio
async def test_to_admin_list_item_room_count_counts_active(db_session):
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)

    await _add_room(db_session, hotel, title="A", max_guests=2, inventory_count=1, position=0)
    await _add_room(db_session, hotel, title="B", max_guests=2, inventory_count=1, position=1)
    await _add_room(
        db_session,
        hotel,
        title="C-retired",
        max_guests=2,
        inventory_count=1,
        position=2,
        active=False,
    )

    fresh = await prop_service.get(db_session, hotel.id)
    with patch(
        "app.modules.media.service.public_url",
        side_effect=lambda key: f"https://cdn.example/{key}",
    ):
        item = await prop_service.to_admin_list_item(db_session, fresh)

    assert item.kind == PropertyKind.HOTEL
    assert item.room_count == 2


@pytest.mark.asyncio
async def test_publish_hotel_without_rooms_raises_not_ready(db_session):
    user = await _seed_user(db_session)
    hotel = await _make_hotel(db_session, user, status=PropertyStatus.DRAFT)

    img = await _request_upload(db_session, user, kind="image", mime="image/jpeg")
    db_session.add(PropertyMediaItem(property_id=hotel.id, media_id=img.id, position=0))
    await db_session.commit()

    fresh = await prop_service.get(db_session, hotel.id)
    with pytest.raises(ValidationError) as exc_info:
        await prop_service.publish(db_session, fresh, user)

    assert exc_info.value.code == "property.not_ready"
    assert exc_info.value.extra == {"issues": {"rooms": "empty"}}
