from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class WaitlistEntryIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    name: str | None = Field(default=None, max_length=120)
    property_id: UUID | None = None
    experience_id: UUID | None = None


class WaitlistEntryOut(BaseModel):
    id: UUID
    email: str
