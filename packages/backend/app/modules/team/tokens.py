"""Signed tokens for one-click admin review links.

Each link in the notification email carries a JWT that encodes the
`team_member_id` plus the admin email it was sent to. Backend verifies the
token before exposing the review/approve/reject endpoints — possession of
the link is the auth, no Clerk session required."""

import time
from uuid import UUID

import jwt

from app.core.config import get_settings
from app.core.errors import AuthError

ALGORITHM = "HS256"
AUDIENCE = "team-review"


def mint(*, team_member_id: UUID, admin_email: str) -> str:
    s = get_settings()
    now = int(time.time())
    payload = {
        "sub": str(team_member_id),
        "admin": admin_email,
        "aud": AUDIENCE,
        "iat": now,
        "exp": now + s.TEAM_REVIEW_TOKEN_TTL_SECONDS,
    }
    return jwt.encode(payload, s.TEAM_REVIEW_SECRET, algorithm=ALGORITHM)


def verify(token: str, *, team_member_id: UUID) -> str:
    """Returns the admin email encoded in the token. Raises AuthError on
    expiry / signature / audience / subject mismatch."""
    s = get_settings()
    try:
        payload = jwt.decode(
            token,
            s.TEAM_REVIEW_SECRET,
            algorithms=[ALGORITHM],
            audience=AUDIENCE,
        )
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid or expired review token") from exc

    if payload.get("sub") != str(team_member_id):
        raise AuthError("Review token does not match this team member")

    admin = payload.get("admin")
    if not isinstance(admin, str):
        raise AuthError("Review token missing admin claim")
    return admin
