"""Room-type service: CRUD + active-booking guards.

Covers:
- create_room happy path persists room, prices, and media in order.
- update_room partial (title only) does not wipe prices.
- update_room inventory_count below an active booking's slot raises ConflictError.
- soft_delete_room with an active booking raises ConflictError; without it
  flips active=False.
- create_room against a rental raises ValidationError(code="room.requires_hotel").
"""

from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

from app.core.errors import ConflictError, ValidationError
from app.core.money import Currency, Money
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.properties import rooms_service
from app.modules.properties.models import (
    Property,
    PropertyKind,
    PropertyStatus,
    RoomType,
)
from app.modules.properties.schemas import (
    BedSpec,
    RoomTypeCreateIn,
    RoomTypeUpdateIn,
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
        capacity=2,
        status=PropertyStatus.DRAFT,
    )
    session.add(prop)
    await session.commit()
    await session.refresh(prop)
    return prop


@pytest.mark.asyncio
async def test_create_room_persists_room_prices_and_media(db_session):
    user = await _seed_user(db_session)
    hotel = await _make_hotel(db_session, user)

    img1 = await _request_upload(db_session, user, kind="image", mime="image/jpeg")
    img2 = await _request_upload(db_session, user, kind="image", mime="image/jpeg")

    payload = RoomTypeCreateIn(
        title="Deluxe King",
        description="Spacious king with balcony",
        bed_config=[BedSpec(type="king", count=1)],
        max_guests=2,
        amenities=["wifi", "ac"],
        private_bathroom=True,
        inventory_count=5,
        prices=[Money(amount=Decimal("80000"), currency=Currency.XAF)],
        active=True,
        position=0,
        media_ids=[img1.id, img2.id],
    )

    room = await rooms_service.create_room(db_session, hotel, user, payload)
    fresh = await rooms_service.get_room(db_session, room.id)

    assert fresh.title == "Deluxe King"
    assert fresh.property_id == hotel.id
    assert fresh.max_guests == 2
    assert fresh.inventory_count == 5
    assert fresh.bed_config == [{"type": "king", "count": 1}]
    assert [p.currency for p in fresh.prices] == ["XAF"]
    assert fresh.prices[0].amount == Decimal("80000")
    assert [it.media_id for it in fresh.media] == [img1.id, img2.id]
    assert [it.position for it in fresh.media] == [0, 1]


@pytest.mark.asyncio
async def test_update_room_partial_title_only_keeps_prices(db_session):
    user = await _seed_user(db_session)
    hotel = await _make_hotel(db_session, user)

    payload = RoomTypeCreateIn(
        title="Standard Twin",
        max_guests=2,
        inventory_count=3,
        prices=[
            Money(amount=Decimal("50000"), currency=Currency.XAF),
            Money(amount=Decimal("80"), currency=Currency.EUR),
        ],
    )
    room = await rooms_service.create_room(db_session, hotel, user, payload)

    patch = RoomTypeUpdateIn.model_validate({"title": "Renamed Twin"})
    updated = await rooms_service.update_room(db_session, hotel, user, room, patch)

    fresh = await rooms_service.get_room(db_session, updated.id)
    assert fresh.title == "Renamed Twin"
    currencies = sorted(p.currency for p in fresh.prices)
    assert currencies == ["EUR", "XAF"]
    assert len(fresh.prices) == 2


