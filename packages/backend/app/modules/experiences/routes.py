"""HTTP endpoints for experiences. Read-only for v1 (search + detail);
host write paths come later when the experiences product needs them."""

from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response

from app.core.deps import DbSession
from app.core.errors import NotFoundError
from app.modules.experiences import search as search_mod
from app.modules.experiences import service
from app.modules.experiences.schemas import ExperienceDetail, SearchOut
from app.modules.users.models import User

router = APIRouter(prefix="/experiences", tags=["experiences"])


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
    response.headers["Cache-Control"] = "public, s-maxage=60, stale-while-revalidate=300"
    return SearchOut(items=items, total=total, limit=limit, offset=offset)


@router.get("/{experience_id}", response_model=ExperienceDetail)
async def get_experience(
    experience_id: UUID, response: Response, session: DbSession
) -> ExperienceDetail:
    exp = await service.get(session, experience_id)
    host = await session.get(User, exp.host_id)
    if host is None:
        raise NotFoundError("host not found")
    response.headers["Cache-Control"] = "public, s-maxage=60, stale-while-revalidate=300"
    return await service.to_detail(exp, host)
