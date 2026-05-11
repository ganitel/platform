from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

TeamRole = Literal["cofounder", "tour_guide"]

# Tour-guide titles are constrained — the admin review form picks from this
# list, the public submission form locks it via the backend default. Pair
# stays (fr_label, en_label) so admins see both languages at once and
# changes always update both sides.
TitlePair = Literal["guide_touristique"]
TITLE_OPTIONS: dict[str, tuple[str, str]] = {
    "guide_touristique": ("Guide touristique", "Tour guide"),
}


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
    city: str | None = Field(default=None, min_length=1, max_length=120)
    country: str | None = Field(default=None, min_length=1, max_length=120)
    age: int | None = Field(default=None, ge=16, le=100)
    title_key: TitlePair | None = None


class SubmissionResult(BaseModel):
    """Tells the submitter what actually happened. The row was always created
    on the backend (else this response wouldn't exist), but admin notification
    may have failed entirely or partially. The frontend uses these counts to
    decide whether to show a plain success or a "submitted but pending manual
    follow-up" warning."""

    team_member_id: UUID
    admins_attempted: int
    admins_notified: int

    @property
    def all_notified(self) -> bool:
        return self.admins_attempted > 0 and self.admins_notified == self.admins_attempted


class AdminEmailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    name: str | None = None
