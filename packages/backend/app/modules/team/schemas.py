from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

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
