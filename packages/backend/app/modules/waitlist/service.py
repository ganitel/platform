from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.waitlist import emails
from app.modules.waitlist.models import WaitlistEntry
from app.modules.waitlist.schemas import WaitlistEntryIn


async def create_entry(session: AsyncSession, body: WaitlistEntryIn) -> tuple[WaitlistEntry, bool]:
    """Insert a new waitlist entry, silently ignoring exact duplicates
    (same email + same role + same property/experience pair).

    Returns (entry, confirmation_sent). The caller surfaces
    confirmation_sent to the frontend so the success UI can tell the
    truth instead of pretending an email went out when it didn't.
    Duplicates refresh the stored intent but skip the resend — visitor
    already got an email last time."""
    existing = await _find_existing(session, body)
    if existing:
        return await _refresh_existing(session, existing, body), False

    entry = WaitlistEntry(
        email=body.email,
        name=body.name,
        phone=body.phone,
        property_id=body.property_id,
        experience_id=body.experience_id,
        room_type_id=body.room_type_id,
        interest=body.interest,
        headcount=body.headcount,
        budget_range=body.budget_range,
        budget_currency=body.budget_currency,
        role=body.role,
        host_city=body.host_city,
        host_inventory=body.host_inventory,
        host_status=body.host_status,
        notes=body.notes,
        travel_start=body.travel_start,
        travel_end=body.travel_end,
        adults=body.adults,
        children=body.children,
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)

    confirmation_sent = await emails.send_confirmation(entry)
    return entry, confirmation_sent


_MUTABLE_FIELDS = (
    "name",
    "phone",
    "room_type_id",
    "interest",
    "headcount",
    "budget_range",
    "budget_currency",
    "host_city",
    "host_inventory",
    "host_status",
    "notes",
    "travel_start",
    "travel_end",
    "adults",
    "children",
)


async def _refresh_existing(
    session: AsyncSession, entry: WaitlistEntry, body: WaitlistEntryIn
) -> WaitlistEntry:
    changed = False
    for field in _MUTABLE_FIELDS:
        if field not in body.model_fields_set:
            continue
        value = getattr(body, field)
        if getattr(entry, field) == value:
            continue
        setattr(entry, field, value)
        changed = True

    if changed:
        await session.commit()
        await session.refresh(entry)
    return entry


async def _find_existing(session: AsyncSession, body: WaitlistEntryIn) -> WaitlistEntry | None:
    stmt = select(WaitlistEntry).where(
        WaitlistEntry.email == body.email,
        WaitlistEntry.role == body.role,
        WaitlistEntry.property_id == body.property_id,
        WaitlistEntry.experience_id == body.experience_id,
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
