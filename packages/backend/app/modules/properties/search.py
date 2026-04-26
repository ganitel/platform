"""Search query builder for properties. Translates the public filter
shape (q, geo radius, capacity, price range, amenities, sort) into a
SQLAlchemy query, and computes `distance_km` when a center is given."""

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from geoalchemy2 import Geography
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import Select, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.properties.models import Property, PropertyPhoto, PropertyStatus

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
    property_types: tuple[str, ...] = ()
    amenities: tuple[str, ...] = ()
    sort: SortKey = "relevance"
    limit: int = 20
    offset: int = 0


def _apply_filters(stmt: Select, f: SearchFilters):
    stmt = stmt.where(Property.status == PropertyStatus.PUBLISHED)
    if f.q:
        stmt = stmt.where(Property.search_tsv.op("@@")(func.plainto_tsquery("simple", f.q)))
    if f.lat is not None and f.lng is not None and f.radius_km is not None:
        point = cast(from_shape(Point(f.lng, f.lat), srid=4326), Geography)
        stmt = stmt.where(func.ST_DWithin(Property.location, point, f.radius_km * 1000))
    if f.city:
        stmt = stmt.where(func.lower(Property.city) == f.city.lower())
    if f.country_code:
        stmt = stmt.where(Property.country_code == f.country_code.upper())
    if f.guests is not None:
        stmt = stmt.where(Property.capacity >= f.guests)
    if f.min_price is not None:
        stmt = stmt.where(Property.base_price_amount >= f.min_price)
    if f.max_price is not None:
        stmt = stmt.where(Property.base_price_amount <= f.max_price)
    if f.property_types:
        stmt = stmt.where(Property.property_type.in_(f.property_types))
    if f.amenities:
        # require ALL listed amenities (`@>` = "contains")
        stmt = stmt.where(Property.amenities.op("@>")(list(f.amenities)))
    return stmt


async def count(session: AsyncSession, f: SearchFilters) -> int:
    stmt = _apply_filters(select(func.count(Property.id)), f)
    return int((await session.execute(stmt)).scalar_one())


async def search(session: AsyncSession, f: SearchFilters) -> list[tuple[Property, float | None]]:
    stmt = select(Property).options(selectinload(Property.photos).selectinload(PropertyPhoto.media))
    stmt = _apply_filters(stmt, f)

    distance_expr = None
    if f.lat is not None and f.lng is not None:
        point = cast(from_shape(Point(f.lng, f.lat), srid=4326), Geography)
        distance_expr = func.ST_Distance(Property.location, point)
        stmt = stmt.add_columns(distance_expr.label("distance_m"))

    if f.sort == "distance" and distance_expr is not None:
        stmt = stmt.order_by(distance_expr.asc())
    elif f.sort == "price_asc":
        stmt = stmt.order_by(Property.base_price_amount.asc())
    elif f.sort == "price_desc":
        stmt = stmt.order_by(Property.base_price_amount.desc())
    elif f.sort == "newest":
        stmt = stmt.order_by(Property.published_at.desc().nulls_last())
    elif f.q:
        stmt = stmt.order_by(
            func.ts_rank(Property.search_tsv, func.plainto_tsquery("simple", f.q)).desc()
        )
    else:
        stmt = stmt.order_by(Property.published_at.desc().nulls_last())

    stmt = stmt.limit(f.limit).offset(f.offset)
    rows = (await session.execute(stmt)).all()
    out: list[tuple[Property, float | None]] = []
    for row in rows:
        if distance_expr is not None:
            prop, dist_m = row
            out.append((prop, float(dist_m) / 1000.0 if dist_m is not None else None))
        else:
            out.append((row[0], None))
    return out
