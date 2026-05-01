# Better Auth Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Clerk with better-auth, supporting Phone OTP (Twilio) and Google OAuth, while keeping the FastAPI backend's existing JWKS-based JWT verification pattern intact.

**Architecture:** better-auth runs in the React Router Node.js SSR process, exposing `/api/auth/*` via a catch-all route. Its JWT plugin exposes `/api/auth/jwks`. The Python backend switches JWKS URL from Clerk's endpoint to the app's own. The Vite proxy is updated to not forward `/api/auth/*` to FastAPI, so better-auth handles those routes. The app's `users` table renames `clerk_user_id` → `auth_user_id`.

**Tech Stack:** better-auth 1.6.9 (already installed), pg (already installed), jwtClient + phoneNumberClient (already bundled in better-auth/client/plugins), Twilio via raw fetch (no extra package), React Hook Form + Zod + input-otp (already installed)

---

## File Map

### Backend (packages/backend)

| File | Action |
|------|--------|
| `app/core/config.py` | Modify — rename CLERK_* → BETTER_AUTH_* |
| `app/core/auth.py` | Modify — rename ClerkClaims → AuthClaims, verify_clerk_jwt → verify_jwt |
| `app/core/deps.py` | Modify — update imports |
| `app/modules/users/models.py` | Modify — clerk_user_id → auth_user_id |
| `app/modules/users/service.py` | Modify — rename functions + field refs |
| `migrations/versions/0006_rename_clerk_to_auth.py` | Create — Alembic migration |
| `scripts/seed_demo.py` | Modify — clerk_user_id → auth_user_id |
| `.env.example` | Modify — swap Clerk vars |
| `tests/unit/test_auth.py` | Create — unit tests for verify_jwt |

### Frontend (packages/frontend)

