from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.team.models import TeamMember
from app.modules.team.schemas import TeamRole


async def list_active(session: AsyncSession, role: TeamRole | None = None) -> Sequence[TeamMember]:
    stmt = select(TeamMember).where(TeamMember.is_active.is_(True))
    if role is not None:
        stmt = stmt.where(TeamMember.role == role)
    stmt = stmt.order_by(TeamMember.display_order, TeamMember.created_at)
    result = await session.execute(stmt)
    return result.scalars().all()
