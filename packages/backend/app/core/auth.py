"""JWT verification.

The backend never issues tokens. It verifies session JWTs against an
external auth provider's JWKS endpoint (Supabase Auth, better-auth,
Clerk, etc.). Configure JWT_JWKS_URL and JWT_ISSUER in .env.
"""

from dataclasses import dataclass
from typing import Any

import jwt
from jwt import PyJWKClient

from app.core.config import get_settings
from app.core.errors import AuthError

_jwks_client: PyJWKClient | None = None


@dataclass(frozen=True)
class AuthClaims:
    user_id: str
    email: str | None
    phone: str | None
    name: str | None
    raw: dict[str, Any]


def _client() -> PyJWKClient:
    global _jwks_client
    settings = get_settings()
    if not settings.JWT_JWKS_URL:
        raise AuthError("auth not configured")
    if _jwks_client is None:
        _jwks_client = PyJWKClient(settings.JWT_JWKS_URL, cache_keys=True, lifespan=3600)
    return _jwks_client


def verify_jwt(token: str) -> AuthClaims:
    settings = get_settings()
    try:
        signing_key = _client().get_signing_key_from_jwt(token).key
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=settings.JWT_ISSUER,
            options={"verify_aud": False},
        )
    except jwt.InvalidTokenError as e:
        raise AuthError("invalid token") from e
    sub = claims.get("sub")
    if not sub:
        raise AuthError("token missing sub")

    email: str | None = claims.get("email")
    phone: str | None = claims.get("phone_number") or claims.get("phoneNumber")
    name: str | None = claims.get("name")

    return AuthClaims(
        user_id=str(sub),
        email=email,
        phone=phone,
        name=name,
        raw=claims,
    )
