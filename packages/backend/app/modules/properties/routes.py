"""HTTP endpoints for properties — anonymous search + detail, and
host-only create / update / publish / photo management. All search
parameters are query-string based; see `search.py` for the filter and
sort logic."""

import asyncio
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response, status

from app.core.cache import PUBLIC_CDN_CACHE
from app.core.deps import CurrentUser, DbSession
from app.core.errors import ForbiddenError, NotFoundError
from app.modules.properties import search as search_mod
from app.modules.properties import service
from app.modules.properties.schemas import (
    AdminListOut,
    AttachPhotoIn,
    PhotoAttachOut,
    PropertyCreateIn,
    PropertyDetail,
    PropertyUpdateIn,
    SearchOut,
)
from app.modules.users.models import User


async def _detail_with_host(session: DbSession, prop, user: User) -> PropertyDetail:
    """Build a PropertyDetail using the property's actual host, not the
    acting user. Matters when an admin acts on a property owned by someone
    else — `to_detail(prop, user)` would mislabel the admin as the host."""
    host = await session.get(User, prop.host_id)
    if host is None:
        raise NotFoundError(code="host.not_found")
    return await service.to_detail(prop, host)


router = APIRouter(prefix="/properties", tags=["properties"])


@router.post("", response_model=PropertyDetail, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: PropertyCreateIn, user: CurrentUser, session: DbSession
) -> PropertyDetail:
    prop = await service.create_draft(session, user, body)
    fresh = await service.get(session, prop.id)
    return await service.to_detail(fresh, user)


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
    property_type: Annotated[list[str] | None, Query()] = None,
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
        property_types=tuple(property_type or ()),
        amenities=tuple(amenity or ()),
        sort=sort,
        limit=limit,
        offset=offset,
    )
    rows = await search_mod.search(session, f)
    total = await search_mod.count(session, f)
    items = [await service.to_public(p, distance_km=d) for p, d in rows]
    response.headers["Cache-Control"] = PUBLIC_CDN_CACHE
    return SearchOut(items=items, total=total, limit=limit, offset=offset)


@router.get("/admin", response_model=AdminListOut)
async def admin_list_properties(
    user: CurrentUser,
    session: DbSession,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> AdminListOut:
    if not user.is_admin:
        raise ForbiddenError(code="admin.required")
    rows = await service.list_all_for_admin(session, limit=limit, offset=offset)
    total = await service.count_all_for_admin(session)
    items = await asyncio.gather(*(service.to_admin_list_item(p) for p in rows))
    return AdminListOut(items=list(items), total=total, limit=limit, offset=offset)


@router.get("/{property_id}", response_model=PropertyDetail)
async def get_property(property_id: UUID, response: Response, session: DbSession) -> PropertyDetail:
    prop = await service.get(session, property_id)
    host = await session.get(User, prop.host_id)
    if host is None:
        raise NotFoundError(code="host.not_found")
    response.headers["Cache-Control"] = PUBLIC_CDN_CACHE
    return await service.to_detail(prop, host)


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
    "/{property_id}/photos",
    response_model=PhotoAttachOut,
    status_code=status.HTTP_201_CREATED,
)
async def attach_photo(
    property_id: UUID, body: AttachPhotoIn, user: CurrentUser, session: DbSession
) -> PhotoAttachOut:
    prop = await service.get(session, property_id)
    photo = await service.attach_photo(
        session, prop, user, media_id=body.media_id, position=body.position
    )
    return PhotoAttachOut(id=photo.id, position=photo.position)


@router.delete("/{property_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def detach_photo(
    property_id: UUID, photo_id: UUID, user: CurrentUser, session: DbSession
) -> None:
    prop = await service.get(session, property_id)
    await service.detach_photo(session, prop, user, photo_id)
