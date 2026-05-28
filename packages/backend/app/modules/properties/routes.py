"""HTTP endpoints for properties — anonymous search + detail, and
host-only create / update / publish / media management. All search
parameters are query-string based; see `search.py` for the filter and
sort logic."""

from datetime import date
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import PUBLIC_CDN_CACHE
from app.core.deps import CurrentUser, DbSession, OptionalUser
from app.core.errors import NotFoundError
from app.core.money import Currency, Money
from app.modules.properties import rooms_service, service
from app.modules.properties import search as search_mod
from app.modules.properties.models import Property, PropertyStatus, RoomType
from app.modules.properties.schemas import (
    AttachMediaIn,
    MediaAttachOut,
    PropertyCreateIn,
    PropertyDetail,
    PropertyUpdateIn,
    ReorderMediaIn,
    RoomTypeAvailability,
    RoomTypeCreateIn,
    RoomTypePublic,
    RoomTypeUpdateIn,
    SearchOut,
)
from app.modules.users.models import User

PRIVATE_DETAIL_CACHE = "private, no-store"


def _can_view_private_detail(prop: Property, user: User | None) -> bool:
    return (
        user is not None and user.status == "active" and (user.is_admin or prop.host_id == user.id)
    )


def _set_detail_cache_and_enforce_visibility(
    response: Response,
    prop: Property,
    user: User | None,
) -> None:
    if prop.status == PropertyStatus.PUBLISHED:
        response.headers["Cache-Control"] = PUBLIC_CDN_CACHE
        return
    if not _can_view_private_detail(prop, user):
        raise NotFoundError(code="property.not_found")
    response.headers["Cache-Control"] = PRIVATE_DETAIL_CACHE


async def _detail_with_host(session: DbSession, prop: Property, user: User) -> PropertyDetail:
    """Build a PropertyDetail using the property's actual host, not the
    acting user. Matters when an admin acts on a property owned by someone
    else — `to_detail(session, prop, user)` would mislabel the admin as the host."""
    host = await session.get(User, prop.host_id)
    if host is None:
        raise NotFoundError(code="host.not_found")
    return await service.to_detail(session, prop, host)


router = APIRouter(prefix="/properties", tags=["properties"])


@router.post("", response_model=PropertyDetail, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: PropertyCreateIn, user: CurrentUser, session: DbSession
) -> PropertyDetail:
    prop = await service.create_draft(session, user, body)
    fresh = await service.get(session, prop.id)
    return await service.to_detail(session, fresh, user)


