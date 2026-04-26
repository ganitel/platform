"""HTTP endpoints for the current user (`/me`). Authentication is
enforced via the `CurrentUser` dependency, which verifies a Clerk JWT
and resolves to a local `User` row."""

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.modules.users.schemas import UpdateMe, UserMe
from app.modules.users.service import update_me

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserMe)
async def get_me(user: CurrentUser) -> UserMe:
    return UserMe.model_validate(user)


@router.patch("/me", response_model=UserMe)
async def patch_me(patch: UpdateMe, user: CurrentUser, session: DbSession) -> UserMe:
    updated = await update_me(session, user, patch)
    await session.commit()
    return UserMe.model_validate(updated)
