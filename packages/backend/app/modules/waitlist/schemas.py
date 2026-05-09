from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

BudgetRange = Literal["under_50k", "50k_150k", "150k_300k", "300k_500k", "over_500k"]
Interest = Literal["renting", "experiences", "both"]


class WaitlistEntryIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    property_id: UUID | None = None
    experience_id: UUID | None = None
    interest: Interest | None = None
    headcount: int | None = Field(default=None, ge=1, le=500)
    budget_range: BudgetRange | None = None
    notes: str | None = Field(default=None, max_length=1000)


class WaitlistEntryOut(BaseModel):
    id: UUID
    email: str
