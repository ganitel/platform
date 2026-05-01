"""better-auth JWT verification.

The backend never issues tokens. It verifies better-auth JWTs against the
app's own JWKS endpoint exposed by better-auth's jwt plugin at /api/auth/jwks.

Configure BETTER_AUTH_JWKS_URL and BETTER_AUTH_ISSUER in .env.
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
    if not settings.BETTER_AUTH_JWKS_URL:
        raise AuthError("better-auth not configured")
    if _jwks_client is None:
        _jwks_client = PyJWKClient(settings.BETTER_AUTH_JWKS_URL, cache_keys=True, lifespan=3600)
    return _jwks_client


def verify_jwt(token: str) -> AuthClaims:
    settings = get_settings()
    try:
        signing_key = _client().get_signing_key_from_jwt(token).key
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=settings.BETTER_AUTH_ISSUER,
            options={"verify_aud": False},
        )
    except jwt.InvalidTokenError as e:
        raise AuthError("invalid token") from e
    sub = claims.get("sub")
    if not sub:
        raise AuthError("token missing sub")

    # Phone users get a synthetic email (<digits>@phone.ganitel.local).
    # Extract the real phone number from it; don't persist the synthetic address.
    email: str | None = claims.get("email")
    phone: str | None = claims.get("phoneNumber")
    if email and email.endswith("@phone.ganitel.local") and not phone:
        phone = "+" + email.split("@")[0].lstrip("+")
        email = None

    return AuthClaims(
        user_id=str(sub),
        email=email,
        phone=phone,
        name=claims.get("name"),
        raw=claims,
    )
