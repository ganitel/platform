from fastapi import APIRouter, status

from app.core.deps import DbSession
from app.modules.waitlist import service
from app.modules.waitlist.schemas import WaitlistEntryIn, WaitlistEntryOut

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


@router.post("", response_model=WaitlistEntryOut, status_code=status.HTTP_201_CREATED)
async def join_waitlist(body: WaitlistEntryIn, session: DbSession) -> WaitlistEntryOut:
    entry, confirmation_sent = await service.create_entry(session, body)
    return WaitlistEntryOut(
        id=entry.id,
        email=entry.email,
        confirmation_email_sent=confirmation_sent,
    )
