"""Pydantic schemas for media uploads. Inputs are restricted to a
closed set of image and video mime types."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

ImageMimeType = Literal[
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
]

VideoMimeType = Literal[
    "video/mp4",
    "video/webm",
]

MediaMimeType = ImageMimeType | VideoMimeType
MediaKind = Literal["image", "video"]

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_BYTES = 200 * 1024 * 1024
MAX_VIDEO_DURATION_MS = 60_000


class MediaUploadIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mime_type: MediaMimeType
    kind: MediaKind
    size_bytes: int | None = Field(default=None, ge=1)
    draft_id: UUID | None = None
    poster_media_id: UUID | None = None
    duration_ms: int | None = Field(default=None, ge=1, le=MAX_VIDEO_DURATION_MS)

    @model_validator(mode="after")
    def _validate_kind_consistency(self) -> "MediaUploadIn":
        if self.kind == "image":
            if not self.mime_type.startswith("image/"):
                raise ValueError("mime_type must be image/* when kind == image")
            if self.size_bytes is not None and self.size_bytes > MAX_IMAGE_BYTES:
                raise ValueError(
                    f"image upload exceeds {MAX_IMAGE_BYTES} bytes ({self.size_bytes})"
                )
            if self.duration_ms is not None:
                raise ValueError("duration_ms is not allowed for images")
            if self.poster_media_id is not None:
                raise ValueError("poster_media_id is not allowed for images")
        else:
            if not self.mime_type.startswith("video/"):
                raise ValueError("mime_type must be video/* when kind == video")
            if self.size_bytes is not None and self.size_bytes > MAX_VIDEO_BYTES:
                raise ValueError(
                    f"video upload exceeds {MAX_VIDEO_BYTES} bytes ({self.size_bytes})"
                )
            if self.duration_ms is None:
                raise ValueError("duration_ms is required for videos")
        return self


class MediaUploadOut(BaseModel):
    media_id: UUID
    upload_url: str
    expires_in: int = Field(..., description="Seconds until the upload URL expires")


class MediaPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    mime_type: MediaMimeType
    kind: MediaKind
    poster_url: str | None = None
    duration_ms: int | None = None
    created_at: datetime


class MediaItemPublic(MediaPublic):
    """Listing-media element. Wraps MediaPublic with the join-row id so the
    frontend can target this exact attachment for detach or reorder."""

    media_item_id: UUID