| File | Action |
|------|--------|
| `package.json` | Modify — remove @clerk/* packages |
| `vite.config.ts` | Modify — exclude /api/auth from proxy |
| `react-router.config.ts` | Modify — remove v8_middleware |
| `client/shared/lib/env.ts` | Modify — remove clerkPublishableKey |
| `client/lib/auth.server.ts` | Create — better-auth server instance |
| `client/lib/auth-client.ts` | Create — better-auth React client |
| `client/routes/api.auth.$.ts` | Create — catch-all auth route handler |
| `client/root.tsx` | Modify — remove ClerkProvider + Clerk middleware |
| `client/entry.client.tsx` | Modify — use authClient.token() |
| `client/shared/api/server.ts` | Modify — add getServerToken helper |
| `client/features/auth/components/phone-login.tsx` | Create — phone OTP UI |
| `client/features/auth/components/google-button.tsx` | Create — Google OAuth button |
| `client/features/auth/components/user-menu.tsx` | Create — replaces \<UserButton /\> |
| `client/features/auth/components/clerk-appearance.ts` | Delete |
| `client/features/auth/hooks/use-me.ts` | Modify — replace Clerk useAuth |
| `client/routes/sign-in.tsx` | Modify — custom phone+google UI |
| `client/routes/sign-up.tsx` | Modify — redirect to sign-in |
| `client/routes/complete-profile.tsx` | Create — name collection for phone users |
| `client/shared/components/header.tsx` | Modify — replace useAuth + UserButton |
| `client/routes/profile.tsx` | Modify — replace getAuth() |
| `client/routes/bookings.tsx` | Modify — replace getAuth() |
| `.env.example` | Modify — swap Clerk vars |

---

## Task 1: Backend — rename config

**Files:**
- Modify: `packages/backend/app/core/config.py`

- [ ] **Replace CLERK vars with BETTER_AUTH vars in config.py**

Replace lines 93-95 of `packages/backend/app/core/config.py`:

```python
    # better-auth — backend only verifies tokens.
    BETTER_AUTH_JWKS_URL: str | None = None
    BETTER_AUTH_ISSUER: str | None = None  # e.g. http://localhost:3000
```

Replace the old docstring at the top of the file (line 1-6) comment block:

```python
"""Application settings loaded from env via pydantic-settings.

`get_settings()` is cached and is the single source of truth for
config. Anything that varies by environment (DB URL, better-auth JWKS,
CORS origins, payment provider keys, …) belongs here."""
```

- [ ] **Commit**

```bash
cd packages/backend
git add app/core/config.py
git commit -m "refactor(config): rename CLERK_* to BETTER_AUTH_*"
```

---

## Task 2: Backend — rename auth module

**Files:**
- Modify: `packages/backend/app/core/auth.py`
- Create: `packages/backend/tests/unit/test_auth.py`

- [ ] **Write the failing test first**

Create `packages/backend/tests/unit/test_auth.py`:

```python
"""Unit tests for verify_jwt — pure logic, no I/O (PyJWKClient is mocked)."""

from dataclasses import asdict
from unittest.mock import MagicMock, patch

import jwt
import pytest

from app.core.errors import AuthError


# ---------- helpers ----------


def _make_signing_key(private_key):
    """Return a mock signing key that carries the private_key as .key."""
    mock = MagicMock()
    mock.key = private_key
    return mock


# ---------- tests ----------


def test_auth_claims_fields() -> None:
    """AuthClaims must expose user_id, email, phone, name."""
    from app.core.auth import AuthClaims

    c = AuthClaims(user_id="uid", email="a@b.com", phone="+1", name="Bob", raw={})
    assert c.user_id == "uid"
    assert c.email == "a@b.com"
    assert c.phone == "+1"
    assert c.name == "Bob"


def test_verify_jwt_extracts_claims(rsa_keypair) -> None:
    """verify_jwt returns AuthClaims with correct fields from a valid RS256 JWT."""
    from app.core.auth import verify_jwt

    private_key, public_key = rsa_keypair
    token = jwt.encode(
        {"sub": "abc123", "email": "x@y.com", "phoneNumber": "+237600000000", "name": "Alice", "iss": "http://localhost:3000"},
        private_key,
        algorithm="RS256",
    )

    mock_jwks = MagicMock()
    mock_jwks.get_signing_key_from_jwt.return_value = _make_signing_key(public_key)

    with patch("app.core.auth._client", return_value=mock_jwks), \
         patch("app.core.auth.get_settings") as mock_settings:
        mock_settings.return_value.BETTER_AUTH_JWKS_URL = "http://localhost:3000/api/auth/jwks"
        mock_settings.return_value.BETTER_AUTH_ISSUER = "http://localhost:3000"
        claims = verify_jwt(token)

    assert claims.user_id == "abc123"
    assert claims.email == "x@y.com"
    assert claims.phone == "+237600000000"
    assert claims.name == "Alice"


def test_verify_jwt_raises_on_missing_sub(rsa_keypair) -> None:
    from app.core.auth import verify_jwt

    private_key, public_key = rsa_keypair
    token = jwt.encode(
        {"email": "x@y.com", "iss": "http://localhost:3000"},
        private_key,
        algorithm="RS256",
    )

    mock_jwks = MagicMock()
    mock_jwks.get_signing_key_from_jwt.return_value = _make_signing_key(public_key)

    with patch("app.core.auth._client", return_value=mock_jwks), \
         patch("app.core.auth.get_settings") as mock_settings:
        mock_settings.return_value.BETTER_AUTH_JWKS_URL = "http://localhost:3000/api/auth/jwks"
        mock_settings.return_value.BETTER_AUTH_ISSUER = "http://localhost:3000"
        with pytest.raises(AuthError, match="missing sub"):
            verify_jwt(token)


def test_verify_jwt_raises_on_invalid_token() -> None:
    from app.core.auth import verify_jwt

    with patch("app.core.auth._client") as mock_client, \
         patch("app.core.auth.get_settings") as mock_settings:
        mock_settings.return_value.BETTER_AUTH_JWKS_URL = "http://localhost:3000/api/auth/jwks"
        mock_settings.return_value.BETTER_AUTH_ISSUER = "http://localhost:3000"
        mock_client.return_value.get_signing_key_from_jwt.side_effect = jwt.InvalidTokenError("bad")
        with pytest.raises(AuthError, match="invalid token"):
            verify_jwt("not.a.jwt")
```

Add the `rsa_keypair` fixture to `packages/backend/tests/conftest.py`:

```python
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend


@pytest.fixture
def rsa_keypair():
    """Generate a one-time RSA key pair for JWT signing tests."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend(),
    )
    return private_key, private_key.public_key()
```

- [ ] **Run test — expect ImportError on AuthClaims (not yet renamed)**

```bash
cd packages/backend
uv run pytest tests/unit/test_auth.py -v 2>&1 | head -20
```

Expected: FAILED with `ImportError: cannot import name 'AuthClaims'`

- [ ] **Rewrite auth.py**

Replace the entire contents of `packages/backend/app/core/auth.py`:

```python
"""better-auth JWT verification.

The backend never issues tokens. It verifies better-auth JWTs against the
app's own JWKS endpoint (exposed by better-auth's jwt plugin at /api/auth/jwks).

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
    # Extract the phone number from it; don't store the synthetic address.
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
```

- [ ] **Run tests — expect all pass**

```bash
cd packages/backend
uv run pytest tests/unit/test_auth.py -v
```

Expected: 4 tests PASSED

- [ ] **Commit**

```bash
git add app/core/auth.py tests/unit/test_auth.py tests/conftest.py
git commit -m "refactor(auth): replace Clerk JWT verification with better-auth"
```

---

## Task 3: Backend — user model + Alembic migration

**Files:**
- Modify: `packages/backend/app/modules/users/models.py`
- Create: `packages/backend/migrations/versions/0006_rename_clerk_to_auth.py`

- [ ] **Update User model**

In `packages/backend/app/modules/users/models.py`, replace line 1-4 (docstring) and line 18:

```python
"""SQLAlchemy ORM model for the `users` table — the local mirror of a
better-auth identity (linked by `auth_user_id`). Contains profile
fields, role flags (`is_host`, `is_admin`), language, and status."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    auth_user_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(32), index=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="fr")
    is_host: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Create Alembic migration**

Create `packages/backend/migrations/versions/0006_rename_clerk_to_auth.py`:

```python
"""rename clerk_user_id to auth_user_id

Revision ID: 0006_rename_clerk_to_auth
Revises: 0005_experiences
Create Date: 2026-05-01

"""

from collections.abc import Sequence

from alembic import op

revision: str = "0006_rename_clerk_to_auth"
down_revision: str | Sequence[str] | None = "0005_experiences"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_users_clerk_user_id", table_name="users")
    op.alter_column("users", "clerk_user_id", new_column_name="auth_user_id")
    op.create_index("ix_users_auth_user_id", "users", ["auth_user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_auth_user_id", table_name="users")
    op.alter_column("users", "auth_user_id", new_column_name="clerk_user_id")
    op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"], unique=True)
```

- [ ] **Commit**

```bash
cd packages/backend
git add app/modules/users/models.py migrations/versions/0006_rename_clerk_to_auth.py
git commit -m "refactor(users): rename clerk_user_id to auth_user_id"
```

---

## Task 4: Backend — service + deps

**Files:**
- Modify: `packages/backend/app/modules/users/service.py`
- Modify: `packages/backend/app/core/deps.py`

- [ ] **Rewrite service.py**

Replace the entire contents of `packages/backend/app/modules/users/service.py`:

```python
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
```

- [ ] **Rewrite deps.py**

Replace the entire contents of `packages/backend/app/core/deps.py`:

```python
"""Reusable FastAPI dependencies.

Exposes typed aliases (`DbSession`, `CurrentUser`, `OptionalUser`)
so route signatures stay short and consistent. Authentication is
sourced from a better-auth JWT in the `Authorization` header."""

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import verify_jwt
from app.core.db import get_session
from app.core.errors import AppError, AuthError, ForbiddenError
from app.modules.users.models import User
from app.modules.users.service import get_or_create_from_jwt

DbSession = Annotated[AsyncSession, Depends(get_session)]


async def _resolve(authorization: str | None, session: AsyncSession) -> User | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    try:
        claims = verify_jwt(token)
    except AppError:
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
        raise AuthError("authentication required")
    if user.status != "active":
        raise ForbiddenError(f"account is {user.status}")
    return user


CurrentUser = Annotated[User, Depends(current_user)]
OptionalUser = Annotated[User | None, Depends(optional_user)]
```

- [ ] **Run existing unit tests to verify no breakage**

```bash
cd packages/backend
uv run pytest tests/unit/ -v
```

Expected: all tests PASSED (including the 4 new auth tests)

- [ ] **Commit**

```bash
git add app/modules/users/service.py app/core/deps.py
git commit -m "refactor(users): update service and deps to use AuthClaims + auth_user_id"
```

---

## Task 5: Backend — seed script + .env.example

**Files:**
- Modify: `packages/backend/scripts/seed_demo.py`
- Modify: `packages/backend/.env.example`

- [ ] **Update seed_demo.py — replace all clerk_user_id references**

In `packages/backend/scripts/seed_demo.py`:

1. Replace the module docstring's first paragraph (line 1–7):
```python
"""Seed the local DB with a handful of demo hosts, ~10 published
properties, and a handful of published experiences spread across them.

Idempotent: every seed host is identified by an `auth_user_id` prefixed
with `seed_host_` (plus the legacy `seed_demo_host` from the previous
single-host version of this script). On each run we:
```

2. Replace line 53:
```python
LEGACY_HOST_AUTH_IDS: list[str] = ["seed_demo_host"]
```

3. In `SEED_HOSTS`, replace each `"clerk_user_id"` key with `"auth_user_id"`:
```python
SEED_HOSTS: list[dict[str, Any]] = [
    {
        "key": "mvondo",
        "auth_user_id": "seed_host_mvondo",
        ...
    },
    ...
]
```
(Repeat for all 5 hosts: mvondo, ekambi, sow, faye, konan)

4. In function `_upsert_hosts` (around line 510), replace:
```python
        stmt = select(User).where(User.auth_user_id == cfg["auth_user_id"])
        ...
                auth_user_id=cfg["auth_user_id"],
```

5. In `_wipe_seed_data` (around line 587), replace:
```python
    if LEGACY_HOST_AUTH_IDS:
        ...
                    select(User.id).where(User.auth_user_id.in_(LEGACY_HOST_AUTH_IDS))
```

- [ ] **Update .env.example**

In `packages/backend/.env.example`, replace:
```
# Clerk
CLERK_JWKS_URL=
CLERK_ISSUER=
```
with:
```
# better-auth — JWKS URL is the app's own endpoint exposed by the JWT plugin.
# In dev: http://localhost:3000/api/auth/jwks
# BETTER_AUTH_ISSUER must match BETTER_AUTH_URL in the frontend package.
BETTER_AUTH_JWKS_URL=
BETTER_AUTH_ISSUER=
```

- [ ] **Commit**

```bash
cd packages/backend
git add scripts/seed_demo.py .env.example
git commit -m "refactor(seed): rename clerk_user_id to auth_user_id throughout"
```

---

## Task 6: Frontend — remove Clerk packages + fix Vite proxy

**Files:**
- Modify: `packages/frontend/package.json`
- Modify: `packages/frontend/vite.config.ts`
- Modify: `packages/frontend/react-router.config.ts`
- Modify: `packages/frontend/client/shared/lib/env.ts`

- [ ] **Remove Clerk packages**

```bash
cd packages/frontend
bun remove @clerk/react-router @clerk/localizations
```

- [ ] **Update vite.config.ts proxy to exclude /api/auth**

In `packages/frontend/vite.config.ts`, replace the proxy section:

```typescript
    proxy: {
      // Forward all /api/* to FastAPI EXCEPT /api/auth (handled by better-auth).
      "^/api/(?!auth)": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
```

- [ ] **Update react-router.config.ts — remove v8_middleware**

Replace the entire contents of `packages/frontend/react-router.config.ts`:

```typescript
import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "client",
  ssr: true,
} satisfies Config;
```

- [ ] **Update env.ts — remove clerkPublishableKey**

Replace the entire contents of `packages/frontend/client/shared/lib/env.ts`:

```typescript
type ViteEnv = {
  VITE_API_BASE_URL?: string;
  VITE_GOOGLE_MAPS_KEY?: string;
};

const raw = import.meta.env as unknown as ViteEnv;

export const env = {
  apiBaseUrl: raw.VITE_API_BASE_URL || "/api",
  googleMapsKey: raw.VITE_GOOGLE_MAPS_KEY ?? "",
} as const;
```

- [ ] **Commit**

```bash
cd packages/frontend
git add package.json bun.lock vite.config.ts react-router.config.ts client/shared/lib/env.ts
git commit -m "refactor(frontend): remove Clerk packages, fix proxy, drop v8_middleware"
```

---

## Task 7: Frontend — create auth.server.ts

**Files:**
- Create: `packages/frontend/client/lib/auth.server.ts`

- [ ] **Create client/lib/auth.server.ts**

Create `packages/frontend/client/lib/auth.server.ts`:

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { phoneNumber } from "better-auth/plugins";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }) => {
        const accountSid = process.env.TWILIO_ACCOUNT_SID!;
        const authToken = process.env.TWILIO_AUTH_TOKEN!;
        const from = process.env.TWILIO_PHONE_NUMBER!;
        const body = new URLSearchParams({
          From: from,
          To: phone,
          Body: `Votre code Ganitel : ${code}`,
        });
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
          },
        );
        if (!res.ok) {
          const text = await res.text();
          console.error("[twilio] send failed:", res.status, text);
        }
      },
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace(/[^\d]/g, "")}@phone.ganitel.local`,
        getTempName: (phone) => phone,
      },
    }),
    jwt(),
  ],
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});
```

- [ ] **Run better-auth migration to create tables**

Make sure Postgres is running locally, then:

```bash
cd packages/frontend
DATABASE_URL=postgresql://ganitel:ganitel@localhost:5432/ganitel \
BETTER_AUTH_SECRET=replace-with-32-char-secret-string-here \
BETTER_AUTH_URL=http://localhost:3000 \
npx @better-auth/cli migrate
```

Expected output: tables `user`, `session`, `account`, `verification` created (or confirmed already exist), plus additional columns for the phone_number plugin.

- [ ] **Run backend Alembic migration** (renames clerk_user_id → auth_user_id)

```bash
cd packages/backend
uv run alembic upgrade head
```

Expected: `0006_rename_clerk_to_auth` applied successfully.

- [ ] **Commit**

```bash
cd packages/frontend
git add client/lib/auth.server.ts
git commit -m "feat(auth): add better-auth server instance with phone + google + jwt plugins"
```

---

## Task 8: Frontend — create auth-client.ts + api route

**Files:**
- Create: `packages/frontend/client/lib/auth-client.ts`
- Create: `packages/frontend/client/routes/api.auth.$.ts`

- [ ] **Create auth-client.ts**

Create `packages/frontend/client/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";
import { jwtClient, phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [phoneNumberClient(), jwtClient()],
});

// Re-export useStore so consumers don't need to import from better-auth/react directly.
export { useStore } from "better-auth/react";
```

- [ ] **Create api.auth.$.ts route handler**

Create `packages/frontend/client/routes/api.auth.$.ts`:

```typescript
import { auth } from "@/lib/auth.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  return auth.handler(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return auth.handler(request);
}
```

- [ ] **Commit**

```bash
cd packages/frontend
git add client/lib/auth-client.ts client/routes/api.auth.$.ts
git commit -m "feat(auth): add auth client and catch-all route handler"
```

---

## Task 9: Frontend — update root.tsx + entry.client.tsx

**Files:**
- Modify: `packages/frontend/client/root.tsx`
- Modify: `packages/frontend/client/entry.client.tsx`

- [ ] **Rewrite root.tsx — remove ClerkProvider and Clerk middleware**

Replace the entire contents of `packages/frontend/client/root.tsx`:

```typescript
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import type { Route } from "./+types/root";

import { LocaleContext, type Locale } from "@/shared/lib/i18n";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";
import indexCss from "@/styles/index.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: indexCss },
];

export const meta: Route.MetaFunction = () => [
  { charSet: "utf-8" },
  { name: "viewport", content: "width=device-width,initial-scale=1" },
  { name: "theme-color", content: "#18100C" },
  { title: "Ganitel — séjours et expériences" },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-ganitel-paper text-ganitel-text-title antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
  );
  const [locale] = useState<Locale>("fr");

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider value={locale}>
        <TooltipProvider delayDuration={200}>
          <Outlet />
          <Toaster />
        </TooltipProvider>
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isResponse = isRouteErrorResponse(error);
  const status = isResponse ? error.status : 500;
  const heading = isResponse
    ? error.statusText || `Erreur ${status}`
    : "Une erreur s'est produite";
  const detail =
    isResponse && typeof error.data === "string"
      ? error.data
      : import.meta.env.DEV && error instanceof Error
        ? error.message
        : "Veuillez réessayer plus tard.";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-infoma text-7xl text-ganitel-text-title">{status}</p>
      <h1 className="mt-4 text-xl font-semibold text-ganitel-text-title">{heading}</h1>
      <p className="mt-2 text-sm text-ganitel-text-subtitle">{detail}</p>
    </main>
  );
}
```

- [ ] **Rewrite entry.client.tsx — use authClient.token()**

Replace the entire contents of `packages/frontend/client/entry.client.tsx`:

```typescript
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { setAuthTokenGetter } from "@/shared/api/client";
import { authClient } from "@/lib/auth-client";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});

setAuthTokenGetter(async () => {
  const { data } = await authClient.token();
  return data?.token ?? null;
});
```

- [ ] **Commit**

```bash
cd packages/frontend
git add client/root.tsx client/entry.client.tsx
git commit -m "refactor(root): remove ClerkProvider, wire better-auth token getter"
```

---

## Task 10: Frontend — update server.ts with getServerToken

**Files:**
- Modify: `packages/frontend/client/shared/api/server.ts`

- [ ] **Add getServerToken to server.ts**

Replace the entire contents of `packages/frontend/client/shared/api/server.ts`:

```typescript
/**
 * Server-only fetch helper for route `loader` / `action` functions.
 *
 * Routes use `getServerToken(request)` to obtain a short-lived JWT from
 * better-auth, then pass it to `serverFetch` for authenticated backend calls.
 * Uses `auth.handler` directly (no HTTP round-trip).
 */

