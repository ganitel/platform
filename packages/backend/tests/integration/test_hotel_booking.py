"""Hotel-aware booking allocation: per-room-type slot assignment.

Covers create_booking when the property is a hotel:
- Allocates the lowest free slot index per room_type (0, then 1, ...).
- Rejects with ConflictError(code="booking.dates_unavailable") once all
  inventory slots are taken for an overlapping range.
- Reuses slot 0 when ranges don't overlap (back-to-back stays).
- Hotel without room_type_id payload -> ValidationError(code="booking.room_required").
- Rental with room_type_id payload -> ValidationError(code="booking.room_forbidden").
- Inactive room -> ValidationError(code="room.inactive").
- guest_count > room.max_guests -> ValidationError(code="booking.capacity_exceeded").
"""

from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.core.errors import ConflictError, ValidationError
from app.core.money import Currency
from app.modules.bookings import service as booking_service
from app.modules.bookings.schemas import BookingCreateIn
from app.modules.properties.models import (
    Property,
    PropertyKind,
    PropertyPrice,
    PropertyStatus,
    RoomType,
    RoomTypePrice,
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
        display_name="Guest",
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


async def _make_rental(session, host: User) -> Property:
    prop = Property(
        host_id=host.id,
        kind=PropertyKind.RENTAL,
        title="Test Rental",
        description="",
        property_type="apartment",
        city="Douala",
        country_code="CM",
        location=from_shape(Point(9.7, 4.05), srid=4326),
        capacity=4,
        status=PropertyStatus.PUBLISHED,
    )
    session.add(prop)
    await session.commit()
    session.add(PropertyPrice(property_id=prop.id, currency="XAF", amount=Decimal("50000")))
    await session.commit()
    await session.refresh(prop)
    return prop


async def _add_room(
    session,
    hotel: Property,
    *,
    max_guests: int = 2,
    inventory_count: int = 2,
    active: bool = True,
    title: str = "Deluxe King",
    price_xaf: Decimal = Decimal("80000"),
) -> RoomType:
    room = RoomType(
        property_id=hotel.id,
        title=title,
        max_guests=max_guests,
        inventory_count=inventory_count,
        active=active,
    )
    session.add(room)
    await session.commit()
    await session.refresh(room)
    session.add(RoomTypePrice(room_type_id=room.id, currency="XAF", amount=price_xaf))
    await session.commit()
    await session.refresh(room)
    return room


def _payload(
    *,
    property_id,
    room_type_id=None,
    check_in: date,
    check_out: date,
    guest_count: int = 1,
) -> BookingCreateIn:
    return BookingCreateIn(
        property_id=property_id,
        room_type_id=room_type_id,
        check_in_date=check_in,
        check_out_date=check_out,
        guest_count=guest_count,
        currency=Currency.XAF,
    )


@pytest.mark.asyncio
async def test_hotel_booking_allocates_lowest_free_slot(db_session) -> None:
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    room = await _add_room(db_session, hotel, inventory_count=3)
    guest_a = await _make_guest(db_session)
    guest_b = await _make_guest(db_session)

    today = date.today()
    check_in = today + timedelta(days=10)
    check_out = today + timedelta(days=12)

    first = await booking_service.create_booking(
        db_session,
        guest_a,
        _payload(
            property_id=hotel.id, room_type_id=room.id, check_in=check_in, check_out=check_out
        ),
    )
    assert first.room_slot_index == 0
    assert first.room_type_id == room.id

    second = await booking_service.create_booking(
        db_session,
        guest_b,
        _payload(
            property_id=hotel.id, room_type_id=room.id, check_in=check_in, check_out=check_out
        ),
    )
    assert second.room_slot_index == 1


@pytest.mark.asyncio
async def test_hotel_booking_rejects_when_inventory_exhausted(db_session) -> None:
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    room = await _add_room(db_session, hotel, inventory_count=1)
    guest_a = await _make_guest(db_session)
    guest_b = await _make_guest(db_session)

    today = date.today()
    check_in = today + timedelta(days=10)
    check_out = today + timedelta(days=12)

    await booking_service.create_booking(
        db_session,
        guest_a,
        _payload(
            property_id=hotel.id, room_type_id=room.id, check_in=check_in, check_out=check_out
        ),
    )

    with pytest.raises(ConflictError) as exc_info:
        await booking_service.create_booking(
            db_session,
            guest_b,
            _payload(
                property_id=hotel.id,
                room_type_id=room.id,
                check_in=check_in,
                check_out=check_out,
            ),
        )
    assert exc_info.value.code == "booking.dates_unavailable"


@pytest.mark.asyncio
async def test_hotel_booking_reuses_slot_when_ranges_do_not_overlap(db_session) -> None:
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    room = await _add_room(db_session, hotel, inventory_count=1)
    guest_a = await _make_guest(db_session)
    guest_b = await _make_guest(db_session)

    today = date.today()
    first = await booking_service.create_booking(
        db_session,
        guest_a,
        _payload(
            property_id=hotel.id,
            room_type_id=room.id,
            check_in=today + timedelta(days=10),
            check_out=today + timedelta(days=12),
        ),
    )
    assert first.room_slot_index == 0

    second = await booking_service.create_booking(
        db_session,
        guest_b,
        _payload(
            property_id=hotel.id,
            room_type_id=room.id,
            check_in=today + timedelta(days=12),
            check_out=today + timedelta(days=14),
        ),
    )
    assert second.room_slot_index == 0


@pytest.mark.asyncio
async def test_hotel_booking_requires_room_type_id(db_session) -> None:
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    await _add_room(db_session, hotel)
    guest = await _make_guest(db_session)

    today = date.today()
    with pytest.raises(ValidationError) as exc_info:
        await booking_service.create_booking(
            db_session,
            guest,
            _payload(
                property_id=hotel.id,
                room_type_id=None,
                check_in=today + timedelta(days=10),
                check_out=today + timedelta(days=12),
            ),
        )
    assert exc_info.value.code == "booking.room_required"


@pytest.mark.asyncio
async def test_rental_booking_rejects_room_type_id(db_session) -> None:
    host = await _make_host(db_session)
    rental = await _make_rental(db_session, host)
    guest = await _make_guest(db_session)

    today = date.today()
    with pytest.raises(ValidationError) as exc_info:
        await booking_service.create_booking(
            db_session,
            guest,
            _payload(
                property_id=rental.id,
                room_type_id=uuid4(),
                check_in=today + timedelta(days=10),
                check_out=today + timedelta(days=12),
            ),
        )
    assert exc_info.value.code == "booking.room_forbidden"


@pytest.mark.asyncio
async def test_hotel_booking_rejects_inactive_room(db_session) -> None:
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    room = await _add_room(db_session, hotel, active=False)
    guest = await _make_guest(db_session)

    today = date.today()
    with pytest.raises(ValidationError) as exc_info:
        await booking_service.create_booking(
            db_session,
            guest,
            _payload(
                property_id=hotel.id,
                room_type_id=room.id,
                check_in=today + timedelta(days=10),
                check_out=today + timedelta(days=12),
            ),
        )
    assert exc_info.value.code == "room.inactive"


@pytest.mark.asyncio
async def test_hotel_booking_rejects_guest_count_over_max(db_session) -> None:
    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    room = await _add_room(db_session, hotel, max_guests=2)
    guest = await _make_guest(db_session)

    today = date.today()
    with pytest.raises(ValidationError) as exc_info:
        await booking_service.create_booking(
            db_session,
            guest,
            _payload(
                property_id=hotel.id,
                room_type_id=room.id,
                check_in=today + timedelta(days=10),
                check_out=today + timedelta(days=12),
                guest_count=3,
            ),
        )
    assert exc_info.value.code == "booking.capacity_exceeded"
