"""HTTP endpoints for experiences — anonymous search + detail, plus
host/admin create / update / publish / unpublish / remove / photo
management, mirroring the properties module."""

from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response, status

from app.core.cache import PUBLIC_CDN_CACHE
from app.core.deps import CurrentUser, DbSession, OptionalUser
from app.core.errors import NotFoundError
from app.modules.experiences import search as search_mod
from app.modules.experiences import service
from app.modules.experiences.models import Experience, ExperienceStatus
from app.modules.experiences.schemas import (
    AttachPhotoIn,
    ExperienceCreateIn,
    ExperienceDetail,
    ExperienceUpdateIn,
    PhotoAttachOut,
    SearchOut,
)
from app.modules.users.models import User

PRIVATE_DETAIL_CACHE = "private, no-store"


def _can_view_private_detail(exp: Experience, user: User | None) -> bool:
    return user is not None and (user.is_admin or exp.host_id == user.id)


def _set_detail_cache_and_enforce_visibility(
    response: Response,
    exp: Experience,
    user: User | None,
) -> None:
    if exp.status == ExperienceStatus.PUBLISHED:
        response.headers["Cache-Control"] = PUBLIC_CDN_CACHE
        return
    if not _can_view_private_detail(exp, user):
        raise NotFoundError(code="experience.not_found")
    response.headers["Cache-Control"] = PRIVATE_DETAIL_CACHE


async def _detail_with_host(session: DbSession, exp, user: User) -> ExperienceDetail:
    """Build an ExperienceDetail using the experience's actual host, not the
    acting user. Matters when an admin acts on an experience owned by someone
    else — `to_detail(exp, user)` would mislabel the admin as the host."""
    host = await session.get(User, exp.host_id)
    if host is None:
        raise NotFoundError(code="host.not_found")
    return await service.to_detail(exp, host)


router = APIRouter(prefix="/experiences", tags=["experiences"])


@router.post("", response_model=ExperienceDetail, status_code=status.HTTP_201_CREATED)
async def create_experience(
    body: ExperienceCreateIn, user: CurrentUser, session: DbSession
) -> ExperienceDetail:
    exp = await service.create_draft(session, user, body)
    fresh = await service.get(session, exp.id)
    return await service.to_detail(fresh, user)


@router.get("", response_model=SearchOut)
async def search_experiences(
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
    experience_type: Annotated[list[str] | None, Query()] = None,
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
        experience_types=tuple(experience_type or ()),
        sort=sort,
        limit=limit,
        offset=offset,
    )
    rows = await search_mod.search(session, f)
    total = await search_mod.count(session, f)
    items = [await service.to_public(e, distance_km=d) for e, d in rows]
    response.headers["Cache-Control"] = PUBLIC_CDN_CACHE
    return SearchOut(items=items, total=total, limit=limit, offset=offset)


@router.get("/{experience_id}", response_model=ExperienceDetail)
async def get_experience(
    experience_id: UUID,
    response: Response,
    session: DbSession,
    user: OptionalUser,
) -> ExperienceDetail:
    exp = await service.get(session, experience_id)
    _set_detail_cache_and_enforce_visibility(response, exp, user)
    host = await session.get(User, exp.host_id)
    if host is None:
        raise NotFoundError(code="host.not_found")
    return await service.to_detail(exp, host)


@router.patch("/{experience_id}", response_model=ExperienceDetail)
async def update_experience(
    experience_id: UUID,
    body: ExperienceUpdateIn,
    user: CurrentUser,
    session: DbSession,
) -> ExperienceDetail:
    exp = await service.get(session, experience_id)
    await service.update(session, exp, user, body)
    return await _detail_with_host(session, exp, user)


@router.post("/{experience_id}/publish", response_model=ExperienceDetail)
async def publish_experience(
    experience_id: UUID, user: CurrentUser, session: DbSession
) -> ExperienceDetail:
    exp = await service.get(session, experience_id)
    await service.publish(session, exp, user)
    return await _detail_with_host(session, exp, user)


@router.post("/{experience_id}/unpublish", response_model=ExperienceDetail)
async def unpublish_experience(
    experience_id: UUID, user: CurrentUser, session: DbSession
) -> ExperienceDetail:
    exp = await service.get(session, experience_id)
    await service.unpublish(session, exp, user)
    return await _detail_with_host(session, exp, user)


@router.post("/{experience_id}/remove", response_model=ExperienceDetail)
async def remove_experience(
    experience_id: UUID, user: CurrentUser, session: DbSession
) -> ExperienceDetail:
    exp = await service.get(session, experience_id)
    await service.remove(session, exp, user)
    return await _detail_with_host(session, exp, user)


@router.post(
    "/{experience_id}/photos",
    response_model=PhotoAttachOut,
    status_code=status.HTTP_201_CREATED,
)
async def attach_photo(
    experience_id: UUID,
    body: AttachPhotoIn,
    user: CurrentUser,
    session: DbSession,
) -> PhotoAttachOut:
    exp = await service.get(session, experience_id)
    photo = await service.attach_photo(
        session, exp, user, media_id=body.media_id, position=body.position
    )
    return PhotoAttachOut(id=photo.id, position=photo.position)


@router.delete("/{experience_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def detach_photo(
    experience_id: UUID,
    photo_id: UUID,
    user: CurrentUser,
    session: DbSession,
) -> None:
    exp = await service.get(session, experience_id)
    await service.detach_photo(session, exp, user, photo_id)
