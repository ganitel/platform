"""Search query builder for experiences. Mirrors the properties search
shape but on the Experience table."""

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from geoalchemy2 import Geography
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import Select, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.experiences.models import Experience, ExperiencePhoto, ExperienceStatus

SortKey = Literal["relevance", "distance", "price_asc", "price_desc", "newest"]


@dataclass(frozen=True)
class SearchFilters:
    q: str | None = None
    lat: float | None = None
    lng: float | None = None
    radius_km: float | None = None
    city: str | None = None
    country_code: str | None = None
    guests: int | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    experience_types: tuple[str, ...] = ()
    sort: SortKey = "relevance"
    limit: int = 20
    offset: int = 0


def _apply_filters(stmt: Select, f: SearchFilters):
    stmt = stmt.where(Experience.status == ExperienceStatus.PUBLISHED)
    if f.q:
        stmt = stmt.where(Experience.search_tsv.op("@@")(func.plainto_tsquery("simple", f.q)))
    if f.lat is not None and f.lng is not None and f.radius_km is not None:
        point = cast(from_shape(Point(f.lng, f.lat), srid=4326), Geography)
        stmt = stmt.where(func.ST_DWithin(Experience.location, point, f.radius_km * 1000))
    if f.city:
        stmt = stmt.where(func.lower(Experience.city) == f.city.lower())
    if f.country_code:
        stmt = stmt.where(Experience.country_code == f.country_code.upper())
    if f.guests is not None:
        stmt = stmt.where(Experience.capacity >= f.guests)
    if f.min_price is not None:
        stmt = stmt.where(Experience.base_price_amount >= f.min_price)
    if f.max_price is not None:
        stmt = stmt.where(Experience.base_price_amount <= f.max_price)
    if f.experience_types:
        stmt = stmt.where(Experience.experience_type.in_(f.experience_types))
    return stmt


async def count(session: AsyncSession, f: SearchFilters) -> int:
    stmt = _apply_filters(select(func.count(Experience.id)), f)
    return int((await session.execute(stmt)).scalar_one())


async def search(session: AsyncSession, f: SearchFilters) -> list[tuple[Experience, float | None]]:
    stmt = select(Experience).options(
        selectinload(Experience.photos).selectinload(ExperiencePhoto.media)
    )
    stmt = _apply_filters(stmt, f)

    distance_expr = None
    if f.lat is not None and f.lng is not None:
        point = cast(from_shape(Point(f.lng, f.lat), srid=4326), Geography)
        distance_expr = func.ST_Distance(Experience.location, point)
        stmt = stmt.add_columns(distance_expr.label("distance_m"))

    if f.sort == "distance" and distance_expr is not None:
        stmt = stmt.order_by(distance_expr.asc())
    elif f.sort == "price_asc":
        stmt = stmt.order_by(Experience.base_price_amount.asc())
    elif f.sort == "price_desc":
        stmt = stmt.order_by(Experience.base_price_amount.desc())
    elif f.sort == "newest":
        stmt = stmt.order_by(Experience.published_at.desc().nulls_last())
    elif f.q:
        stmt = stmt.order_by(
            func.ts_rank(Experience.search_tsv, func.plainto_tsquery("simple", f.q)).desc()
        )
    else:
        stmt = stmt.order_by(Experience.published_at.desc().nulls_last())

    stmt = stmt.limit(f.limit).offset(f.offset)
    rows = (await session.execute(stmt)).all()
    out: list[tuple[Experience, float | None]] = []
    for row in rows:
        if distance_expr is not None:
            exp, dist_m = row
            out.append((exp, float(dist_m) / 1000.0 if dist_m is not None else None))
        else:
            out.append((row[0], None))
    return out
