import datetime as _dt

import pytest
from sqlalchemy import select, text

import app.modules.bookings.models
import app.modules.experiences.models
import app.modules.media.models
import app.modules.outbox.models
import app.modules.payments.models
import app.modules.properties.models
import app.modules.team.models
import app.modules.users.models  # noqa: F401
from app.modules.waitlist import service as waitlist_service
from app.modules.waitlist.models import WaitlistEntry
from app.modules.waitlist.schemas import WaitlistEntryIn


@pytest.mark.asyncio
async def test_db_session_round_trip(db_session) -> None:
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar_one() == 1


@pytest.mark.asyncio
async def test_waitlist_traveler_end_to_end(db_session) -> None:
    body = WaitlistEntryIn.model_validate(
        {
            "email": "trip@example.com",
            "role": "traveler",
            "interest": "renting",
            "travel_start": (_dt.date.today() + _dt.timedelta(days=5)).isoformat(),
            "travel_end": (_dt.date.today() + _dt.timedelta(days=12)).isoformat(),
            "adults": 2,
            "children": 1,
            "budget_range": "50k_150k",
            "budget_currency": "xaf",
        }
    )
    _entry, _ = await waitlist_service.create_entry(db_session, body)

    row = (
        await db_session.execute(
            select(WaitlistEntry).where(WaitlistEntry.email == "trip@example.com")
        )
    ).scalar_one()
    assert row.travel_start == _dt.date.today() + _dt.timedelta(days=5)
    assert row.travel_end == _dt.date.today() + _dt.timedelta(days=12)
    assert row.adults == 2
    assert row.children == 1
    assert row.headcount is None


@pytest.mark.asyncio
async def test_waitlist_persists_room_type_intent(db_session) -> None:
    from decimal import Decimal

    from app.core.money import Currency, Money
    from app.modules.properties import rooms_service
    from app.modules.properties.schemas import RoomTypeCreateIn
    from tests.integration.test_rooms_service import _make_host, _make_hotel

    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    room = await rooms_service.create_room(
        db_session,
        hotel,
        host,
        RoomTypeCreateIn(
            title="Coastline view duplex",
            max_guests=2,
            inventory_count=2,
            prices=[Money(amount=Decimal("55000"), currency=Currency.XAF)],
        ),
    )

    body = WaitlistEntryIn.model_validate(
        {
            "email": "roomfan@example.com",
            "property_id": str(hotel.id),
            "room_type_id": str(room.id),
            "travel_start": (_dt.date.today() + _dt.timedelta(days=3)).isoformat(),
            "travel_end": (_dt.date.today() + _dt.timedelta(days=6)).isoformat(),
            "adults": 2,
        }
    )
    _entry, _ = await waitlist_service.create_entry(db_session, body)

    row = (
        await db_session.execute(
            select(WaitlistEntry).where(WaitlistEntry.email == "roomfan@example.com")
        )
    ).scalar_one()
    assert row.room_type_id == room.id
    assert row.property_id == hotel.id


@pytest.mark.asyncio
async def test_waitlist_resubmit_refreshes_room_type_intent(db_session) -> None:
    from decimal import Decimal

    from app.core.money import Currency, Money
    from app.modules.properties import rooms_service
    from app.modules.properties.schemas import RoomTypeCreateIn
    from tests.integration.test_rooms_service import _make_host, _make_hotel

    host = await _make_host(db_session)
    hotel = await _make_hotel(db_session, host)
    first_room = await rooms_service.create_room(
        db_session,
        hotel,
        host,
        RoomTypeCreateIn(
            title="Garden studio",
            max_guests=2,
            inventory_count=2,
            prices=[Money(amount=Decimal("45000"), currency=Currency.XAF)],
        ),
    )
    second_room = await rooms_service.create_room(
        db_session,
        hotel,
        host,
        RoomTypeCreateIn(
            title="Sea-view suite",
            max_guests=4,
            inventory_count=1,
            prices=[Money(amount=Decimal("90000"), currency=Currency.XAF)],
        ),
    )

    await waitlist_service.create_entry(
        db_session,
        WaitlistEntryIn.model_validate(
            {
                "email": "repeat-roomfan@example.com",
                "property_id": str(hotel.id),
                "room_type_id": str(first_room.id),
                "travel_start": (_dt.date.today() + _dt.timedelta(days=3)).isoformat(),
                "travel_end": (_dt.date.today() + _dt.timedelta(days=6)).isoformat(),
                "adults": 2,
            }
        ),
    )

    _entry, confirmation_sent = await waitlist_service.create_entry(
        db_session,
        WaitlistEntryIn.model_validate(
            {
                "email": "repeat-roomfan@example.com",
                "name": "Updated Guest",
                "phone": "+237612345678",
                "property_id": str(hotel.id),
                "room_type_id": str(second_room.id),
                "travel_start": (_dt.date.today() + _dt.timedelta(days=10)).isoformat(),
                "travel_end": (_dt.date.today() + _dt.timedelta(days=14)).isoformat(),
                "adults": 4,
            }
        ),
    )

    row = (
        await db_session.execute(
            select(WaitlistEntry).where(WaitlistEntry.email == "repeat-roomfan@example.com")
        )
    ).scalar_one()
    assert confirmation_sent is False
    assert row.name == "Updated Guest"
    assert row.phone == "+237612345678"
    assert row.room_type_id == second_room.id
    assert row.travel_start == _dt.date.today() + _dt.timedelta(days=10)
    assert row.travel_end == _dt.date.today() + _dt.timedelta(days=14)
    assert row.adults == 4
