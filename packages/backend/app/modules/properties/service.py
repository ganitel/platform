"""Property lifecycle and projections: draft create / patch / publish /
unpublish, photo attach/detach, and the `to_public` / `to_detail`
mappers that turn ORM rows into API schemas."""

from datetime import UTC, datetime
from typing import Literal, cast
from uuid import UUID

from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.core.money import Currency, Money
from app.modules.media.models import Media
from app.modules.media.service import to_public as media_to_public
from app.modules.properties.models import Property, PropertyPhoto, PropertyStatus
from app.modules.properties.schemas import (
    GeoPoint,
    HostPublic,
    PropertyCreateIn,
    PropertyDetail,
    PropertyPublic,
    PropertyUpdateIn,
)
from app.modules.users.models import User


def _point(p: GeoPoint):
    return from_shape(Point(p.lng, p.lat), srid=4326)


def _point_out(loc) -> GeoPoint:
    geom = to_shape(loc)
    return GeoPoint(lat=geom.y, lng=geom.x)


def _ensure_owner(user: User, property: Property) -> None:
    if property.host_id != user.id and not user.is_admin:
        raise ForbiddenError(code="property.not_owner")


async def create_draft(session: AsyncSession, host: User, payload: PropertyCreateIn) -> Property:
    if not host.is_host:
        host.is_host = True  # auto-promote on first listing
    prop = Property(
        host_id=host.id,
        title=payload.title,
        description=payload.description,
        property_type=payload.property_type,
        city=payload.city,
        country_code=payload.country_code.upper(),
        location=_point(payload.location),
        capacity=payload.capacity,
        bedrooms=payload.bedrooms,
        beds=payload.beds,
        bathrooms=payload.bathrooms,
        amenities=payload.amenities,
        house_rules=payload.house_rules,
        cancellation_policy=payload.cancellation_policy,
        base_price_amount=payload.base_price.amount,
        base_price_currency=payload.base_price.currency.value,
        content_language=payload.content_language,
        status=PropertyStatus.DRAFT,
    )
    session.add(prop)
    await session.commit()
    await session.refresh(prop)
    return prop


async def update(
    session: AsyncSession, property: Property, user: User, patch: PropertyUpdateIn
) -> Property:
    _ensure_owner(user, property)
    data = patch.model_dump(exclude_unset=True)
    if "location" in data and data["location"] is not None:
        property.location = _point(GeoPoint(**data.pop("location")))
    if "country_code" in data and data["country_code"] is not None:
        property.country_code = data.pop("country_code").upper()
    if "base_price" in data and data["base_price"] is not None:
        new_price = data.pop("base_price")
        property.base_price_amount = new_price["amount"]
        property.base_price_currency = new_price["currency"]
    for k, v in data.items():
        setattr(property, k, v)
    await session.commit()
    await session.refresh(property)
    return property


async def publish(session: AsyncSession, property: Property, user: User) -> Property:
    _ensure_owner(user, property)
    issues: dict[str, str] = {}
    if not property.title.strip():
        issues["title"] = "missing"
    if property.base_price_amount is None or property.base_price_amount <= 0:
        issues["base_price_amount"] = "not_positive"
    if not property.photos:
        issues["photos"] = "empty"
    if issues:
        raise ValidationError(code="property.not_ready", extra={"issues": issues})
    property.status = PropertyStatus.PUBLISHED
    property.published_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(property)
    return property


async def unpublish(session: AsyncSession, property: Property, user: User) -> Property:
    _ensure_owner(user, property)
    property.status = PropertyStatus.UNLISTED
    await session.commit()
    await session.refresh(property)
    return property


async def get(session: AsyncSession, property_id: UUID) -> Property:
    stmt = (
        select(Property)
        .options(selectinload(Property.photos).selectinload(PropertyPhoto.media))
        .where(Property.id == property_id)
    )
    prop = (await session.execute(stmt)).scalar_one_or_none()
    if prop is None:
        raise NotFoundError(code="property.not_found")
    return prop


async def attach_photo(
    session: AsyncSession, property: Property, user: User, *, media_id: UUID, position: int
) -> PropertyPhoto:
    _ensure_owner(user, property)
    media = await session.get(Media, media_id)
    if media is None:
        raise NotFoundError(code="media.not_found")
    if media.owner_user_id != user.id and not user.is_admin:
        raise ForbiddenError(code="media.not_owner")
    photo = PropertyPhoto(property_id=property.id, media_id=media_id, position=position)
    session.add(photo)
    await session.commit()
    await session.refresh(photo)
    return photo


async def detach_photo(
    session: AsyncSession, property: Property, user: User, photo_id: UUID
) -> None:
    _ensure_owner(user, property)
    photo = await session.get(PropertyPhoto, photo_id)
    if photo is None or photo.property_id != property.id:
        raise NotFoundError(code="photo.not_found")
    await session.delete(photo)
    await session.commit()


async def to_detail(property: Property, host: User) -> PropertyDetail:
    photos = [await media_to_public(p.media) for p in property.photos]
    return PropertyDetail(
        id=property.id,
        title=property.title,
        property_type=property.property_type,
        city=property.city,
        country_code=property.country_code,
        location=_point_out(property.location),
        capacity=property.capacity,
        bedrooms=property.bedrooms,
        beds=property.beds,
        bathrooms=property.bathrooms,
        base_price=Money(
            amount=property.base_price_amount, currency=Currency(property.base_price_currency)
        ),
        amenities=list(property.amenities),
        cover_photo=photos[0] if photos else None,
        description=property.description,
        house_rules=property.house_rules,
        cancellation_policy=property.cancellation_policy,
        content_language=cast(Literal["fr", "en"], property.content_language),
        status=property.status,
        host=HostPublic.model_validate(host),
        photos=photos,
        created_at=property.created_at,
        published_at=property.published_at,
    )


async def to_public(property: Property, *, distance_km: float | None = None) -> PropertyPublic:
    cover = property.photos[0] if property.photos else None
    return PropertyPublic(
        id=property.id,
        title=property.title,
        property_type=property.property_type,
        city=property.city,
        country_code=property.country_code,
        location=_point_out(property.location),
        capacity=property.capacity,
        bedrooms=property.bedrooms,
        beds=property.beds,
        bathrooms=property.bathrooms,
        base_price=Money(
            amount=property.base_price_amount, currency=Currency(property.base_price_currency)
        ),
        amenities=list(property.amenities),
        cover_photo=await media_to_public(cover.media) if cover else None,
        distance_km=distance_km,
    )
