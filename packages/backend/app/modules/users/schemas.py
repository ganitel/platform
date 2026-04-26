"""Pydantic schemas for the users module — the wire shapes for the
`/me` endpoint and the public profile fragment shown elsewhere
(reviews, property cards, …). DB persistence lives in `models.py`."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserPublic(BaseModel):
    """Lightweight user profile shown in listings, reviews, etc."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str
    avatar_url: str | None
    is_host: bool


class UserMe(BaseModel):
    """Full self-profile returned by /me."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str | None
    email: EmailStr | None
    display_name: str
    avatar_url: str | None
    language: Literal["fr", "en"]
    is_host: bool
    is_admin: bool
    status: str
    created_at: datetime


class UpdateMe(BaseModel):
    """Partial update of the current user.

    Convention: omitted fields are unchanged. Explicit `null` clears
    nullable fields (only `avatar_url` today). The route handler should
    use `model_dump(exclude_unset=True)` to distinguish "unset" from `null`.
    """

    model_config = ConfigDict(extra="forbid")

    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    language: Literal["fr", "en"] | None = None
    avatar_url: str | None = Field(default=None, max_length=2048)
