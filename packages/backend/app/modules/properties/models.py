"""SQLAlchemy ORM models for properties: the listing itself, its photo
join table (`PropertyPhoto`), and enums (`PropertyStatus`,
`CancellationPolicy`). Money is stored split into amount + currency
columns; the API recomposes via `Money`."""

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
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.modules.media.models import Media


class PropertyStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    UNLISTED = "unlisted"
    REMOVED = "removed"


class CancellationPolicy(StrEnum):
    FLEXIBLE = "flexible"
    MODERATE = "moderate"
    STRICT = "strict"


class Property(Base):
    __tablename__ = "properties"
    __table_args__ = (
        CheckConstraint("capacity >= 1", name="ck_properties_capacity_positive"),
        CheckConstraint("base_price_amount >= 0", name="ck_properties_price_non_negative"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    host_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text(), nullable=False, server_default="")
    property_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)

    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    location: Mapped[Any] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False
    )

    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    bedrooms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    beds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    bathrooms: Mapped[Decimal] = mapped_column(Numeric(4, 1), nullable=False, default=Decimal("0"))

    amenities: Mapped[list[str]] = mapped_column(ARRAY(String(40)), nullable=False, server_default="{}")

    house_rules: Mapped[str | None] = mapped_column(Text())
    cancellation_policy: Mapped[CancellationPolicy] = mapped_column(
        Enum(
            CancellationPolicy,
            name="cancellation_policy",
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
        default=CancellationPolicy.MODERATE,
    )

    base_price_amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    base_price_currency: Mapped[str] = mapped_column(String(3), nullable=False)

    content_language: Mapped[str] = mapped_column(String(2), nullable=False, default="fr")
    status: Mapped[PropertyStatus] = mapped_column(
        Enum(
            PropertyStatus,
            name="property_status",
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
        default=PropertyStatus.DRAFT,
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

    photos: Mapped[list["PropertyPhoto"]] = relationship(
        back_populates="property",
        cascade="all, delete-orphan",
        order_by="PropertyPhoto.position",
    )


class PropertyPhoto(Base):
    __tablename__ = "property_photos"

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    media_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("media.id", ondelete="RESTRICT"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    property: Mapped[Property] = relationship(back_populates="photos")
    media: Mapped[Media] = relationship()
