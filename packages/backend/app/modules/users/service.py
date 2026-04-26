"""User domain operations: mirror Clerk identities into our DB on first
sign-in, look up by Clerk ID, and apply patches from `/me`. Routes
stay thin; business rules live here."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import ClerkClaims
from app.modules.users.models import User
from app.modules.users.schemas import UpdateMe


async def get_by_clerk_id(session: AsyncSession, clerk_user_id: str) -> User | None:
    return (
        await session.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    ).scalar_one_or_none()


async def get_or_create_from_clerk(session: AsyncSession, claims: ClerkClaims) -> User:
    user = await get_by_clerk_id(session, claims.user_id)
    if user is not None:
        return user
    user = User(
        clerk_user_id=claims.user_id,
        email=claims.email,
        phone=claims.phone,
        display_name=claims.name or f"User-{claims.user_id[-6:]}",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def update_me(session: AsyncSession, user: User, patch: UpdateMe) -> User:
    if patch.display_name is not None:
        user.display_name = patch.display_name
    if patch.language is not None:
        user.language = patch.language
    if patch.avatar_url is not None:
        user.avatar_url = patch.avatar_url
    await session.commit()
    await session.refresh(user)
    return user