import { auth } from "@/lib/auth.server";

const baseUrl = (
  globalThis.process?.env?.INTERNAL_API_URL ?? "http://localhost:8000/api"
).replace(/\/+$/, "");

export interface ServerFetchOptions extends RequestInit {
  token?: string | null;
}

export class ServerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

export async function getServerToken(request: Request): Promise<string | null> {
  const tokenUrl = new URL(
    "/api/auth/token",
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  ).toString();
  const tokenReq = new Request(tokenUrl, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  const res = await auth.handler(tokenReq);
  if (!res.ok) return null;
  const data = (await res.json()) as { token?: string };
  return data.token ?? null;
}

export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { token, headers, ...init } = options;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");
  if (init.body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers: finalHeaders });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore — non-JSON error body
    }
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : res.statusText || "request failed";
    throw new ServerApiError(detail, res.status, body);
  }

  return res.json() as Promise<T>;
}
```

- [ ] **Commit**

```bash
cd packages/frontend
git add client/shared/api/server.ts
git commit -m "feat(server): add getServerToken helper using better-auth handler directly"
```

---

## Task 11: Frontend — build auth UI components

**Files:**
- Create: `packages/frontend/client/features/auth/components/phone-login.tsx`
- Create: `packages/frontend/client/features/auth/components/google-button.tsx`

- [ ] **Create phone-login.tsx**

Create `packages/frontend/client/features/auth/components/phone-login.tsx`:

```typescript
import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OTPInput, REGEXP_ONLY_DIGITS } from "input-otp";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

