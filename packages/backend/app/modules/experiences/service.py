"""Experience lifecycle and projections — mirrors properties/service.py.

Create / update / publish / unpublish / remove + photo attach/detach +
admin list + the `to_*` mappers that turn ORM rows into API schemas.
"""

from datetime import UTC, datetime
from typing import Literal, cast
from uuid import UUID

from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.core.money import Currency, Money
from app.modules.experiences.models import (
    Experience,
    ExperienceMediaItem,
    ExperienceStatus,
)
from app.modules.experiences.schemas import (
    AdminStatusSummary,
    ExperienceAdminListItem,
    ExperienceCreateIn,
    ExperienceDetail,
    ExperiencePublic,
    ExperienceUpdateIn,
)
from app.modules.media.models import Media
from app.modules.media.service import to_public as media_to_public
from app.modules.properties.schemas import GeoPoint, HostPublic
from app.modules.users.models import User


def _point(p: GeoPoint):
    return from_shape(Point(p.lng, p.lat), srid=4326)


def _point_out(loc) -> GeoPoint:
    geom = to_shape(loc)
    return GeoPoint(lat=geom.y, lng=geom.x)


def _ensure_owner(user: User, experience: Experience) -> None:
    if experience.host_id != user.id and not user.is_admin:
        raise ForbiddenError(code="experience.not_owner")


async def create_draft(
    session: AsyncSession, host: User, payload: ExperienceCreateIn
) -> Experience:
    if not host.is_host:
        host.is_host = True  # auto-promote on first listing
    exp = Experience(
        host_id=host.id,
        title=payload.title,
        description=payload.description,
        experience_type=payload.experience_type,
        address=payload.address,
        city=payload.city,
        country_code=payload.country_code.upper(),
        location=_point(payload.location),
        capacity=payload.capacity,
        duration_minutes=payload.duration_minutes,
        cancellation_policy=payload.cancellation_policy,
        base_price_amount=payload.base_price.amount,
        base_price_currency=payload.base_price.currency.value,
        content_language=payload.content_language,
        status=ExperienceStatus.DRAFT,
    )
    session.add(exp)
    await session.commit()
    await session.refresh(exp)
    return exp


async def update(
    session: AsyncSession,
    experience: Experience,
    user: User,
    patch: ExperienceUpdateIn,
) -> Experience:
    _ensure_owner(user, experience)
    data = patch.model_dump(exclude_unset=True)
    if "location" in data and data["location"] is not None:
        experience.location = _point(GeoPoint(**data.pop("location")))
    if "country_code" in data and data["country_code"] is not None:
        experience.country_code = data.pop("country_code").upper()
    if "base_price" in data and data["base_price"] is not None:
        new_price = data.pop("base_price")
        experience.base_price_amount = new_price["amount"]
        experience.base_price_currency = new_price["currency"]
    for k, v in data.items():
        setattr(experience, k, v)
    await session.commit()
    await session.refresh(experience)
    return experience


async def publish(session: AsyncSession, experience: Experience, user: User) -> Experience:
    _ensure_owner(user, experience)
    issues: dict[str, str] = {}
    if not experience.title.strip():
        issues["title"] = "missing"
    if experience.base_price_amount is None or experience.base_price_amount <= 0:
        issues["base_price_amount"] = "not_positive"
    if not experience.media:
        issues["photos"] = "empty"
    if issues:
        raise ValidationError(code="experience.not_ready", extra={"issues": issues})
    experience.status = ExperienceStatus.PUBLISHED
    experience.published_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(experience)
    return experience


async def unpublish(session: AsyncSession, experience: Experience, user: User) -> Experience:
    _ensure_owner(user, experience)
    experience.status = ExperienceStatus.UNLISTED
    await session.commit()
    await session.refresh(experience)
    return experience


async def remove(session: AsyncSession, experience: Experience, user: User) -> Experience:
    _ensure_owner(user, experience)
    experience.status = ExperienceStatus.REMOVED
    await session.commit()
    await session.refresh(experience)
    return experience


