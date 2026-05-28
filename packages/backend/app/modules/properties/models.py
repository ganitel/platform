"""SQLAlchemy ORM models for properties: the listing itself, its media
join table (`PropertyMediaItem`), price table (`PropertyPrice`), and
enums (`PropertyStatus`, `CancellationPolicy`)."""

from datetime import datetime, time
from decimal import Decimal
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from geoalchemy2 import Geography
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Computed,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy import text as sa_text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TSVECTOR
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


class ParkingAvailability(StrEnum):
    NONE = "none"
    FREE = "free"
    PAID = "paid"


class KitchenType(StrEnum):
    NONE = "none"
    KITCHENETTE = "kitchenette"
    FULL = "full"


class PropertyKind(StrEnum):
    RENTAL = "rental"
    HOTEL = "hotel"


class Property(Base):
    __tablename__ = "properties"
    __table_args__ = (
        CheckConstraint(
            "capacity IS NULL OR capacity >= 1",
            name="ck_properties_capacity_positive",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    host_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    kind: Mapped[PropertyKind] = mapped_column(
        Enum(
            PropertyKind,
            name="property_kind",
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
        default=PropertyKind.RENTAL,
        server_default=PropertyKind.RENTAL.value,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text(), nullable=False, server_default="")
    property_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)

    address: Mapped[str | None] = mapped_column(String(300))
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    location: Mapped[Any] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False
    )

    capacity: Mapped[int | None] = mapped_column(Integer)
    bedrooms: Mapped[int | None] = mapped_column(Integer, default=0)
    beds: Mapped[int | None] = mapped_column(Integer, default=0)
    bathrooms: Mapped[int | None] = mapped_column(Integer, default=0)

    amenities: Mapped[list[str]] = mapped_column(
        ARRAY(String(40)), nullable=False, server_default="{}"
    )
    parking_available: Mapped[ParkingAvailability] = mapped_column(
        Enum(
            ParkingAvailability,
            name="parking_availability",
            values_callable=lambda enum: [e.value for e in enum],
        ),
        nullable=False,
        default=ParkingAvailability.NONE,
    )
    elevator: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    accessible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    private_bathroom: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    kitchen_type: Mapped[KitchenType] = mapped_column(
        Enum(
            KitchenType, name="kitchen_type", values_callable=lambda enum: [e.value for e in enum]
        ),
        nullable=False,
        default=KitchenType.NONE,
    )
    events_allowed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    family_friendly: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    child_friendly: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    pets_allowed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    smoking_allowed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    check_in_time: Mapped[time | None] = mapped_column(Time())
    check_out_time: Mapped[time | None] = mapped_column(Time())
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

    media: Mapped[list["PropertyMediaItem"]] = relationship(
        back_populates="property",
        cascade="all, delete-orphan",
        order_by="PropertyMediaItem.position",
    )
    prices: Mapped[list["PropertyPrice"]] = relationship(
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    room_types: Mapped[list["RoomType"]] = relationship(
        back_populates="property",
        cascade="all, delete-orphan",
        order_by="RoomType.position",
    )


class PropertyPrice(Base):
    __tablename__ = "property_prices"

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint("property_id", "currency", name="uq_property_prices_property_currency"),
    )


class PropertyMediaItem(Base):
    __tablename__ = "property_media"

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

    property: Mapped[Property] = relationship(back_populates="media")
    media: Mapped[Media] = relationship()


class RoomType(Base):
    __tablename__ = "room_types"
    __table_args__ = (
        CheckConstraint("max_guests >= 1 AND max_guests <= 16", name="ck_room_types_max_guests"),
        CheckConstraint(
            "inventory_count >= 1 AND inventory_count <= 500",
            name="ck_room_types_inventory_count",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    property_id: Mapped[UUID] = mapped_column(
        Uuid(),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text(), nullable=False, server_default="")
    bed_config: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, server_default=sa_text("'[]'::jsonb")
    )
    max_guests: Mapped[int] = mapped_column(Integer, nullable=False)
    amenities: Mapped[list[str]] = mapped_column(
        ARRAY(String(40)), nullable=False, server_default="{}"
    )
    private_bathroom: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    inventory_count: Mapped[int] = mapped_column(Integer, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    property: Mapped[Property] = relationship(back_populates="room_types")
    prices: Mapped[list["RoomTypePrice"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )
    media: Mapped[list["RoomTypeMediaItem"]] = relationship(
        back_populates="room_type",
        cascade="all, delete-orphan",
        order_by="RoomTypeMediaItem.position",
    )


class RoomTypePrice(Base):
    __tablename__ = "room_type_prices"
    __table_args__ = (
        UniqueConstraint("room_type_id", "currency", name="uq_room_type_prices_room_currency"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    room_type_id: Mapped[UUID] = mapped_column(
        Uuid(),
        ForeignKey("room_types.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(19, 4), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class RoomTypeMediaItem(Base):
    __tablename__ = "room_type_media"

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    room_type_id: Mapped[UUID] = mapped_column(
        Uuid(),
        ForeignKey("room_types.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    media_id: Mapped[UUID] = mapped_column(
        Uuid(), ForeignKey("media.id", ondelete="RESTRICT"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    room_type: Mapped[RoomType] = relationship(back_populates="media")
    media: Mapped[Media] = relationship()