const phoneSchema = z.object({
  phoneNumber: z.string().min(8, "Numéro invalide"),
});

const otpSchema = z.object({
  code: z.string().length(6, "Code à 6 chiffres requis"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export function PhoneLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: "" },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  async function sendOtp({ phoneNumber }: PhoneForm) {
    setServerError(null);
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber });
    if (error) {
      setServerError(error.message ?? "Impossible d'envoyer le code.");
      return;
    }
    setPhone(phoneNumber);
    setStep("otp");
  }

  async function verifyOtp({ code }: OtpForm) {
    setServerError(null);
    const { error } = await authClient.phoneNumber.verify({ phoneNumber: phone, code });
    if (error) {
      setServerError(error.message ?? "Code invalide.");
      return;
    }
    navigate("/");
  }

  if (step === "otp") {
    return (
      <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="flex flex-col gap-5">
        <p className="text-sm text-ganitel-text-subtitle">
          Code envoyé au <span className="font-medium text-ganitel-text-title">{phone}</span>
        </p>

        <div className="flex justify-center">
          <OTPInput
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            onChange={(val) => otpForm.setValue("code", val)}
            render={({ slots }) => (
              <div className="flex gap-2">
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className="flex h-12 w-10 items-center justify-center rounded-lg border border-ganitel-stroke-neutral bg-ganitel-paper text-lg font-semibold text-ganitel-text-title focus-within:border-ganitel-text-title"
                  >
                    {slot.char ?? <span className="text-ganitel-text-placeholder">·</span>}
                    {slot.hasFakeCaret && <span className="animate-caret-blink">|</span>}
                  </div>
                ))}
              </div>
            )}
          />
        </div>

        {(otpForm.formState.errors.code || serverError) && (
          <p className="text-center text-sm text-red-500">
            {otpForm.formState.errors.code?.message ?? serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={otpForm.formState.isSubmitting}
          className="w-full rounded-lg bg-ganitel-text-title py-3 text-sm font-semibold text-ganitel-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {otpForm.formState.isSubmitting ? "Vérification…" : "Confirmer"}
        </button>

        <button
          type="button"
          onClick={() => setStep("phone")}
          className="text-center text-xs text-ganitel-text-subtitle underline-offset-2 hover:underline"
        >
          Modifier le numéro
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={phoneForm.handleSubmit(sendOtp)} className="flex flex-col gap-4">
      <div>
        <label htmlFor="phoneNumber" className="mb-1.5 block text-xs font-medium text-ganitel-text-subtitle">
          Numéro de téléphone
        </label>
        <input
          id="phoneNumber"
          type="tel"
          placeholder="+237 6XX XXX XXX"
          {...phoneForm.register("phoneNumber")}
          className="w-full rounded-lg border border-ganitel-stroke-neutral bg-ganitel-paper px-4 py-3 text-sm text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-text-title focus:outline-none"
        />
        {phoneForm.formState.errors.phoneNumber && (
          <p className="mt-1 text-xs text-red-500">{phoneForm.formState.errors.phoneNumber.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <button
        type="submit"
        disabled={phoneForm.formState.isSubmitting}
        className="w-full rounded-lg bg-ganitel-text-title py-3 text-sm font-semibold text-ganitel-paper transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {phoneForm.formState.isSubmitting ? "Envoi…" : "Recevoir le code"}
      </button>
    </form>
  );
}
```

- [ ] **Create google-button.tsx**

Create `packages/frontend/client/features/auth/components/google-button.tsx`:

```typescript
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-ganitel-stroke-neutral bg-ganitel-paper px-4 py-3 text-sm font-medium text-ganitel-text-title transition-colors hover:bg-ganitel-background-neutral1 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {loading ? "Redirection…" : "Continuer avec Google"}
    </button>
  );
}
```

- [ ] **Commit**

```bash
cd packages/frontend
git add client/features/auth/components/phone-login.tsx client/features/auth/components/google-button.tsx
git commit -m "feat(auth): add PhoneLogin and GoogleButton components"
```

---

## Task 12: Frontend — rewrite sign-in.tsx, sign-up.tsx, complete-profile.tsx

**Files:**
- Modify: `packages/frontend/client/routes/sign-in.tsx`
- Modify: `packages/frontend/client/routes/sign-up.tsx`
- Create: `packages/frontend/client/routes/complete-profile.tsx`
- Delete: `packages/frontend/client/features/auth/components/clerk-appearance.ts`

- [ ] **Rewrite sign-in.tsx**

Replace the entire contents of `packages/frontend/client/routes/sign-in.tsx`:

```typescript
import { useState } from "react";

import type { Route } from "./+types/sign-in";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { PhoneLogin } from "@/features/auth/components/phone-login";
import { GoogleButton } from "@/features/auth/components/google-button";

export const meta: Route.MetaFunction = () => [
  { title: "Connexion — Ganitel" },
  { name: "robots", content: "noindex" },
];

type Tab = "phone" | "google";

export default function SignInPage() {
  const [tab, setTab] = useState<Tab>("phone");

  return (
    <AuthLayout title="Bienvenue" subtitle="Connexion">
      <div className="flex flex-col gap-6">
        {/* Tab switcher */}
        <div className="flex rounded-lg border border-ganitel-stroke-neutral p-1">
          {(["phone", "google"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-ganitel-text-title text-ganitel-paper"
                  : "text-ganitel-text-subtitle hover:text-ganitel-text-title",
              ].join(" ")}
            >
              {t === "phone" ? "Téléphone" : "Google"}
            </button>
          ))}
        </div>

        {tab === "phone" ? <PhoneLogin /> : <GoogleButton />}
      </div>
    </AuthLayout>
  );
}
```

- [ ] **Rewrite sign-up.tsx — redirect to sign-in**

Phone OTP is sign-up and sign-in in one flow. Replace `packages/frontend/client/routes/sign-up.tsx`:

```typescript
import { redirect } from "react-router";

