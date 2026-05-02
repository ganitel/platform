from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.waitlist.models import WaitlistEntry
from app.modules.waitlist.schemas import WaitlistEntryIn


async def create_entry(session: AsyncSession, body: WaitlistEntryIn) -> WaitlistEntry:
    """Insert a new waitlist entry, silently ignoring exact duplicates
    (same email + same property/experience pair)."""
    existing = await _find_existing(session, body)
    if existing:
        return existing

    entry = WaitlistEntry(
        email=body.email,
        name=body.name,
        property_id=body.property_id,
        experience_id=body.experience_id,
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


async def _find_existing(
    session: AsyncSession, body: WaitlistEntryIn
) -> WaitlistEntry | None:
    stmt = select(WaitlistEntry).where(
        WaitlistEntry.email == body.email,
        WaitlistEntry.property_id == body.property_id,
        WaitlistEntry.experience_id == body.experience_id,
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
