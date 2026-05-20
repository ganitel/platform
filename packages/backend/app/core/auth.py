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
        raise AuthError(code="auth.not_configured")
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
            algorithms=["RS256", "ES256"],
            issuer=settings.JWT_ISSUER,
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError as e:
        raise AuthError(code="token.expired") from e
    except jwt.InvalidIssuerError as e:
        raise AuthError(code="token.invalid_issuer") from e
    except jwt.InvalidSignatureError as e:
        raise AuthError(code="token.invalid_signature") from e
    except jwt.InvalidTokenError as e:
        raise AuthError(code="token.invalid") from e
    sub = claims.get("sub")
    if not sub:
        raise AuthError(code="token.missing_sub")

    # Supabase Auth puts the user's phone in the top-level `phone` claim and
    # frequently emits `""` for fields it doesn't have (e.g. `email` for a
    # phone-only user). Normalize blanks to None so we never persist them and
    # break `EmailStr | None` validation on the way back out.
    email: str | None = claims.get("email") or None
    phone: str | None = claims.get("phone") or None
    name: str | None = claims.get("name") or None

    return AuthClaims(
        user_id=str(sub),
        email=email,
        phone=phone,
        name=name,
        raw=claims,
    )
