from fastapi import APIRouter, Query

from app.core.deps import DbSession
from app.modules.team import service
from app.modules.team.schemas import TeamMemberOut, TeamRole

router = APIRouter(prefix="/team-members", tags=["team"])


@router.get("", response_model=list[TeamMemberOut])
async def list_team_members(
    session: DbSession,
    role: TeamRole | None = Query(default=None),
) -> list[TeamMemberOut]:
    members = await service.list_active(session, role=role)
    return [TeamMemberOut.model_validate(m) for m in members]
