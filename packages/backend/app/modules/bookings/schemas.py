"""Pydantic schemas for bookings: create, public read, payment
initiation, and cancellation. Date ordering is enforced at the
schema layer so the API responds with a 422 instead of a 500 when
check-out is before check-in."""

from datetime import date, datetime
from typing import Any, Literal, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.money import Currency, Money
from app.modules.bookings.models import BookingStatus

PaymentProvider = Literal["tranzak", "stripe", "noop"]


class BookingCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    property_id: UUID
    check_in_date: date
    check_out_date: date
    guest_count: int = Field(..., ge=1, le=64)
    currency: Currency

    @model_validator(mode="after")
    def _dates_ordered(self) -> Self:
        if self.check_out_date <= self.check_in_date:
            raise ValueError("check_out_date must be after check_in_date")
        return self


class BookingPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    property_id: UUID
    guest_id: UUID
    check_in_date: date
    check_out_date: date
    nights: int
    guest_count: int
    subtotal: Money
    total: Money
    status: BookingStatus
    hold_expires_at: datetime | None
    confirmed_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime


class InitiatePaymentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    provider: PaymentProvider


class InitiatePaymentOut(BaseModel):
    payment_id: UUID
    provider: PaymentProvider
    provider_intent_id: str
    client_action: dict[str, Any] = Field(
        ...,
        description=(
            "Provider-specific payload the frontend forwards to the SDK "
            "(e.g. Stripe client_secret, Tranzak redirect URL). Contract "
            "varies by provider; treat as opaque per-provider."
        ),
    )


class CancelIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str | None = Field(default=None, min_length=3, max_length=500)
