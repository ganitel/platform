# Ganitel Backend

FastAPI service for the Ganitel platform. Feature-organized; auth via Clerk.

## Layout

```
app/
  main.py                    FastAPI factory
  api/                       Aggregated API router (mounted at /api)
  core/                      Cross-cutting infra (auth, config, db, errors,
                             logging, middleware, money, redis, storage)
  modules/                   Per-feature folders, each with
                             routes.py / schemas.py / service.py / models.py
    users/   properties/   bookings/   media/   payments/
    reference/   outbox/   idempotency/
migrations/                  Alembic
scripts/seed_demo.py         Demo data seed (idempotent)
tests/unit/                  Pure unit tests (no DB / Redis / app boot)
```

## Prerequisites

- **Python 3.11+** (managed via [uv](https://github.com/astral-sh/uv))
- **PostgreSQL** with the **PostGIS** extension — `geoalchemy2` requires it
- **Redis**

Standard ports (5432 / 6379). Override via `DATABASE_URL` / `REDIS_URL` in `.env`.

## Setup

From the **repo root**:

```bash
cp packages/backend/.env.example packages/backend/.env
# fill in CLERK_JWKS_URL, CLERK_ISSUER, S3_* if you need media uploads

make install        # uv sync + bun install
make db-upgrade     # apply migrations
make seed           # 10 demo properties spread across CM/SN/CI
make dev            # backend (:8000) + frontend (:3000) with hot reload
```

## Make targets

All from the repo root — there is no per-package Makefile. Run `make help`
for the full list. Common ones:

| Target | What |
| --- | --- |
| `make install` | install backend + frontend deps |
| `make dev` | both dev servers, prefixed logs, Ctrl+C cleans up |
| `make dev-backend` / `make dev-frontend` | one side only |
| `make db-revision M="…"` | autogenerate an Alembic migration |
| `make db-upgrade` / `make db-downgrade` | apply / roll back |
| `make seed` | seed demo data |
| `make test` | unit tests, both halves |
| `make lint` / `make format` / `make typecheck` / `make check` | code quality |

## Auth (Clerk)

The backend never issues tokens. It verifies Clerk session JWTs against the
configured JWKs (`CLERK_JWKS_URL`, `CLERK_ISSUER`) and mirrors the user into
a local `users` row keyed by `clerk_user_id`. See `app/core/auth.py` and
`app/core/deps.py` (`CurrentUser` / `OptionalUser`).

## Logging

`structlog`. Dev → colored kv; prod → JSON. `RequestIdMiddleware` binds
`request_id` into the contextvar, `AccessLogMiddleware` emits one structured
line per HTTP request. See `app/core/logging.py`.