async def list_all_for_admin(
    session: AsyncSession,
    *,
    statuses: tuple[ExperienceStatus, ...] = (),
    limit: int,
    offset: int,
) -> list[Experience]:
    stmt = (
        select(Experience)
        .options(selectinload(Experience.media).selectinload(ExperienceMediaItem.media))
        .order_by(Experience.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if statuses:
        stmt = stmt.where(Experience.status.in_(statuses))
    return list((await session.execute(stmt)).scalars().all())


async def count_all_for_admin(
    session: AsyncSession, *, statuses: tuple[ExperienceStatus, ...] = ()
) -> int:
    stmt = select(func.count()).select_from(Experience)
    if statuses:
        stmt = stmt.where(Experience.status.in_(statuses))
    return int((await session.execute(stmt)).scalar_one())


async def status_summary(session: AsyncSession) -> AdminStatusSummary:
    stmt = select(Experience.status, func.count()).group_by(Experience.status)
    rows = (await session.execute(stmt)).all()
    by_status = {status.value: int(count) for status, count in rows}
    return AdminStatusSummary(
        draft=by_status.get(ExperienceStatus.DRAFT.value, 0),
        published=by_status.get(ExperienceStatus.PUBLISHED.value, 0),
        unlisted=by_status.get(ExperienceStatus.UNLISTED.value, 0),
        removed=by_status.get(ExperienceStatus.REMOVED.value, 0),
        total=sum(by_status.values()),
    )


async def get(session: AsyncSession, experience_id: UUID) -> Experience:
    stmt = (
        select(Experience)
        .options(selectinload(Experience.media).selectinload(ExperienceMediaItem.media))
        .where(Experience.id == experience_id)
    )
    exp = (await session.execute(stmt)).scalar_one_or_none()
    if exp is None:
        raise NotFoundError(code="experience.not_found")
    return exp


async def attach_photo(
    session: AsyncSession,
    experience: Experience,
    user: User,
    *,
    media_id: UUID,
    position: int,
) -> ExperienceMediaItem:
    _ensure_owner(user, experience)
    media = await session.get(Media, media_id)
    if media is None:
        raise NotFoundError(code="media.not_found")
    if media.owner_user_id != user.id and not user.is_admin:
        raise ForbiddenError(code="media.not_owner")
    photo = ExperienceMediaItem(experience_id=experience.id, media_id=media_id, position=position)
    session.add(photo)
    await session.commit()
    await session.refresh(photo)
    return photo


async def detach_photo(
    session: AsyncSession,
    experience: Experience,
    user: User,
    photo_id: UUID,
) -> None:
    _ensure_owner(user, experience)
    photo = await session.get(ExperienceMediaItem, photo_id)
    if photo is None or photo.experience_id != experience.id:
        raise NotFoundError(code="photo.not_found")
    await session.delete(photo)
    await session.commit()


async def to_public(
    experience: Experience, *, distance_km: float | None = None
) -> ExperiencePublic:
    cover = experience.media[0] if experience.media else None
    return ExperiencePublic(
        id=experience.id,
        title=experience.title,
        experience_type=experience.experience_type,
        address=experience.address,
        city=experience.city,
        country_code=experience.country_code,
        location=_point_out(experience.location),
        capacity=experience.capacity,
        duration_minutes=experience.duration_minutes,
        base_price=Money(
            amount=experience.base_price_amount,
            currency=Currency(experience.base_price_currency),
        ),
        cover_photo=await media_to_public(cover.media) if cover else None,
        distance_km=distance_km,
    )


async def to_detail(experience: Experience, host: User) -> ExperienceDetail:
    photos = [await media_to_public(p.media) for p in experience.media]
    return ExperienceDetail(
        id=experience.id,
        title=experience.title,
        experience_type=experience.experience_type,
        address=experience.address,
        city=experience.city,
        country_code=experience.country_code,
        location=_point_out(experience.location),
        capacity=experience.capacity,
        duration_minutes=experience.duration_minutes,
        base_price=Money(
            amount=experience.base_price_amount,
            currency=Currency(experience.base_price_currency),
        ),
        cover_photo=photos[0] if photos else None,
        description=experience.description,
        cancellation_policy=experience.cancellation_policy,
        content_language=cast(Literal["fr", "en"], experience.content_language),
        status=experience.status,
        host=HostPublic.model_validate(host),
        photos=photos,
        created_at=experience.created_at,
        published_at=experience.published_at,
    )


async def to_admin_list_item(experience: Experience) -> ExperienceAdminListItem:
    cover = experience.media[0] if experience.media else None
    return ExperienceAdminListItem(
        id=experience.id,
        title=experience.title,
        experience_type=experience.experience_type,
        city=experience.city,
        country_code=experience.country_code,
        status=experience.status,
        duration_minutes=experience.duration_minutes,
        base_price=Money(
            amount=experience.base_price_amount,
            currency=Currency(experience.base_price_currency),
        ),
        cover_photo=await media_to_public(cover.media) if cover else None,
        created_at=experience.created_at,
        published_at=experience.published_at,
    )
