"""Integration smoke for the hotels migration:
- Property.kind defaults to rental
- RoomType rows cascade-delete with the property
- bookings_room_no_overlap exclusion blocks same slot/range
- ck_bookings_room_pair check constraint enforces the both-or-neither rule
"""

from datetime import date, timedelta
from uuid import uuid4

import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.modules.bookings.models import Booking, BookingStatus
from app.modules.properties.models import (
    Property,
    PropertyKind,
    PropertyStatus,
    RoomType,
)
from app.modules.users.models import User


async def _make_host(session) -> User:
    user = User(
        auth_user_id=uuid4().hex,
        email=f"host-{uuid4().hex[:8]}@example.com",
        display_name="Host",
        is_host=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def _make_guest(session) -> User:
    user = User(
        auth_user_id=uuid4().hex,
        email=f"guest-{uuid4().hex[:8]}@example.com",
        display_name="G",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def _make_hotel(session, host: User) -> Property:
    prop = Property(
        host_id=host.id,
        kind=PropertyKind.HOTEL,
        title="Test Hotel",
        description="",
        property_type="boutique",
        city="Douala",
        country_code="CM",
        location=from_shape(Point(9.7, 4.05), srid=4326),
        status=PropertyStatus.PUBLISHED,
    )
    session.add(prop)
    await session.commit()
    await session.refresh(prop)
    return prop


@pytest.mark.asyncio
async def test_property_kind_defaults_to_rental(db_session) -> None:
    host = await _make_host(db_session)
    rental = Property(
        host_id=host.id,
        title="Rental",
        description="",
        property_type="apartment",
        city="Douala",
        country_code="CM",
        location=from_shape(Point(9.7, 4.05), srid=4326),
        capacity=2,
        status=PropertyStatus.DRAFT,
    )
    db_session.add(rental)
    await db_session.commit()
    await db_session.refresh(rental)
    assert rental.kind == PropertyKind.RENTAL


@pytest.mark.asyncio
async def test_room_type_cascade_on_property_delete(db_session) -> None:
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    room = RoomType(
        property_id=hotel.id,
        title="Deluxe King",
        max_guests=2,
        inventory_count=3,
    )
    db_session.add(room)
    await db_session.commit()
    room_id = room.id

    await db_session.delete(hotel)
    await db_session.commit()

    found = (
        await db_session.execute(select(RoomType).where(RoomType.id == room_id))
    ).scalar_one_or_none()
    assert found is None


@pytest.mark.asyncio
async def test_room_slot_exclusion_blocks_overlap(db_session) -> None:
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    room = RoomType(
        property_id=hotel.id,
        title="Single",
        max_guests=1,
        inventory_count=2,
    )
    db_session.add(room)
    await db_session.commit()
    await db_session.refresh(room)

    guest = await _make_guest(db_session)

    today = date.today()
    common = {
        "guest_id": guest.id,
        "property_id": hotel.id,
        "check_in_date": today + timedelta(days=10),
        "check_out_date": today + timedelta(days=12),
        "guest_count": 1,
        "subtotal_amount": 1000,
        "subtotal_currency": "XAF",
        "total_amount": 1000,
        "total_currency": "XAF",
        "host_payout_amount": 1000,
        "host_payout_currency": "XAF",
        "status": BookingStatus.CONFIRMED,
        "room_type_id": room.id,
    }

    db_session.add(Booking(**common, room_slot_index=0))
    await db_session.commit()

    db_session.add(Booking(**common, room_slot_index=1))
    await db_session.commit()

    db_session.add(Booking(**common, room_slot_index=0))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


@pytest.mark.asyncio
async def test_room_pair_check_constraint(db_session) -> None:
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    guest = await _make_guest(db_session)

    today = date.today()
    db_session.add(
        Booking(
            guest_id=guest.id,
            property_id=hotel.id,
            check_in_date=today + timedelta(days=1),
            check_out_date=today + timedelta(days=2),
            guest_count=1,
            subtotal_amount=1,
            subtotal_currency="XAF",
            total_amount=1,
            total_currency="XAF",
            host_payout_amount=1,
            host_payout_currency="XAF",
            status=BookingStatus.PENDING_PAYMENT,
            room_type_id=None,
            room_slot_index=5,
        )
    )
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()
