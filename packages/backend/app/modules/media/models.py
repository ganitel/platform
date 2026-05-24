"""SQLAlchemy ORM model for the `media` table. Stores object metadata
(bucket, key, kind, mime, size, owner, optional poster + duration).
The actual bytes live in object storage; we only keep the pointer
and access policy here."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class MediaKind(StrEnum):
    IMAGE = "image"
    VIDEO = "video"


class Media(Base):
    __tablename__ = "media"

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    bucket: Mapped[str] = mapped_column(String(120), nullable=False)
    key: Mapped[str] = mapped_column(String(512), nullable=False)
    kind: Mapped[MediaKind] = mapped_column(
        Enum(MediaKind, name="media_kind", native_enum=True),
        nullable=False,
        default=MediaKind.IMAGE,
    )
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int | None] = mapped_column(BigInteger())
    duration_ms: Mapped[int | None] = mapped_column(BigInteger())
    draft_id: Mapped[UUID | None] = mapped_column(Uuid(), index=True)
    poster_media_id: Mapped[UUID | None] = mapped_column(
        Uuid(), ForeignKey("media.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
