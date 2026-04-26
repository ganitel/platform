"""Pydantic schemas for media uploads. Inputs are restricted to a
closed set of image mime types — extend `ImageMimeType` when video or
other media is supported."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# Photo uploads only for now. Add video mime types here when listings support video.
ImageMimeType = Literal[
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
]

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB


class MediaUploadIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mime_type: ImageMimeType
    size_bytes: int | None = Field(default=None, ge=1, le=MAX_UPLOAD_BYTES)


class MediaUploadOut(BaseModel):
    media_id: UUID
    upload_url: str
    expires_in: int = Field(..., description="Seconds until the upload URL expires")


class MediaPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    mime_type: ImageMimeType
    created_at: datetime
