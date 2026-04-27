"""Clerk-issued JWT verification.

The backend never issues tokens. It verifies Clerk session JWTs against Clerk's
published JWKs and trusts the resulting claims as the user's identity.

Configure your Clerk session template to include `name`, `email`, and
`phone_number` as custom claims so we can mirror them on first sign-in
without an extra round-trip to Clerk's user API.
"""

from dataclasses import dataclass
from typing import Any

import jwt
from jwt import PyJWKClient

from app.core.config import get_settings
from app.core.errors import AuthError

_jwks_client: PyJWKClient | None = None


@dataclass(frozen=True)
class ClerkClaims:
    user_id: str
    email: str | None
    phone: str | None
    name: str | None
    raw: dict[str, Any]


def _client() -> PyJWKClient:
    global _jwks_client
    settings = get_settings()
    if not settings.CLERK_JWKS_URL:
        raise AuthError("clerk not configured")
    if _jwks_client is None:
        _jwks_client = PyJWKClient(settings.CLERK_JWKS_URL, cache_keys=True, lifespan=3600)
    return _jwks_client


def verify_clerk_jwt(token: str) -> ClerkClaims:
    settings = get_settings()
    try:
        signing_key = _client().get_signing_key_from_jwt(token).key
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
            options={"verify_aud": False},
        )
    except jwt.InvalidTokenError as e:
        raise AuthError("invalid token") from e
    sub = claims.get("sub")
    if not sub:
        raise AuthError("token missing sub")
    return ClerkClaims(
        user_id=str(sub),
        email=claims.get("email"),
        phone=claims.get("phone_number") or claims.get("phone"),
        name=claims.get("name"),
        raw=claims,
    )
