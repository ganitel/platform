"""Property lifecycle and projections: draft create / patch / publish /
unpublish, media attach/detach/reorder, and the `to_public` / `to_detail`
mappers that turn ORM rows into API schemas."""

from datetime import UTC, datetime
from typing import Literal, cast
from uuid import UUID

from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.core.money import Currency, Money
from app.modules.media.models import Media, MediaKind
from app.modules.media.schemas import MediaItemPublic, MediaPublic
from app.modules.media.service import load_poster
from app.modules.media.service import to_public as media_to_public
from app.modules.properties.models import Property, PropertyMediaItem, PropertyPrice, PropertyStatus
from app.modules.properties.schemas import (
    AdminStatusSummary,
    GeoPoint,
    HostPublic,
    PropertyAdminListItem,
    PropertyCreateIn,
    PropertyDetail,
    PropertyListingMetadata,
    PropertyPublic,
    PropertyShowcaseAmenities,
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


def _contains_any(values: set[str], candidates: set[str]) -> bool:
    return any(value in values for value in candidates)


def _showcase_amenities(property: Property) -> PropertyShowcaseAmenities:
    amenities = list(property.amenities)
    normalized = {a.strip().lower() for a in amenities if a and a.strip()}
    has_wifi = _contains_any(normalized, {"wifi", "wi-fi", "wi_fi", "internet"})
    has_ac = _contains_any(
        normalized,
        {"ac", "air_conditioning", "aircon", "airconditioning", "clim", "climatisation"},
    )
    has_gym = _contains_any(normalized, {"gym", "fitness", "fitness_center"})
    highlights = {
        "wifi": has_wifi,
        "ac": has_ac,
        "gym": has_gym,
        "pool": _contains_any(normalized, {"pool"}),
        "kitchen": property.kitchen_type != "none" or _contains_any(normalized, {"kitchen"}),
        "workspace": _contains_any(normalized, {"workspace", "desk"}),
        "parking": property.parking_available != "none"
        or _contains_any(normalized, {"free_parking", "paid_parking", "parking"}),
        "washer": _contains_any(normalized, {"washer"}),
        "hot_water": _contains_any(normalized, {"hot_water"}),
        "tv": _contains_any(normalized, {"tv"}),
        "balcony": _contains_any(normalized, {"balcony"}),
        "terrace": _contains_any(normalized, {"terrace"}),
        "garden": _contains_any(normalized, {"garden"}),
    }
    return PropertyShowcaseAmenities(
        has_wifi=has_wifi,
        has_ac=has_ac,
        has_gym=has_gym,
        smoking_allowed=property.smoking_allowed,
        pets_allowed=property.pets_allowed,
        highlights=highlights,
    )


def _listing_metadata(property: Property) -> PropertyListingMetadata:
    return PropertyListingMetadata(
        parking_available=property.parking_available,
        elevator=property.elevator,
        accessible=property.accessible,
        private_bathroom=property.private_bathroom,
        kitchen_type=property.kitchen_type,
        events_allowed=property.events_allowed,
        family_friendly=property.family_friendly,
        child_friendly=property.child_friendly,
        pets_allowed=property.pets_allowed,
        smoking_allowed=property.smoking_allowed,
        check_in_time=property.check_in_time,
        check_out_time=property.check_out_time,
    )


async def _resolve_listing_media(
    session: AsyncSession, items: list[PropertyMediaItem]
) -> list[MediaItemPublic]:
    out: list[MediaItemPublic] = []
    for it in items:
        poster = await load_poster(session, it.media)
        public = await media_to_public(it.media, poster=poster)
        out.append(
            MediaItemPublic(
                **public.model_dump(),
                media_item_id=it.id,
            )
        )
    return out


async def _cover(session: AsyncSession, items: list[PropertyMediaItem]) -> MediaPublic | None:
    if not items:
        return None
    first = items[0]
    poster = await load_poster(session, first.media)
    return await media_to_public(first.media, poster=poster)


async def create_draft(session: AsyncSession, host: User, payload: PropertyCreateIn) -> Property:
    if not host.is_host:
        host.is_host = True
    prop = Property(
        host_id=host.id,
        title=payload.title,
        description=payload.description,
        property_type=payload.property_type,
        address=payload.address,
        city=payload.city,
        country_code=payload.country_code.upper(),
        location=_point(payload.location),
        capacity=payload.capacity,
        bedrooms=payload.bedrooms,
        beds=payload.beds,
        bathrooms=payload.bathrooms,
        amenities=payload.amenities,
        parking_available=payload.parking_available,
        elevator=payload.elevator,
        accessible=payload.accessible,
        private_bathroom=payload.private_bathroom,
        kitchen_type=payload.kitchen_type,
        events_allowed=payload.events_allowed,
        family_friendly=payload.family_friendly,
        child_friendly=payload.child_friendly,
        pets_allowed=payload.pets_allowed,
        smoking_allowed=payload.smoking_allowed,
        check_in_time=payload.check_in_time,
        check_out_time=payload.check_out_time,
        house_rules=payload.house_rules,
        cancellation_policy=payload.cancellation_policy,
        content_language=payload.content_language,
        status=PropertyStatus.DRAFT,
    )
    session.add(prop)
    await session.flush()

    for price in payload.prices:
        session.add(
            PropertyPrice(
                property_id=prop.id,
                currency=price.currency.value,
                amount=price.amount,
            )
        )

    if payload.media_ids:
        for idx, media_id in enumerate(payload.media_ids):
            media = await session.get(Media, media_id)
            if media is None or (media.owner_user_id != host.id and not host.is_admin):
                raise NotFoundError(code="media.not_found")
            session.add(PropertyMediaItem(property_id=prop.id, media_id=media_id, position=idx))

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
    if "prices" in data and data["prices"] is not None:
        new_prices = data.pop("prices")
        await session.execute(delete(PropertyPrice).where(PropertyPrice.property_id == property.id))
        await session.flush()
        for raw in new_prices:
            price = Money.model_validate(raw)
            session.add(
                PropertyPrice(
                    property_id=property.id,
                    currency=price.currency.value,
                    amount=price.amount,
                )
            )
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
    if not property.prices:
        issues["prices"] = "empty"
    if not property.media:
        issues["media"] = "empty"
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


async def remove(session: AsyncSession, property: Property, user: User) -> Property:
    _ensure_owner(user, property)
    property.status = PropertyStatus.REMOVED
    await session.commit()
    await session.refresh(property)
    return property


async def list_all_for_admin(
    session: AsyncSession,
    *,
    statuses: tuple[PropertyStatus, ...] = (),
    limit: int,
    offset: int,
) -> list[Property]:
    stmt = (
        select(Property)
        .options(selectinload(Property.media).selectinload(PropertyMediaItem.media))
        .order_by(Property.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if statuses:
        stmt = stmt.where(Property.status.in_(statuses))
    return list((await session.execute(stmt)).scalars().all())


async def count_all_for_admin(
    session: AsyncSession, *, statuses: tuple[PropertyStatus, ...] = ()
) -> int:
    stmt = select(func.count()).select_from(Property)
    if statuses:
        stmt = stmt.where(Property.status.in_(statuses))
    return int((await session.execute(stmt)).scalar_one())


async def status_summary(session: AsyncSession) -> AdminStatusSummary:
    stmt = select(Property.status, func.count()).group_by(Property.status)
    rows = (await session.execute(stmt)).all()
    by_status = {status.value: int(count) for status, count in rows}
    return AdminStatusSummary(
        draft=by_status.get(PropertyStatus.DRAFT.value, 0),
        published=by_status.get(PropertyStatus.PUBLISHED.value, 0),
        unlisted=by_status.get(PropertyStatus.UNLISTED.value, 0),
        removed=by_status.get(PropertyStatus.REMOVED.value, 0),
        total=sum(by_status.values()),
    )


async def get(session: AsyncSession, property_id: UUID) -> Property:
    stmt = (
        select(Property)
        .options(selectinload(Property.media).selectinload(PropertyMediaItem.media))
        .where(Property.id == property_id)
    )
    prop = (await session.execute(stmt)).scalar_one_or_none()
    if prop is None:
        raise NotFoundError(code="property.not_found")
    return prop


async def attach_media(
    session: AsyncSession, property: Property, user: User, *, media_id: UUID, position: int
) -> PropertyMediaItem:
    from app.core.errors import ConflictError

    _ensure_owner(user, property)
    media = await session.get(Media, media_id)
    if media is None:
        raise NotFoundError(code="media.not_found")
    if media.owner_user_id != user.id and not user.is_admin:
        raise ForbiddenError(code="media.not_owner")

    current_total = len(property.media)
    if current_total >= 20:
        raise ConflictError(code="media.cap_exceeded")
    if media.kind == MediaKind.VIDEO:
        current_videos = sum(1 for it in property.media if it.media.kind == MediaKind.VIDEO)
        if current_videos >= 3:
            raise ConflictError(code="media.video_cap_exceeded")

    item = PropertyMediaItem(property_id=property.id, media_id=media_id, position=position)
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


async def detach_media(
    session: AsyncSession, property: Property, user: User, item_id: UUID
) -> None:
    _ensure_owner(user, property)
    item = await session.get(PropertyMediaItem, item_id)
    if item is None or item.property_id != property.id:
        raise NotFoundError(code="media_item.not_found")
    await session.delete(item)
    await session.commit()


async def reorder_media(
    session: AsyncSession, property: Property, user: User, order: list[tuple[UUID, int]]
) -> None:
    """Atomic reorder. The set of ids must exactly match the property's
    current media items; partial overlap raises ValidationError."""
    _ensure_owner(user, property)
    existing = {it.id: it for it in property.media}
    requested = {item_id for item_id, _ in order}
    if requested != set(existing.keys()):
        raise ValidationError(code="media.reorder_mismatch")
    if len({pos for _, pos in order}) != len(order):
        raise ValidationError(code="media.reorder_duplicate_positions")
    for item_id, pos in order:
        existing[item_id].position = pos
    await session.commit()


async def to_detail(session: AsyncSession, property: Property, host: User) -> PropertyDetail:
    media_items = await _resolve_listing_media(session, property.media)
    return PropertyDetail(
        id=property.id,
        title=property.title,
        property_type=property.property_type,
        address=property.address,
        city=property.city,
        country_code=property.country_code,
        location=_point_out(property.location),
        capacity=property.capacity,
        bedrooms=property.bedrooms,
        beds=property.beds,
        bathrooms=property.bathrooms,
        prices=[Money(amount=p.amount, currency=Currency(p.currency)) for p in property.prices],
        amenities=list(property.amenities),
        showcase_amenities=_showcase_amenities(property),
        listing_metadata=_listing_metadata(property),
        cover_media=media_items[0] if media_items else None,
        description=property.description,
        house_rules=property.house_rules,
        cancellation_policy=property.cancellation_policy,
        content_language=cast(Literal["fr", "en"], property.content_language),
        status=property.status,
        host=HostPublic.model_validate(host),
        media=media_items,
        created_at=property.created_at,
        published_at=property.published_at,
    )


async def to_admin_list_item(session: AsyncSession, property: Property) -> PropertyAdminListItem:
    return PropertyAdminListItem(
        id=property.id,
        title=property.title,
        property_type=property.property_type,
        city=property.city,
        country_code=property.country_code,
        status=property.status,
        prices=[Money(amount=p.amount, currency=Currency(p.currency)) for p in property.prices],
        cover_media=await _cover(session, property.media),
        created_at=property.created_at,
        published_at=property.published_at,
    )


async def to_public(
    session: AsyncSession, property: Property, *, distance_km: float | None = None
) -> PropertyPublic:
    return PropertyPublic(
        id=property.id,
        title=property.title,
        property_type=property.property_type,
        address=property.address,
        city=property.city,
        country_code=property.country_code,
        location=_point_out(property.location),
        capacity=property.capacity,
        bedrooms=property.bedrooms,
        beds=property.beds,
        bathrooms=property.bathrooms,
        prices=[Money(amount=p.amount, currency=Currency(p.currency)) for p in property.prices],
        amenities=list(property.amenities),
        showcase_amenities=_showcase_amenities(property),
        listing_metadata=_listing_metadata(property),
        cover_media=await _cover(session, property.media),
        distance_km=distance_km,
    )
