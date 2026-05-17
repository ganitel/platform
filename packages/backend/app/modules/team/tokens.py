"""Signed tokens for one-click admin review links.

Each link in the notification email carries a JWT that encodes the
`team_member_id` plus the admin email it was sent to. Backend verifies the
token before exposing the review/approve/reject endpoints — possession of
the link is the auth, no Clerk session required."""

import time
from uuid import UUID

import jwt

from app.core.config import DEFAULT_TEAM_REVIEW_SECRET, get_settings
from app.core.errors import AuthError, ConfigurationError

ALGORITHM = "HS256"
AUDIENCE = "team-review"


def _signing_secret() -> str:
    s = get_settings()
    if s.ENVIRONMENT == "production" and (
        not s.TEAM_REVIEW_SECRET.strip()
        or s.TEAM_REVIEW_SECRET == DEFAULT_TEAM_REVIEW_SECRET
    ):
        raise ConfigurationError(code="team_review_secret.unconfigured")
    return s.TEAM_REVIEW_SECRET


def mint(*, team_member_id: UUID, admin_email: str) -> str:
    s = get_settings()
    now = int(time.time())
    payload = {
        "sub": str(team_member_id),
        # Normalize the admin claim so the token is byte-identical regardless
        # of casing on the way in. assert_admin_active also lower-cases on
        # lookup, but stamping the canonical form here means the JWT itself
        # never carries case-sensitive surprise.
        "admin": admin_email.strip().lower(),
        "aud": AUDIENCE,
        "iat": now,
        "exp": now + s.TEAM_REVIEW_TOKEN_TTL_SECONDS,
    }
    return jwt.encode(payload, _signing_secret(), algorithm=ALGORITHM)


def verify(token: str, *, team_member_id: UUID) -> str:
    """Returns the admin email encoded in the token. Raises AuthError on
    expiry / signature / audience / subject mismatch."""
    try:
        payload = jwt.decode(
            token,
            _signing_secret(),
            algorithms=[ALGORITHM],
            audience=AUDIENCE,
        )
    except jwt.PyJWTError as exc:
        raise AuthError(code="review_token.invalid") from exc

    if payload.get("sub") != str(team_member_id):
        raise AuthError(code="review_token.subject_mismatch")

    admin = payload.get("admin")
    if not isinstance(admin, str):
        raise AuthError(code="review_token.missing_admin")
    return admin
