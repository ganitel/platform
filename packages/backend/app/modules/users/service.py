"""User domain operations: mirror better-auth identities into our DB on
first sign-in, look up by auth user ID, and apply patches from `/me`."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthClaims
from app.modules.users.models import User
from app.modules.users.schemas import UpdateMe


async def get_by_auth_user_id(session: AsyncSession, auth_user_id: str) -> User | None:
    return (
        await session.execute(select(User).where(User.auth_user_id == auth_user_id))
    ).scalar_one_or_none()


async def get_or_create_from_jwt(session: AsyncSession, claims: AuthClaims) -> User:
    user = await get_by_auth_user_id(session, claims.user_id)
    if user is not None:
        return user
    # Phone-only users: name claim is the raw phone number — start blank so
    # the frontend redirects them to /complete-profile to collect a real name.
    raw_name = claims.name or ""
    is_phone_placeholder = raw_name.startswith("+") or raw_name.replace(" ", "").isdigit()
    display_name = "" if is_phone_placeholder else raw_name
    user = User(
        auth_user_id=claims.user_id,
        email=claims.email,
        phone=claims.phone,
        display_name=display_name,
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