@pytest.mark.asyncio
async def test_update_room_inventory_below_active_booking_raises(db_session):
    user = await _seed_user(db_session)
    hotel = await _make_hotel(db_session, user)

    payload = RoomTypeCreateIn(
        title="Suite",
        max_guests=2,
        inventory_count=5,
        prices=[Money(amount=Decimal("90000"), currency=Currency.XAF)],
    )
    room = await rooms_service.create_room(db_session, hotel, user, payload)

    guest = await _make_guest(db_session)
    today = date.today()
    db_session.add(
        Booking(
            guest_id=guest.id,
            property_id=hotel.id,
            room_type_id=room.id,
            room_slot_index=3,
            check_in_date=today + timedelta(days=10),
            check_out_date=today + timedelta(days=12),
            guest_count=1,
            subtotal_amount=Decimal("90000"),
            subtotal_currency="XAF",
            total_amount=Decimal("90000"),
            total_currency="XAF",
            host_payout_amount=Decimal("90000"),
            host_payout_currency="XAF",
            status=BookingStatus.CONFIRMED,
        )
    )
    await db_session.commit()

    patch = RoomTypeUpdateIn.model_validate({"inventory_count": 3})
    with pytest.raises(ConflictError) as exc_info:
        await rooms_service.update_room(db_session, hotel, user, room, patch)

    assert exc_info.value.code == "room.inventory_below_active_bookings"
    assert exc_info.value.extra == {"min": 4}


@pytest.mark.asyncio
async def test_soft_delete_room_blocked_by_active_booking(db_session):
    user = await _seed_user(db_session)
    hotel = await _make_hotel(db_session, user)

    payload = RoomTypeCreateIn(
        title="Suite",
        max_guests=2,
        inventory_count=2,
        prices=[Money(amount=Decimal("90000"), currency=Currency.XAF)],
    )
    room = await rooms_service.create_room(db_session, hotel, user, payload)

    guest = await _make_guest(db_session)
    today = date.today()
    db_session.add(
        Booking(
            guest_id=guest.id,
            property_id=hotel.id,
            room_type_id=room.id,
            room_slot_index=0,
            check_in_date=today + timedelta(days=5),
            check_out_date=today + timedelta(days=7),
            guest_count=1,
            subtotal_amount=Decimal("90000"),
            subtotal_currency="XAF",
            total_amount=Decimal("90000"),
            total_currency="XAF",
            host_payout_amount=Decimal("90000"),
            host_payout_currency="XAF",
            status=BookingStatus.PENDING_PAYMENT,
        )
    )
    await db_session.commit()

    with pytest.raises(ConflictError) as exc_info:
        await rooms_service.soft_delete_room(db_session, hotel, user, room)

    assert exc_info.value.code == "room.has_active_bookings"
    assert exc_info.value.extra == {"active_bookings": 1}


@pytest.mark.asyncio
async def test_soft_delete_room_without_active_bookings_flips_active(db_session):
    user = await _seed_user(db_session)
    hotel = await _make_hotel(db_session, user)

    payload = RoomTypeCreateIn(
        title="Suite",
        max_guests=2,
        inventory_count=2,
        prices=[Money(amount=Decimal("90000"), currency=Currency.XAF)],
    )
    room = await rooms_service.create_room(db_session, hotel, user, payload)

    deleted = await rooms_service.soft_delete_room(db_session, hotel, user, room)
    assert deleted.active is False

    fresh = await rooms_service.get_room(db_session, room.id)
    assert fresh.active is False
    # prices still exist; soft delete doesn't touch them
    price_count = sum(1 for _ in fresh.prices)
    assert price_count == 1


@pytest.mark.asyncio
async def test_create_room_against_rental_raises_requires_hotel(db_session):
    user = await _seed_user(db_session)
    rental = await _make_rental(db_session, user)

    payload = RoomTypeCreateIn(
        title="Should not apply",
        max_guests=2,
        inventory_count=1,
        prices=[Money(amount=Decimal("10000"), currency=Currency.XAF)],
    )

    with pytest.raises(ValidationError) as exc_info:
        await rooms_service.create_room(db_session, rental, user, payload)

    assert exc_info.value.code == "room.requires_hotel"
    # no rooms created for the rental
    rooms_for_rental = (
        await db_session.execute(
            RoomType.__table__.select().where(RoomType.__table__.c.property_id == rental.id)
        )
    ).all()
    assert rooms_for_rental == []
