"""Reusable FastAPI dependencies.

Exposes typed aliases (`DbSession`, `CurrentUser`, `OptionalUser`)
so route signatures stay short and consistent. Authentication is
sourced from a better-auth JWT in the `Authorization` header."""

import logging
from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import verify_jwt
from app.core.db import get_session
from app.core.errors import AppError, AuthError, ForbiddenError
from app.modules.users.models import User
from app.modules.users.service import get_or_create_from_jwt

log = logging.getLogger(__name__)

DbSession = Annotated[AsyncSession, Depends(get_session)]


async def _resolve(authorization: str | None, session: AsyncSession) -> User | None:
    if not authorization:
        log.warning("auth.reject reason=missing_authorization_header")
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        log.warning("auth.reject reason=malformed_authorization_header")
        return None
    try:
        claims = verify_jwt(token)
    except AppError as e:
        log.warning("auth.reject reason=jwt_invalid code=%s", e.code)
        return None
    return await get_or_create_from_jwt(session, claims)


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
        raise AuthError(code="auth.required")
    if user.status != "active":
        raise ForbiddenError(code="account.inactive")
    return user


async def current_admin(user: Annotated[User, Depends(current_user)]) -> User:
    if not user.is_admin:
        raise ForbiddenError(code="admin.required")
    return user


CurrentUser = Annotated[User, Depends(current_user)]
CurrentAdmin = Annotated[User, Depends(current_admin)]
OptionalUser = Annotated[User | None, Depends(optional_user)]
