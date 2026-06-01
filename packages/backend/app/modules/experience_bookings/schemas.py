"""Public IO shapes for experience bookings.

Used by both guest-facing and admin-facing routes. `subtotal` / `total`
collapse the (amount, currency) pair into a Money shape to keep parity
with the bookings module.
"""

from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.money import Currency, Money
from app.modules.experience_bookings.models import ExperienceBookingStatus


class ExperienceBookingCreateIn(BaseModel):
    experience_id: UUID
    requested_date: date
    party_size: int = Field(ge=1)
    currency: Currency
    start_time: time | None = None


class ExperienceBookingHostConfirmIn(BaseModel):
    start_time: time | None = None


class ExperienceBookingPublic(BaseModel):
    id: UUID
    experience_id: UUID
    experience_title: str
    guest_id: UUID
    host_id: UUID
    requested_date: date
    start_time: time | None
    party_size: int
    subtotal: Money
    total: Money
    status: ExperienceBookingStatus
    confirm_deadline_at: datetime | None
    hold_expires_at: datetime | None
    host_confirmed_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime


class SuggestedExperience(BaseModel):
    """One item returned by GET /bookings/{stay_id}/suggested-experiences."""

    experience_id: UUID
    title: str
    city: str
    country_code: str
    duration_minutes: int
    capacity: int
    price: Money | None


class SuggestedStay(BaseModel):
    """One item returned by GET /experiences/{experience_id}/suggested-stays."""

    property_id: UUID
    title: str
    city: str
    country_code: str
    kind: str
    price_from: Money | None
