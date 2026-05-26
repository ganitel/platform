import re
from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    ValidationInfo,
    field_validator,
    model_validator,
)
from pydantic_core import PydanticCustomError

BudgetRange = Literal["under_50k", "50k_150k", "150k_300k", "300k_500k", "over_500k"]
BudgetCurrency = Literal["xaf", "eur", "usd"]
Interest = Literal["renting", "experiences", "both"]
Role = Literal["traveler", "host"]
HostInventory = Literal["1", "2_5", "6_10", "10_plus"]
HostStatus = Literal["ready", "under_construction", "planning", "just_exploring"]

_PHONE_FORMATTING_RE = re.compile(r"[\s\-().]")
_PHONE_E164_RE = re.compile(r"^\+[1-9]\d{6,14}$")


class WaitlistEntryIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=32)

    @field_validator("phone", mode="before")
    @classmethod
    def _normalize_phone(cls, value: object) -> object:
        if value is None:
            return None
        if not isinstance(value, str):
            return value
        cleaned = _PHONE_FORMATTING_RE.sub("", value)
        if not cleaned:
            return None
        if not _PHONE_E164_RE.match(cleaned):
            raise PydanticCustomError("phone_invalid", "phone must be E.164 (e.g. +237612345678)")
        return cleaned

    property_id: UUID | None = None
    experience_id: UUID | None = None
    interest: Interest | None = None
    headcount: int | None = Field(default=None, ge=1, le=500)
    budget_range: BudgetRange | None = None
    budget_currency: BudgetCurrency | None = None
    role: Role | None = None
    host_city: str | None = Field(default=None, max_length=120)
    host_inventory: HostInventory | None = None
    host_status: HostStatus | None = None
    notes: str | None = Field(default=None, max_length=1000)
    travel_start: date | None = None
    travel_end: date | None = None
    adults: int | None = Field(default=None, ge=1, le=16)
    children: int | None = Field(default=None, ge=0, le=16)

    @field_validator("travel_start")
    @classmethod
    def _travel_start_not_past(cls, value: date | None) -> date | None:
        if value is not None and value < date.today():
            raise PydanticCustomError("travel_start_invalid", "travel_start must be today or later")
        return value

    @field_validator("travel_end")
    @classmethod
    def _travel_end_after_start(cls, value: date | None, info: ValidationInfo) -> date | None:
        start = info.data.get("travel_start")
        if value is not None and start is not None and value < start:
            raise PydanticCustomError(
                "travel_end_invalid", "travel_end must be on or after travel_start"
            )
        return value

    @model_validator(mode="after")
    def _require_role_fields(self) -> "WaitlistEntryIn":
        if self.role == "host":
            missing = [
                f
                for f in ("host_city", "host_inventory", "host_status")
                if getattr(self, f) in (None, "")
            ]
            if missing:
                raise ValueError(f"Missing host fields: {', '.join(missing)}")
        if self.role == "traveler":
            missing = [
                f for f in ("travel_start", "travel_end", "adults") if getattr(self, f) is None
            ]
            if missing:
                raise ValueError(f"Missing traveler fields: {', '.join(missing)}")
        return self


class WaitlistEntryOut(BaseModel):
    id: UUID
    email: str
    # True if Resend accepted the confirmation send. False on duplicate
    # signup (we don't re-send) or on any Resend / config failure. Frontend
    # can branch its success copy on this.
    confirmation_email_sent: bool = False
