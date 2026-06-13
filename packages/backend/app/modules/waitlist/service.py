from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.waitlist import emails
from app.modules.waitlist.models import WaitlistEntry
from app.modules.waitlist.schemas import WaitlistEntryIn


async def create_entry(session: AsyncSession, body: WaitlistEntryIn) -> tuple[WaitlistEntry, bool]:
    """Insert a new waitlist entry, refreshing intent on duplicates
    (same email + same role + same property/experience pair).

    Returns (entry, confirmation_sent). The caller surfaces
    confirmation_sent to the frontend so the success UI can tell the
    truth instead of pretending an email went out when it didn't.
    Duplicates skip the resend — visitor already got an email last time."""
    existing = await _find_existing(session, body)
    if existing:
        _refresh_existing(existing, body)
        await session.commit()
        await session.refresh(existing)
        return existing, False

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


def _refresh_existing(entry: WaitlistEntry, body: WaitlistEntryIn) -> None:
    """Copy latest submitted details without erasing previously collected data.

    Duplicate submissions are common when a visitor changes room/date intent.
    Optional fields that are omitted from the new form are preserved.
    """
    for field in (
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
    ):
        value = getattr(body, field)
        if value is not None:
            setattr(entry, field, value)


async def _find_existing(session: AsyncSession, body: WaitlistEntryIn) -> WaitlistEntry | None:
    stmt = select(WaitlistEntry).where(
        WaitlistEntry.email == body.email,
        WaitlistEntry.role == body.role,
        WaitlistEntry.property_id == body.property_id,
        WaitlistEntry.experience_id == body.experience_id,
    ).order_by(WaitlistEntry.created_at.desc(), WaitlistEntry.id.desc())
    result = await session.execute(stmt)
    return result.scalars().first()
