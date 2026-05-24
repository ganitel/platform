"""SQLAlchemy ORM models for experiences: the listing itself, its media
join table (`ExperienceMediaItem`), price table (`ExperiencePrice`), and
enums (`ExperienceStatus`, `ExperienceCancellationPolicy`).

Experiences are time-bounded activities (tours, workshops, sound baths,
boat trips, …). Distinct from `Property` — different shape (no
bedrooms/amenities, has duration_minutes), different lifecycle.
"""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from geoalchemy2 import Geography
from sqlalchemy import (
    CheckConstraint,
    Computed,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.modules.media.models import Media


class ExperienceStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    UNLISTED = "unlisted"
    REMOVED = "removed"


class ExperienceCancellationPolicy(StrEnum):
    FLEXIBLE = "flexible"
    MODERATE = "moderate"
    STRICT = "strict"


class Experience(Base):
    __tablename__ = "experiences"
    __table_args__ = (
        CheckConstraint("capacity >= 1", name="ck_experiences_capacity_positive"),
        CheckConstraint("duration_minutes >= 1", name="ck_experiences_duration_positive"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    host_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text(), nullable=False, server_default="")
    experience_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)

    address: Mapped[str | None] = mapped_column(String(300))
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    location: Mapped[Any] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False
    )

    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    cancellation_policy: Mapped[ExperienceCancellationPolicy] = mapped_column(
        Enum(
            ExperienceCancellationPolicy,
            name="experience_cancellation_policy",
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
        default=ExperienceCancellationPolicy.MODERATE,
    )

    content_language: Mapped[str] = mapped_column(String(2), nullable=False, default="fr")
    status: Mapped[ExperienceStatus] = mapped_column(
        Enum(
            ExperienceStatus,
            name="experience_status",
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
        default=ExperienceStatus.DRAFT,
        index=True,
    )

    search_tsv: Mapped[Any] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,''))",
            persisted=True,
        ),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    media: Mapped[list["ExperienceMediaItem"]] = relationship(
        back_populates="experience",
        cascade="all, delete-orphan",
        order_by="ExperienceMediaItem.position",
    )
    prices: Mapped[list["ExperiencePrice"]] = relationship(
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ExperiencePrice(Base):
    __tablename__ = "experience_prices"

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    experience_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("experiences.id", ondelete="CASCADE"), nullable=False, index=True
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "experience_id", "currency", name="uq_experience_prices_experience_currency"
        ),
    )


class ExperienceMediaItem(Base):
    __tablename__ = "experience_media"

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    experience_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("experiences.id", ondelete="CASCADE"), nullable=False, index=True
    )
    media_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("media.id", ondelete="RESTRICT"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    experience: Mapped[Experience] = relationship(back_populates="media")
    media: Mapped[Media] = relationship()
