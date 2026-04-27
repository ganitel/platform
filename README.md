# Ganitel

Africa-first marketplace for housing, experiences, and payments.

Mono-repo with a FastAPI backend and a React Router v7 frontend, orchestrated
from a single root `Makefile`.

## Repository layout

```
packages/
  backend/     FastAPI service (Python 3.12, uv)
  frontend/    React Router v7 app (Bun, Vite, Tailwind, shadcn/ui)
Makefile       Single source of truth for dev / db / test / lint / build
```

Each package has its own `README.md` with details specific to that side of
the stack.

## Prerequisites

- **Python 3.12+** and [uv](https://github.com/astral-sh/uv)
- **Bun** (frontend package manager + runtime)
- **PostgreSQL with PostGIS** on `localhost:5432` (override via `DATABASE_URL`)
- A **Clerk** application — the backend verifies Clerk session JWTs, it never
  issues its own

## Quick start

From the repo root:

```bash
cp packages/backend/.env.example packages/backend/.env
# fill in CLERK_JWKS_URL, CLERK_ISSUER, S3_* if you need media uploads

make install        # uv sync (backend) + bun install (frontend)
make db-upgrade     # apply Alembic migrations
make seed           # ~10 demo properties + 6 experiences across CM/SN/CI
make dev            # backend :8000 + frontend :3000, hot reload, prefixed logs
```

## Common tasks

Run `make help` for the full list. The most common targets:

| Target                                                        | What                                              |
| ------------------------------------------------------------- | ------------------------------------------------- |
| `make install`                                                | install backend + frontend deps                   |
| `make dev`                                                    | both dev servers, prefixed logs, Ctrl+C cleans up |
| `make dev-backend` / `make dev-frontend`                      | one side only                                     |
| `make db-revision M="…"`                                      | autogenerate an Alembic migration                 |
| `make db-upgrade` / `make db-downgrade`                       | apply / roll back                                 |
| `make seed`                                                   | seed demo data                                    |
| `make test`                                                   | unit tests, both halves                           |
| `make lint` / `make format` / `make typecheck` / `make check` | code quality                                      |
| `make build`                                                  | production build of the frontend                  |

## Stack

**Backend** — FastAPI, SQLAlchemy 2 (async) + asyncpg, Alembic, GeoAlchemy2 +
Shapely (PostGIS), Pydantic v2, structlog, aioboto3 for S3-compatible
storage, Clerk JWT verification via PyJWT.

**Frontend** — React 19, React Router v7 (framework mode, SSR), Tailwind v4,
shadcn/ui (Radix primitives), TanStack Query, Axios, react-hook-form + Zod,
Clerk for auth, Vitest + Testing Library.

## Auth

Clerk is the identity provider. The frontend obtains session JWTs from Clerk
and forwards them to the backend, which verifies them against the configured
JWKs (`CLERK_JWKS_URL`, `CLERK_ISSUER`) and mirrors each user into a local
`users` row keyed by `clerk_user_id`. See `packages/backend/app/core/auth.py`.

## Contributing

- Work on a feature branch and open a PR — `main` is protected.
- `make check` (lint + typecheck) and `make test` should be green before
  asking for review.
- CI lives in `.github/workflows/{backend,frontend}.yml`.

## Per-package docs

- [packages/backend/README.md](packages/backend/README.md) — module layout,
  Clerk integration, logging, env vars
- [packages/frontend/README.md](packages/frontend/README.md) — feature folder
  structure and UI conventions