@router.get("", response_model=SearchOut)
async def search_properties(
    response: Response,
    session: DbSession,
    q: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float | None = Query(default=None, ge=0.1, le=500),
    city: str | None = None,
    country_code: str | None = None,
    guests: int | None = Query(default=None, ge=1),
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    currency: str | None = None,
    property_type: Annotated[list[str] | None, Query()] = None,
    kind: Annotated[list[str] | None, Query()] = None,
    amenity: Annotated[list[str] | None, Query()] = None,
    sort: search_mod.SortKey = "relevance",
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> SearchOut:
    f = search_mod.SearchFilters(
        q=q,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        city=city,
        country_code=country_code,
        guests=guests,
        min_price=min_price,
        max_price=max_price,
        currency=currency,
        property_types=tuple(property_type or ()),
        kinds=tuple(kind or ()),
        amenities=tuple(amenity or ()),
        sort=sort,
        limit=limit,
        offset=offset,
    )
    rows = await search_mod.search(session, f)
    total = await search_mod.count(session, f)
    items = [await service.to_public(session, p, distance_km=d) for p, d in rows]
    response.headers["Cache-Control"] = PUBLIC_CDN_CACHE
    return SearchOut(items=items, total=total, limit=limit, offset=offset)


@router.get("/{property_id}", response_model=PropertyDetail)
async def get_property(
    property_id: UUID,
    response: Response,
    session: DbSession,
    user: OptionalUser,
) -> PropertyDetail:
    prop = await service.get(session, property_id)
    _set_detail_cache_and_enforce_visibility(response, prop, user)
    host = await session.get(User, prop.host_id)
    if host is None:
        raise NotFoundError(code="host.not_found")
    return await service.to_detail(session, prop, host)


@router.patch("/{property_id}", response_model=PropertyDetail)
async def update_property(
    property_id: UUID, body: PropertyUpdateIn, user: CurrentUser, session: DbSession
) -> PropertyDetail:
    prop = await service.get(session, property_id)
    await service.update(session, prop, user, body)
    return await _detail_with_host(session, prop, user)


@router.post("/{property_id}/publish", response_model=PropertyDetail)
async def publish_property(
    property_id: UUID, user: CurrentUser, session: DbSession
) -> PropertyDetail:
    prop = await service.get(session, property_id)
    await service.publish(session, prop, user)
    return await _detail_with_host(session, prop, user)


@router.post("/{property_id}/unpublish", response_model=PropertyDetail)
async def unpublish_property(
    property_id: UUID, user: CurrentUser, session: DbSession
) -> PropertyDetail:
    prop = await service.get(session, property_id)
    await service.unpublish(session, prop, user)
    return await _detail_with_host(session, prop, user)


@router.post("/{property_id}/remove", response_model=PropertyDetail)
async def remove_property(
    property_id: UUID, user: CurrentUser, session: DbSession
) -> PropertyDetail:
    prop = await service.get(session, property_id)
    await service.remove(session, prop, user)
    return await _detail_with_host(session, prop, user)


@router.post(
    "/{property_id}/media",
    response_model=MediaAttachOut,
    status_code=status.HTTP_201_CREATED,
)
async def attach_media(
    property_id: UUID, body: AttachMediaIn, user: CurrentUser, session: DbSession
) -> MediaAttachOut:
    prop = await service.get(session, property_id)
    item = await service.attach_media(
        session, prop, user, media_id=body.media_id, position=body.position
    )
    return MediaAttachOut(id=item.id, position=item.position)


@router.patch("/{property_id}/media", response_model=PropertyDetail)
async def reorder_media(
    property_id: UUID,
    body: ReorderMediaIn,
    user: CurrentUser,
    session: DbSession,
) -> PropertyDetail:
    prop = await service.get(session, property_id)
    await service.reorder_media(
        session, prop, user, [(o.media_item_id, o.position) for o in body.order]
    )
    return await _detail_with_host(session, prop, user)


@router.delete("/{property_id}/media/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def detach_media(
    property_id: UUID, item_id: UUID, user: CurrentUser, session: DbSession
) -> None:
    prop = await service.get(session, property_id)
    await service.detach_media(session, prop, user, item_id)


async def _compute_availability(
    session: AsyncSession,
    room: RoomType,
    check_in: date,
    check_out: date,
    currency: str | None,
    guests: int | None,
) -> RoomTypeAvailability:
    from app.modules.bookings.models import ACTIVE_STATUSES, Booking

    used = int(
        (
            await session.execute(
                select(func.count())
                .select_from(Booking)
                .where(
                    Booking.room_type_id == room.id,
                    Booking.status.in_(ACTIVE_STATUSES),
                    Booking.check_in_date < check_out,
                    Booking.check_out_date > check_in,
                )
            )
        ).scalar_one()
    )
    units_available = max(0, room.inventory_count - used)
    fits = (guests is None) or (guests <= room.max_guests)
    nights = (check_out - check_in).days

    price = None
    if currency:
        match = next((p for p in room.prices if p.currency == currency.upper()), None)
        price = match
    if price is None and room.prices:
        price = room.prices[0]

    nightly = (
        Money(amount=price.amount, currency=Currency(price.currency)) if price is not None else None
    )
    total = (
        Money(amount=price.amount * nights, currency=Currency(price.currency))
        if price is not None
        else None
    )
    return RoomTypeAvailability(
        units_available=units_available,
        available=units_available > 0 and room.active and fits,
        nights=nights,
        nightly=nightly,
        total=total,
    )


@router.get("/{property_id}/rooms", response_model=list[RoomTypePublic])
async def list_property_rooms(
    property_id: UUID,
    response: Response,
    session: DbSession,
    user: OptionalUser,
    check_in: date | None = None,
    check_out: date | None = None,
    guests: int | None = Query(default=None, ge=1),
    currency: str | None = None,
) -> list[RoomTypePublic]:
    prop = await service.get(session, property_id)
    if prop.status != PropertyStatus.PUBLISHED:
        raise NotFoundError(code="property.not_found")
    rooms = await service._load_rooms(session, prop.id)
    out: list[RoomTypePublic] = []
    for room in rooms:
        public = await service.room_to_public(session, room)
        if check_in and check_out and check_out > check_in:
            availability = await _compute_availability(
                session, room, check_in, check_out, currency, guests
            )
            public = public.model_copy(update={"availability": availability})
        out.append(public)
    response.headers["Cache-Control"] = PRIVATE_DETAIL_CACHE
    return out


@router.post(
    "/{property_id}/rooms",
    response_model=RoomTypePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_room(
    property_id: UUID,
    body: RoomTypeCreateIn,
    user: CurrentUser,
    session: DbSession,
) -> RoomTypePublic:
    prop = await service.get(session, property_id)
    room = await rooms_service.create_room(session, prop, user, body)
    fresh = await rooms_service.get_room(session, room.id)
    return await service.room_to_public(session, fresh)


@router.patch("/{property_id}/rooms/{room_id}", response_model=RoomTypePublic)
async def update_room(
    property_id: UUID,
    room_id: UUID,
    body: RoomTypeUpdateIn,
    user: CurrentUser,
    session: DbSession,
) -> RoomTypePublic:
    prop = await service.get(session, property_id)
    room = await rooms_service.get_room(session, room_id)
    await rooms_service.update_room(session, prop, user, room, body)
    fresh = await rooms_service.get_room(session, room.id)
    return await service.room_to_public(session, fresh)


@router.delete("/{property_id}/rooms/{room_id}", response_model=RoomTypePublic)
async def delete_room(
    property_id: UUID,
    room_id: UUID,
    user: CurrentUser,
    session: DbSession,
) -> RoomTypePublic:
    prop = await service.get(session, property_id)
    room = await rooms_service.get_room(session, room_id)
    await rooms_service.soft_delete_room(session, prop, user, room)
    fresh = await rooms_service.get_room(session, room.id)
    return await service.room_to_public(session, fresh)


@router.post(
    "/{property_id}/rooms/{room_id}/media",
    response_model=MediaAttachOut,
    status_code=status.HTTP_201_CREATED,
)
async def attach_room_media(
    property_id: UUID,
    room_id: UUID,
    body: AttachMediaIn,
    user: CurrentUser,
    session: DbSession,
) -> MediaAttachOut:
    prop = await service.get(session, property_id)
    room = await rooms_service.get_room(session, room_id)
    item = await rooms_service.attach_room_media(
        session, prop, user, room, media_id=body.media_id, position=body.position
    )
    return MediaAttachOut(id=item.id, position=item.position)


@router.patch("/{property_id}/rooms/{room_id}/media", response_model=RoomTypePublic)
async def reorder_room_media(
    property_id: UUID,
    room_id: UUID,
    body: ReorderMediaIn,
    user: CurrentUser,
    session: DbSession,
) -> RoomTypePublic:
    prop = await service.get(session, property_id)
    room = await rooms_service.get_room(session, room_id)
    await rooms_service.reorder_room_media(
        session, prop, user, room, [(o.media_item_id, o.position) for o in body.order]
    )
    fresh = await rooms_service.get_room(session, room.id)
    return await service.room_to_public(session, fresh)


@router.delete(
    "/{property_id}/rooms/{room_id}/media/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def detach_room_media(
    property_id: UUID,
    room_id: UUID,
    item_id: UUID,
    user: CurrentUser,
    session: DbSession,
) -> None:
    prop = await service.get(session, property_id)
    room = await rooms_service.get_room(session, room_id)
    await rooms_service.detach_room_media(session, prop, user, room, item_id)
