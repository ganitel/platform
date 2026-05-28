"""Route-level coverage for room availability projection.

The project has no HTTP test framework yet, so these tests exercise the
route handler functions directly and assert the math of
`_compute_availability`.
"""

from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi import Response
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.core.errors import NotFoundError
from app.core.money import Currency, Money
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.properties import rooms_service
from app.modules.properties.models import Property, PropertyKind, PropertyStatus
from app.modules.properties.routes import _compute_availability, list_property_rooms
from app.modules.properties.schemas import RoomTypeCreateIn
from app.modules.users.models import User


async def _seed_host(session) -> User:
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


async def _seed_guest(session) -> User:
    user = User(
        auth_user_id=uuid4().hex,
        email=f"guest-{uuid4().hex[:8]}@example.com",
        display_name="Guest",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def _seed_hotel(session, host: User, *, status: PropertyStatus) -> Property:
    prop = Property(
        host_id=host.id,
        kind=PropertyKind.HOTEL,
        title="Test Hotel",
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


async def _seed_room(session, host: User, hotel: Property, inventory_count: int = 3):
    payload = RoomTypeCreateIn(
        title="Deluxe King",
        max_guests=2,
        inventory_count=inventory_count,
        prices=[Money(amount=Decimal("80000"), currency=Currency.XAF)],
    )
    return await rooms_service.create_room(session, hotel, host, payload)


@pytest.mark.asyncio
async def test_compute_availability_counts_overlapping_bookings(db_session):
    host = await _seed_host(db_session)
    hotel = await _seed_hotel(db_session, host, status=PropertyStatus.PUBLISHED)
    room = await _seed_room(db_session, host, hotel, inventory_count=3)

    today = date.today()
    check_in = today + timedelta(days=10)
    check_out = today + timedelta(days=14)

    guest = await _seed_guest(db_session)
    db_session.add(
        Booking(
            guest_id=guest.id,
            property_id=hotel.id,
            room_type_id=room.id,
            room_slot_index=0,
            check_in_date=check_in + timedelta(days=1),
            check_out_date=check_out - timedelta(days=1),
            guest_count=1,
            subtotal_amount=Decimal("80000"),
            subtotal_currency="XAF",
            total_amount=Decimal("80000"),
            total_currency="XAF",
            host_payout_amount=Decimal("80000"),
            host_payout_currency="XAF",
            status=BookingStatus.CONFIRMED,
        )
    )
    await db_session.commit()

    fresh = await rooms_service.get_room(db_session, room.id)
    avail = await _compute_availability(
        db_session, fresh, check_in, check_out, currency="XAF", guests=2
    )

    assert avail.units_available == 2
    assert avail.available is True
    assert avail.nights == 4
    assert avail.nightly is not None
    assert avail.nightly.amount == Decimal("80000")
    assert avail.total is not None
    assert avail.total.amount == Decimal("320000")


@pytest.mark.asyncio
async def test_compute_availability_blocks_when_guests_exceed_max(db_session):
    host = await _seed_host(db_session)
    hotel = await _seed_hotel(db_session, host, status=PropertyStatus.PUBLISHED)
    room = await _seed_room(db_session, host, hotel, inventory_count=1)

    today = date.today()
    fresh = await rooms_service.get_room(db_session, room.id)
    avail = await _compute_availability(
        db_session,
        fresh,
        check_in=today + timedelta(days=1),
        check_out=today + timedelta(days=3),
        currency=None,
        guests=5,
    )

    assert avail.units_available == 1
    assert avail.available is False
    assert avail.nights == 2


@pytest.mark.asyncio
async def test_list_property_rooms_with_dates_attaches_availability(db_session):
    host = await _seed_host(db_session)
    hotel = await _seed_hotel(db_session, host, status=PropertyStatus.PUBLISHED)
    room = await _seed_room(db_session, host, hotel, inventory_count=2)

    today = date.today()
    check_in = today + timedelta(days=5)
    check_out = today + timedelta(days=8)

    guest = await _seed_guest(db_session)
    db_session.add(
        Booking(
            guest_id=guest.id,
            property_id=hotel.id,
            room_type_id=room.id,
            room_slot_index=0,
            check_in_date=check_in,
            check_out_date=check_out,
            guest_count=1,
            subtotal_amount=Decimal("80000"),
            subtotal_currency="XAF",
            total_amount=Decimal("80000"),
            total_currency="XAF",
            host_payout_amount=Decimal("80000"),
            host_payout_currency="XAF",
            status=BookingStatus.PENDING_PAYMENT,
        )
    )
    await db_session.commit()

    response = Response()
    rooms = await list_property_rooms(
        property_id=hotel.id,
        response=response,
        session=db_session,
        user=None,
        check_in=check_in,
        check_out=check_out,
        guests=2,
        currency="XAF",
    )

    assert len(rooms) == 1
    assert rooms[0].availability is not None
    assert rooms[0].availability.units_available == 1
    assert rooms[0].availability.nights == 3
    assert response.headers["Cache-Control"] == "private, no-store"


@pytest.mark.asyncio
async def test_list_property_rooms_without_dates_omits_availability(db_session):
    host = await _seed_host(db_session)
    hotel = await _seed_hotel(db_session, host, status=PropertyStatus.PUBLISHED)
    await _seed_room(db_session, host, hotel)

    response = Response()
    rooms = await list_property_rooms(
        property_id=hotel.id,
        response=response,
        session=db_session,
        user=None,
    )

    assert len(rooms) == 1
    assert rooms[0].availability is None


@pytest.mark.asyncio
async def test_list_property_rooms_404s_when_not_published(db_session):
    host = await _seed_host(db_session)
    hotel = await _seed_hotel(db_session, host, status=PropertyStatus.DRAFT)
    await _seed_room(db_session, host, hotel)

    response = Response()
    with pytest.raises(NotFoundError) as exc_info:
        await list_property_rooms(
            property_id=hotel.id,
            response=response,
            session=db_session,
            user=None,
        )
    assert exc_info.value.code == "property.not_found"
