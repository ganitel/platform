"""Experience read-side service: fetch + project to API schemas.

Write-side (create / update / publish / photo management) is intentionally
out of scope for v1 — the seed script populates experiences directly.
When the host workflow lands, mirror the properties module.
"""

from typing import Literal, cast
from uuid import UUID

from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError
from app.core.money import Currency, Money
from app.modules.experiences.models import Experience, ExperiencePhoto
from app.modules.experiences.schemas import (
    ExperienceDetail,
    ExperiencePublic,
)
from app.modules.media.service import to_public as media_to_public
from app.modules.properties.schemas import GeoPoint, HostPublic
from app.modules.users.models import User


def _point(p: GeoPoint):
    return from_shape(Point(p.lng, p.lat), srid=4326)


def _point_out(loc) -> GeoPoint:
    geom = to_shape(loc)
    return GeoPoint(lat=geom.y, lng=geom.x)


async def get(session: AsyncSession, experience_id: UUID) -> Experience:
    stmt = (
        select(Experience)
        .options(selectinload(Experience.photos).selectinload(ExperiencePhoto.media))
        .where(Experience.id == experience_id)
    )
    exp = (await session.execute(stmt)).scalar_one_or_none()
    if exp is None:
        raise NotFoundError("experience not found")
    return exp


async def to_public(experience: Experience, *, distance_km: float | None = None) -> ExperiencePublic:
    cover = experience.photos[0] if experience.photos else None
    return ExperiencePublic(
        id=experience.id,
        title=experience.title,
        experience_type=experience.experience_type,
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
    photos = [await media_to_public(p.media) for p in experience.photos]
    return ExperienceDetail(
        id=experience.id,
        title=experience.title,
        experience_type=experience.experience_type,
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
