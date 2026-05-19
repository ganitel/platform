"""Admin-only HTTP endpoints for experiences. Gated by the CurrentAdmin
dep so the contract lives in the route signature, not inline checks.

Status-transition endpoints (publish / unpublish / remove) remain in
`experiences/routes.py` because they're owner-or-admin, not admin-only.
"""

import asyncio
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.deps import CurrentAdmin, DbSession
from app.modules.experiences import service
from app.modules.experiences.models import ExperienceStatus
from app.modules.experiences.schemas import AdminListOut

router = APIRouter(prefix="/admin/experiences", tags=["experiences", "admin"])


@router.get("", response_model=AdminListOut)
async def admin_list_experiences(
    admin: CurrentAdmin,
    session: DbSession,
    status: Annotated[list[ExperienceStatus] | None, Query()] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> AdminListOut:
    statuses = tuple(status) if status else ()
    rows = await service.list_all_for_admin(session, statuses=statuses, limit=limit, offset=offset)
    total = await service.count_all_for_admin(session, statuses=statuses)
    items = await asyncio.gather(*(service.to_admin_list_item(e) for e in rows))
    return AdminListOut(items=list(items), total=total, limit=limit, offset=offset)
