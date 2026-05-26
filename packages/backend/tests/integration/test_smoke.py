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
