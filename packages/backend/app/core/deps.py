"""Reusable FastAPI dependencies.

Exposes typed aliases (`DbSession`, `CurrentUser`, `OptionalUser`)
so route signatures stay short and consistent. Authentication is
sourced from a Clerk JWT in the `Authorization` header."""

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import verify_clerk_jwt
from app.core.db import get_session
from app.core.errors import AppError, AuthError, ForbiddenError
from app.modules.users.models import User
from app.modules.users.service import get_or_create_from_clerk

DbSession = Annotated[AsyncSession, Depends(get_session)]


async def _resolve(authorization: str | None, session: AsyncSession) -> User | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    try:
        claims = verify_clerk_jwt(token)
    except AppError:
        return None
    return await get_or_create_from_clerk(session, claims)


async def optional_user(
    session: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User | None:
    return await _resolve(authorization, session)


async def current_user(
    session: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    user = await _resolve(authorization, session)
    if user is None:
        raise AuthError("authentication required")
    if user.status != "active":
        raise ForbiddenError(f"account is {user.status}")
    return user


CurrentUser = Annotated[User, Depends(current_user)]
OptionalUser = Annotated[User | None, Depends(optional_user)]