export function loader() {
  return redirect("/sign-in");
}

export default function SignUpPage() {
  return null;
}
```

- [ ] **Create complete-profile.tsx**

Create `packages/frontend/client/routes/complete-profile.tsx`:

```typescript
import { redirect } from "react-router";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { Route } from "./+types/complete-profile";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { getServerToken, serverFetch } from "@/shared/api/server";
import { patchMe } from "@/features/auth/api/me";
import type { UserMe } from "@/features/auth/api/me";

export const meta: Route.MetaFunction = () => [
  { title: "Votre profil — Ganitel" },
  { name: "robots", content: "noindex" },
];

const schema = z.object({
  display_name: z.string().min(2, "Minimum 2 caractères"),
});

type FormData = z.infer<typeof schema>;

export async function loader(args: Route.LoaderArgs) {
  const token = await getServerToken(args.request);
  if (!token) return redirect("/sign-in");
  const me = await serverFetch<UserMe>("/me", { token });
  // Already has a name — no need for this page.
  if (me.display_name) return redirect("/");
  return null;
}

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit({ display_name }: FormData) {
    try {
      await patchMe({ display_name });
      navigate("/");
    } catch {
      setError("display_name", { message: "Erreur lors de la mise à jour." });
    }
  }

  return (
    <AuthLayout title="Votre prénom" subtitle="Profil">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <p className="text-sm text-ganitel-text-subtitle">
          Comment souhaitez-vous être appelé·e sur Ganitel ?
        </p>

        <div>
          <label htmlFor="display_name" className="mb-1.5 block text-xs font-medium text-ganitel-text-subtitle">
            Prénom ou pseudonyme
          </label>
          <input
            id="display_name"
            type="text"
            placeholder="Jean-Paul"
            {...register("display_name")}
            className="w-full rounded-lg border border-ganitel-stroke-neutral bg-ganitel-paper px-4 py-3 text-sm text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-text-title focus:outline-none"
          />
          {errors.display_name && (
            <p className="mt-1 text-xs text-red-500">{errors.display_name.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-ganitel-text-title py-3 text-sm font-semibold text-ganitel-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Enregistrement…" : "Continuer"}
        </button>
      </form>
    </AuthLayout>
  );
}
```

- [ ] **Delete clerk-appearance.ts**

```bash
rm packages/frontend/client/features/auth/components/clerk-appearance.ts
```

- [ ] **Commit**

```bash
cd packages/frontend
git add client/routes/sign-in.tsx client/routes/sign-up.tsx client/routes/complete-profile.tsx
git rm client/features/auth/components/clerk-appearance.ts
git commit -m "feat(auth): custom sign-in UI (phone+google), complete-profile flow"
```

---

## Task 13: Frontend — UserMenu + header

**Files:**
- Create: `packages/frontend/client/features/auth/components/user-menu.tsx`
- Modify: `packages/frontend/client/shared/components/header.tsx`

- [ ] **Create user-menu.tsx**

Create `packages/frontend/client/features/auth/components/user-menu.tsx`:

```typescript
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useStore } from "@/lib/auth-client";

export function UserMenu() {
  const session = useStore(authClient.useSession);
  const navigate = useNavigate();

  if (session.isPending) return <div className="size-8 animate-pulse rounded-full bg-ganitel-stroke-neutral" />;

  const user = session.data?.user;
  if (!user) return null;

  const initials = (user.name ?? "?")
    .split(/\s+/)
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    await authClient.signOut();
    navigate("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ganitel-text-title">
          <Avatar className="size-8 cursor-pointer">
            {user.image ? <AvatarImage src={user.image} alt={user.name ?? ""} /> : null}
            <AvatarFallback className="bg-ganitel-text-title text-xs font-semibold text-ganitel-paper">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <a href="/profile" className="cursor-pointer">Mon profil</a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600">
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Update header.tsx — replace Clerk hooks + UserButton**

Replace the entire contents of `packages/frontend/client/shared/components/header.tsx`:

```typescript
import { Link, NavLink } from "react-router";

import { authClient, useStore } from "@/lib/auth-client";
import { cn } from "@/shared/lib/cn";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { PillLink } from "@/shared/ui/pill-link";
import { UserMenu } from "@/features/auth/components/user-menu";

const NAV_ITEMS: { to: string; labelKey: TranslationKey }[] = [
  { to: "/", labelKey: "nav.home" },
  { to: "/browse", labelKey: "nav.browse" },
  { to: "/bookings", labelKey: "nav.bookings" },
  { to: "/profile", labelKey: "nav.profile" },
];

export function Header() {
  const t = useT();
  const session = useStore(authClient.useSession);
  const isSignedIn = !!session.data?.user;
  const isLoaded = !session.isPending;

  return (
    <header className="sticky top-0 z-30 border-b border-ganitel-stroke-neutral bg-ganitel-paper/85 backdrop-blur supports-[backdrop-filter]:bg-ganitel-paper/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-ganitel-text-title"
          aria-label="Ganitel"
        >
          <span className="grid size-7 rotate-[-4deg] place-items-center rounded-lg bg-ganitel-text-title text-[13px] font-extrabold leading-none text-ganitel-paper">
            G
          </span>
          <span className="font-display text-[22px] font-extrabold leading-none tracking-[-0.045em]">
            Ganitel
          </span>
        </Link>

        <nav className="hidden gap-9 md:inline-flex" aria-label="Primary">
          {NAV_ITEMS.map(({ to, labelKey }) => (
            <HeaderNavItem key={to} to={to}>
              {t(labelKey)}
            </HeaderNavItem>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoaded && isSignedIn ? (
            <UserMenu />
          ) : (
            <>
              <PillLink to="/sign-in" size="sm" variant="outline">
                {t("common.signin")}
              </PillLink>
              <PillLink to="/sign-in" size="sm" variant="solid">
                {t("common.signup")}
              </PillLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderNavItem({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "group relative pb-1 pt-1.5 text-sm tracking-tight transition-colors duration-200",
          isActive
            ? "font-semibold text-ganitel-text-title"
            : "font-medium text-ganitel-text-placeholder hover:text-ganitel-text-title",
        )
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive ? (
            <span
              aria-hidden
              className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-ganitel-text-title"
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-ganitel-text-title transition-transform duration-300 ease-out group-hover:scale-x-100"
            />
          )}
        </>
      )}
    </NavLink>
  );
}
```

- [ ] **Commit**

```bash
cd packages/frontend
git add client/features/auth/components/user-menu.tsx client/shared/components/header.tsx
git commit -m "feat(auth): UserMenu component, replace Clerk UserButton in header"
```

---

## Task 14: Frontend — update use-me.ts + protected routes

**Files:**
- Modify: `packages/frontend/client/features/auth/hooks/use-me.ts`
- Modify: `packages/frontend/client/routes/profile.tsx`
- Modify: `packages/frontend/client/routes/bookings.tsx`

- [ ] **Update use-me.ts**

Replace the entire contents of `packages/frontend/client/features/auth/hooks/use-me.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authClient, useStore } from "@/lib/auth-client";
import { fetchMe, patchMe, type UpdateMePayload, type UserMe } from "@/features/auth/api/me";

export const meKey = ["me"] as const;

export function useMe() {
  const session = useStore(authClient.useSession);
  const isSignedIn = !!session.data?.user;
  return useQuery({
    queryKey: meKey,
    queryFn: fetchMe,
    enabled: isSignedIn,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMePayload) => patchMe(body),
    onSuccess: (data: UserMe) => qc.setQueryData(meKey, data),
  });
}
```

- [ ] **Update profile.tsx — replace getAuth with getServerToken**

Replace the entire contents of `packages/frontend/client/routes/profile.tsx`:

```typescript
import { redirect } from "react-router";

import type { Route } from "./+types/profile";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { ErrorState } from "@/shared/components/error-state";
import { getServerToken, serverFetch } from "@/shared/api/server";
import type { UserMe } from "@/features/auth/api/me";

export const meta: Route.MetaFunction = () => [
  { title: "Mon profil — Ganitel" },
  { name: "robots", content: "noindex" },
];

export async function loader(args: Route.LoaderArgs) {
  const token = await getServerToken(args.request);
  if (!token) {
    const redirectUrl = encodeURIComponent(
      new URL(args.request.url).pathname + new URL(args.request.url).search,
    );
    return redirect(`/sign-in?redirect_url=${redirectUrl}`);
  }
  const me = await serverFetch<UserMe>("/me", { token });
  return { me };
}

export default function ProfileRoute({ loaderData }: Route.ComponentProps) {
  const { me } = loaderData;
  const initials = me.display_name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <div className="flex items-center gap-5">
        <Avatar className="size-20">
          {me.avatar_url ? (
            <AvatarImage src={me.avatar_url} alt={me.display_name} />
          ) : null}
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-infoma text-3xl text-ganitel-text-title">
            {me.display_name}
          </h1>
          <p className="text-sm text-ganitel-text-subtitle">
            {me.email ?? me.phone ?? "—"}
          </p>
        </div>
      </div>

      <dl className="mt-10 grid grid-cols-1 gap-y-4 text-sm md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">Statut</dt>
          <dd className="mt-1 capitalize text-ganitel-text-title">{me.status}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">Langue</dt>
          <dd className="mt-1 uppercase text-ganitel-text-title">{me.language}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">Hôte</dt>
          <dd className="mt-1 text-ganitel-text-title">{me.is_host ? "Oui" : "Non"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">Admin</dt>
          <dd className="mt-1 text-ganitel-text-title">{me.is_admin ? "Oui" : "Non"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <ErrorState />
    </div>
  );
}
```

- [ ] **Update bookings.tsx — replace getAuth**

Replace the entire contents of `packages/frontend/client/routes/bookings.tsx`:

```typescript
import { redirect } from "react-router";

import type { Route } from "./+types/bookings";

import { getServerToken } from "@/shared/api/server";

export const meta: Route.MetaFunction = () => [
  { title: "Mes réservations — Ganitel" },
  { name: "robots", content: "noindex" },
];

export async function loader(args: Route.LoaderArgs) {
  const token = await getServerToken(args.request);
  if (!token) {
    const url = new URL(args.request.url);
    const redirectUrl = encodeURIComponent(url.pathname + url.search);
    return redirect(`/sign-in?redirect_url=${redirectUrl}`);
  }
  // Wire to GET /api/bookings/me in a follow-up.
  return null;
}

export default function MyBookingsRoute() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-infoma text-3xl text-ganitel-text-title">Mes réservations</h1>
      <p className="mt-3 text-sm text-ganitel-text-subtitle">
        Cette page sera reliée à <code>GET /api/bookings/me</code> lors de la
        prochaine itération.
      </p>
    </div>
  );
}
```

- [ ] **Commit**

```bash
cd packages/frontend
git add client/features/auth/hooks/use-me.ts client/routes/profile.tsx client/routes/bookings.tsx
git commit -m "refactor(routes): replace Clerk getAuth with getServerToken in all protected loaders"
```

---

## Task 15: Frontend — update .env.example

**Files:**
- Modify: `packages/frontend/.env.example`

- [ ] **Update .env.example**

Replace the auth section in `packages/frontend/.env.example`:

Remove:
```
# Auth (Clerk) — both keys required for SSR.
# Get them from https://dashboard.clerk.com → API Keys.
# - VITE_CLERK_PUBLISHABLE_KEY: public, embedded in the client bundle.
# - CLERK_SECRET_KEY: server-only; used by `clerkMiddleware()` to validate
#   sessions during SSR. NEVER prefix with VITE_ or it leaks to browsers.
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
```

Add:
```
# better-auth
# BETTER_AUTH_SECRET: min 32 chars, high entropy random string.
# BETTER_AUTH_URL: public URL of the frontend (used as JWT issuer).
# DATABASE_URL: standard pg:// URL (not the SQLAlchemy asyncpg:// format).
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://ganitel:ganitel@localhost:5432/ganitel

# Google OAuth — register at https://console.cloud.google.com/
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Twilio — for phone OTP
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

- [ ] **Commit**

```bash
cd packages/frontend
git add .env.example
git commit -m "docs(env): replace Clerk vars with better-auth + Twilio vars"
```

---

## Task 16: Final typecheck + route registration

- [ ] **Add complete-profile to React Router routes (if not auto-discovered)**

Check `packages/frontend/client/routes.ts` or equivalent. If there's a manual routes file, add the `/complete-profile` route. If using file-based routing (default), it's auto-discovered from `client/routes/complete-profile.tsx`.

To verify file-based routing includes it:
```bash
cd packages/frontend
bun run typegen 2>&1 | grep "complete-profile"
```

Expected: `complete-profile.tsx` mentioned in output.

- [ ] **Run full typecheck**

```bash
cd packages/frontend
bun run typecheck 2>&1 | tail -30
```

Fix any remaining type errors (likely from removed Clerk types). Common fixes:
- Any `useAuth()` import left over → replace with `useStore(authClient.useSession)`
- Any `getAuth()` import left over → replace with `getServerToken(request)`
- `Route.ComponentProps` with `loaderData: null` for the App function in root → remove the prop (App no longer receives loaderData since the loader was removed)

- [ ] **Run backend unit tests**

```bash
cd packages/backend
uv run pytest tests/unit/ -v
```

Expected: all PASSED

- [ ] **Commit any typecheck fixes**

```bash
git add -p  # stage only the fixes
git commit -m "fix(types): resolve remaining type errors after Clerk removal"
```

---

## Post-Migration Checklist

- [ ] Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in frontend `.env`
- [ ] Set `BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks` and `BETTER_AUTH_ISSUER=http://localhost:3000` in backend `.env`
- [ ] Register `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI in Google Cloud Console
- [ ] Start backend: `cd packages/backend && uv run uvicorn app.main:app --reload`
- [ ] Start frontend: `cd packages/frontend && bun run dev`
- [ ] Open `http://localhost:3000/sign-in` → verify Phone tab shows, Google button shows
- [ ] Test phone OTP flow end-to-end (requires real Twilio credentials)
- [ ] Test Google OAuth flow end-to-end
- [ ] Verify `/profile` redirects to `/sign-in` when unauthenticated
- [ ] Verify `/profile` shows user data when authenticated
- [ ] Verify phone-only user is redirected to `/complete-profile` on first login
