from uuid import uuid4

import pytest

from app.modules.waitlist import service
from app.modules.waitlist.models import WaitlistEntry
from app.modules.waitlist.schemas import WaitlistEntryIn


class _Result:
    def __init__(self, entry: WaitlistEntry | None) -> None:
        self.entry = entry

    def scalar_one_or_none(self) -> WaitlistEntry | None:
        return self.entry


class _Session:
    def __init__(self, entry: WaitlistEntry | None) -> None:
        self.entry = entry
        self.commits = 0
        self.refreshes = 0
        self.added: list[WaitlistEntry] = []

    async def execute(self, _stmt: object) -> _Result:
        return _Result(self.entry)

    def add(self, entry: WaitlistEntry) -> None:
        self.added.append(entry)

    async def commit(self) -> None:
        self.commits += 1

    async def refresh(self, _entry: WaitlistEntry) -> None:
        self.refreshes += 1


@pytest.mark.unit
async def test_waitlist_duplicate_merges_new_details_without_resending(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    existing = WaitlistEntry(
        id=uuid4(),
        email="lead@example.com",
        role="traveler",
        interest="renting",
        phone="+237611111111",
        notes="Initial note",
        headcount=2,
        budget_range="under_50k",
        budget_currency="xaf",
    )
    session = _Session(existing)

    async def fail_send(_entry: WaitlistEntry) -> bool:
        raise AssertionError("duplicates must not send another confirmation")

    monkeypatch.setattr(service.emails, "send_confirmation", fail_send)

    body = WaitlistEntryIn.model_validate(
        {
            "email": "lead@example.com",
            "role": "traveler",
            "interest": "both",
            "phone": "+237622222222",
            "headcount": 4,
            "budget_range": "150k_300k",
            "budget_currency": "eur",
        }
    )

    entry, confirmation_sent = await service.create_entry(session, body)  # type: ignore[arg-type]

    assert entry is existing
    assert confirmation_sent is False
    assert existing.interest == "both"
    assert existing.phone == "+237622222222"
    assert existing.notes == "Initial note"
    assert existing.headcount == 4
    assert existing.budget_range == "150k_300k"
    assert existing.budget_currency == "eur"
    assert session.commits == 1
    assert session.refreshes == 1
    assert session.added == []


@pytest.mark.unit
async def test_waitlist_duplicate_without_new_details_skips_write() -> None:
    existing = WaitlistEntry(
        id=uuid4(),
        email="lead@example.com",
        role=None,
        phone="+237611111111",
    )
    session = _Session(existing)
    body = WaitlistEntryIn.model_validate({"email": "lead@example.com"})

    entry, confirmation_sent = await service.create_entry(session, body)  # type: ignore[arg-type]

    assert entry is existing
    assert confirmation_sent is False
    assert existing.phone == "+237611111111"
    assert session.commits == 0
    assert session.refreshes == 0

