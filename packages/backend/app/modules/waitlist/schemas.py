import re
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
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

    @model_validator(mode="after")
    def _require_host_fields(self) -> "WaitlistEntryIn":
        if self.role == "host":
            missing = [
                f
                for f in ("host_city", "host_inventory", "host_status")
                if getattr(self, f) in (None, "")
            ]
            if missing:
                raise ValueError(f"Missing host fields: {', '.join(missing)}")
        return self


class WaitlistEntryOut(BaseModel):
    id: UUID
    email: str
    # True if Resend accepted the confirmation send. False on duplicate
    # signup (we don't re-send) or on any Resend / config failure. Frontend
    # can branch its success copy on this.
    confirmation_email_sent: bool = False
