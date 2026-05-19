"""Admin-only HTTP endpoints for properties. Gated by the CurrentAdmin
dep so the contract lives in the route signature, not inline checks.

Status-transition endpoints (publish / unpublish / remove) remain in
`properties/routes.py` because they're owner-or-admin, not admin-only.
"""

import asyncio
from typing import Annotated

from fastapi import APIRouter, Query

from app.core.deps import CurrentAdmin, DbSession
from app.modules.properties import service
from app.modules.properties.models import PropertyStatus
from app.modules.properties.schemas import AdminListOut

router = APIRouter(prefix="/admin/properties", tags=["properties", "admin"])


@router.get("", response_model=AdminListOut)
async def admin_list_properties(
    admin: CurrentAdmin,
    session: DbSession,
    status: Annotated[list[PropertyStatus] | None, Query()] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> AdminListOut:
    statuses = tuple(status) if status else ()
    rows = await service.list_all_for_admin(session, statuses=statuses, limit=limit, offset=offset)
    total = await service.count_all_for_admin(session, statuses=statuses)
    items = await asyncio.gather(*(service.to_admin_list_item(p) for p in rows))
    return AdminListOut(items=list(items), total=total, limit=limit, offset=offset)
