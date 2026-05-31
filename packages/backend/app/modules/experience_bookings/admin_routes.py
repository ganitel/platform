"""Host-facing routes for experience bookings, under /admin namespace
matching the existing experiences/properties admin pattern."""

from uuid import UUID

from fastapi import APIRouter, Header

from app.core.deps import CurrentUser, DbSession
from app.modules.experience_bookings import service
from app.modules.experience_bookings.routes import _to_public
from app.modules.experience_bookings.schemas import (
    ExperienceBookingHostConfirmIn,
    ExperienceBookingPublic,
)

router = APIRouter(prefix="/admin/experience-bookings", tags=["experience-bookings", "admin"])


@router.get("/pending", response_model=list[ExperienceBookingPublic])
async def list_pending(
    user: CurrentUser, session: DbSession, limit: int = 50, offset: int = 0
) -> list[ExperienceBookingPublic]:
    rows = await service.list_pending_for_host(session, host=user, limit=limit, offset=offset)
    return [await _to_public(session, r) for r in rows]


@router.post("/{booking_id}/confirm", response_model=ExperienceBookingPublic)
async def confirm(
    booking_id: UUID,
    payload: ExperienceBookingHostConfirmIn,
    user: CurrentUser,
    session: DbSession,
    idempotency_key: str = Header(default="", alias="Idempotency-Key"),
    provider: str = "noop",
) -> ExperienceBookingPublic:
    booking = await service.confirm_as_host(
        session,
        booking_id=booking_id,
        host=user,
        provider_name=provider,
        idempotency_key=idempotency_key or f"confirm-{booking_id}",
        start_time=payload.start_time,
    )
    return await _to_public(session, booking)


@router.post("/{booking_id}/decline", response_model=ExperienceBookingPublic)
async def decline(
    booking_id: UUID, user: CurrentUser, session: DbSession
) -> ExperienceBookingPublic:
    booking = await service.decline_as_host(session, booking_id=booking_id, host=user)
    return await _to_public(session, booking)


@router.post("/{booking_id}/cancel", response_model=ExperienceBookingPublic)
async def cancel(
    booking_id: UUID, user: CurrentUser, session: DbSession
) -> ExperienceBookingPublic:
    booking = await service.cancel_as_host(session, booking_id=booking_id, host=user)
    return await _to_public(session, booking)
