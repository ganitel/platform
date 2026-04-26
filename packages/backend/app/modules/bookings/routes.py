"""HTTP endpoints for bookings: create, list-mine, get, cancel
(as guest or host), and initiate payment. All routes require an
authenticated user."""

from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Header, status

from app.core.deps import CurrentUser, DbSession
from app.core.idempotency import replay_or_run
from app.modules.bookings import service
from app.modules.bookings.schemas import (
    BookingCreateIn,
    BookingPublic,
    CancelIn,
    InitiatePaymentIn,
    InitiatePaymentOut,
)
from app.modules.payments import service as payment_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingPublic, status_code=status.HTTP_201_CREATED)
async def create_booking(
    body: BookingCreateIn,
    user: CurrentUser,
    session: DbSession,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> BookingPublic:
    async def _do():
        booking = await service.create_booking(session, user, body)
        return service.to_public(booking)

    return await replay_or_run(session, user_id=user.id, key=idempotency_key, fn=_do)


@router.get("/me", response_model=list[BookingPublic])
async def list_my_bookings(
    user: CurrentUser, session: DbSession, limit: int = 50, offset: int = 0
) -> list[BookingPublic]:
    rows = await service.list_for_guest(session, user, limit=limit, offset=offset)
    return [service.to_public(b) for b in rows]


@router.get("/{booking_id}", response_model=BookingPublic)
async def get_booking(booking_id: UUID, user: CurrentUser, session: DbSession) -> BookingPublic:
    booking = await service.get_booking(session, booking_id, viewer=user)
    return service.to_public(booking)


@router.post("/{booking_id}/cancel", response_model=BookingPublic)
async def cancel_booking(
    booking_id: UUID, _: CancelIn, user: CurrentUser, session: DbSession
) -> BookingPublic:
    booking = await service.get_booking(session, booking_id, viewer=user)
    cancelled = await service.cancel_as_guest(session, booking, user)
    return service.to_public(cancelled)


@router.post("/{booking_id}/cancel-as-host", response_model=BookingPublic)
async def cancel_as_host(
    booking_id: UUID, _: CancelIn, user: CurrentUser, session: DbSession
) -> BookingPublic:
    booking = await service.get_booking(session, booking_id, viewer=user)
    cancelled = await service.cancel_as_host(session, booking, user)
    return service.to_public(cancelled)


@router.post("/{booking_id}/initiate-payment", response_model=InitiatePaymentOut)
async def initiate_payment(
    booking_id: UUID,
    body: InitiatePaymentIn,
    user: CurrentUser,
    session: DbSession,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> InitiatePaymentOut:
    booking = await service.get_booking(session, booking_id, viewer=user)

    async def _do():
        result = await payment_service.initiate_payment(
            session,
            booking=booking,
            provider_name=body.provider,
            idempotency_key=idempotency_key or uuid4().hex,
        )
        return result

    return await replay_or_run(session, user_id=user.id, key=idempotency_key, fn=_do)
