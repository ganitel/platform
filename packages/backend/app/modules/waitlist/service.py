from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.waitlist import emails
from app.modules.waitlist.models import WaitlistEntry
from app.modules.waitlist.schemas import WaitlistEntryIn


async def create_entry(session: AsyncSession, body: WaitlistEntryIn) -> tuple[WaitlistEntry, bool]:
    """Insert a new waitlist entry, merging exact duplicates
    (same email + same role + same property/experience pair).

    Returns (entry, confirmation_sent). The caller surfaces
    confirmation_sent to the frontend so the success UI can tell the
    truth instead of pretending an email went out when it didn't.
    Duplicates skip the resend — visitor already got an email last time."""
    existing = await _find_existing(session, body)
    if existing:
        if _merge_duplicate(existing, body):
            await session.commit()
            await session.refresh(existing)
        return existing, False

    entry = WaitlistEntry(
        email=body.email,
        name=body.name,
        phone=body.phone,
        property_id=body.property_id,
        experience_id=body.experience_id,
        interest=body.interest,
        headcount=body.headcount,
        budget_range=body.budget_range,
        budget_currency=body.budget_currency,
        role=body.role,
        host_city=body.host_city,
        host_inventory=body.host_inventory,
        host_status=body.host_status,
        notes=body.notes,
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)

    confirmation_sent = await emails.send_confirmation(entry)
    return entry, confirmation_sent


def _merge_duplicate(entry: WaitlistEntry, body: WaitlistEntryIn) -> bool:
    """Apply newly submitted lead details without clearing omitted fields."""
    changed = False
    for field in (
        "name",
        "phone",
        "interest",
        "headcount",
        "budget_range",
        "budget_currency",
        "host_city",
        "host_inventory",
        "host_status",
        "notes",
    ):
        value = getattr(body, field)
        if value is not None and getattr(entry, field) != value:
            setattr(entry, field, value)
            changed = True
    return changed


async def _find_existing(session: AsyncSession, body: WaitlistEntryIn) -> WaitlistEntry | None:
    stmt = select(WaitlistEntry).where(
        WaitlistEntry.email == body.email,
        WaitlistEntry.role == body.role,
        WaitlistEntry.property_id == body.property_id,
        WaitlistEntry.experience_id == body.experience_id,
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
