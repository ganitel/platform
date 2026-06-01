"""Guest-facing routes for experience bookings."""

from typing import Annotated, cast
from uuid import UUID

from fastapi import APIRouter, Header, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, DbSession
from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.core.idempotency import replay_or_run
from app.modules.bookings.schemas import InitiatePaymentOut, PaymentProvider
from app.modules.experience_bookings import service
from app.modules.experience_bookings.models import ExperienceBooking, ExperienceBookingStatus
from app.modules.experience_bookings.schemas import (
    ExperienceBookingCreateIn,
    ExperienceBookingPublic,
)
from app.modules.experiences.models import Experience
from app.modules.payments.models import Payment

router = APIRouter(prefix="/experience-bookings", tags=["experience-bookings"])


async def _to_public(session: AsyncSession, booking: ExperienceBooking) -> ExperienceBookingPublic:
    exp = await session.get(Experience, booking.experience_id)
    title = exp.title if exp is not None else ""
    return service.to_public(booking, experience_title=title)


@router.post("", response_model=ExperienceBookingPublic, status_code=status.HTTP_201_CREATED)
async def create_request(
    payload: ExperienceBookingCreateIn,
    user: CurrentUser,
    session: DbSession,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> ExperienceBookingPublic:
    async def _do():
        booking = await service.create_request(session, guest=user, payload=payload)
        return await _to_public(session, booking)

    return await replay_or_run(session, user_id=user.id, key=idempotency_key, fn=_do)


@router.get("/me", response_model=list[ExperienceBookingPublic])
async def list_mine(
    user: CurrentUser, session: DbSession, limit: int = 50, offset: int = 0
) -> list[ExperienceBookingPublic]:
    rows = await service.list_for_guest(session, guest=user, limit=limit, offset=offset)
    return [await _to_public(session, r) for r in rows]


@router.get("/{booking_id}", response_model=ExperienceBookingPublic)
async def get_one(
    booking_id: UUID, user: CurrentUser, session: DbSession
) -> ExperienceBookingPublic:
    booking = await service.get(session, booking_id, viewer=user)
    return await _to_public(session, booking)


@router.post("/{booking_id}/cancel", response_model=ExperienceBookingPublic)
async def cancel(
    booking_id: UUID, user: CurrentUser, session: DbSession
) -> ExperienceBookingPublic:
    booking = await service.cancel_as_guest(session, booking_id=booking_id, guest=user)
    return await _to_public(session, booking)


@router.post("/{booking_id}/pay", response_model=InitiatePaymentOut)
async def get_payment_intent(
    booking_id: UUID, user: CurrentUser, session: DbSession
) -> InitiatePaymentOut:
    booking = await service.get(session, booking_id, viewer=user)
    if booking.guest_id != user.id and not user.is_admin:
        raise ForbiddenError(code="experience_booking.not_guest")
    if booking.status != ExperienceBookingStatus.PENDING_PAYMENT:
        raise ConflictError(
            code="experience_booking.not_payable",
            extra={"current_status": booking.status.value},
        )
    if booking.payment_id is None:
        raise NotFoundError(code="experience_booking.payment_missing")

    payment = await session.get(Payment, booking.payment_id)
    if payment is None or payment.provider_intent_id is None:
        raise NotFoundError(code="experience_booking.payment_missing")

    client_action = (payment.raw_init_response or {}).get("client_action") or {}
    return InitiatePaymentOut(
        payment_id=payment.id,
        provider=cast(PaymentProvider, payment.provider),
        provider_intent_id=payment.provider_intent_id,
        client_action=client_action,
    )
