from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

TeamRole = Literal["cofounder", "tour_guide"]


class TeamMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    role: TeamRole
    title_fr: str
    title_en: str
    bio_fr: str | None = None
    bio_en: str | None = None
    avatar_url: str | None = None
    city: str | None = None
    country: str | None = None
    age: int | None = None


class TeamMemberUpdate(BaseModel):
    """Patch payload from the admin review form. Every field is optional —
    admins may approve as-is or tweak any subset before approving."""

    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=120)
    bio_fr: str | None = Field(default=None, max_length=2000)
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    age: int | None = Field(default=None, ge=16, le=100)
    title_fr: str | None = Field(default=None, min_length=1, max_length=120)
    title_en: str | None = Field(default=None, min_length=1, max_length=120)


class ReviewLink(BaseModel):
    """Returned to the submitter for visibility, and used internally for tests."""

    team_member_id: UUID
    admins_notified: int


class AdminEmailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    name: str | None = None
