# Ganitel

**Africa-first marketplace for stays, experiences, and payments.**

Ganitel lets travellers discover places to sleep and things to do across the
continent — starting with Cameroon, Senegal, and Côte d'Ivoire — and lets
hosts list properties and experiences from a single account. The product
ships in French and English, with payments built in rather than bolted on.

## Codebase highlights

- **Monorepo, two packages.** `packages/backend` (FastAPI, Python 3.12) and
  `packages/frontend` (React Router v7), driven by a single root `Makefile`.
- **Feature-modular backend.** Every domain (`properties`, `experiences`,
  `bookings`, `payments`, `media`, `users`, …) lives in
  `app/modules/<feature>` with its own `routes.py` / `schemas.py` /
  `service.py` / `models.py`. Cross-cutting concerns (auth, db, errors,
  storage, money, logging) sit in `app/core`.
- **Geo-aware data layer.** SQLAlchemy 2 async + asyncpg over PostgreSQL,
  with PostGIS / GeoAlchemy2 / Shapely so listings can be queried by
  proximity, not just by city string.
- **Outbox + idempotency modules** for safe webhook delivery and replay-safe
  POSTs against payments and bookings.
- **React Router v7 in framework mode with SSR**, Tailwind v4, shadcn/ui on
  top of Radix, TanStack Query for server state, react-hook-form + Zod for
  forms.
- **Editorial, mobile-first UI** with anonymous browse — auth is only
  required at booking and host actions.

## Prerequisites

- **Python 3.12+** with [uv](https://github.com/astral-sh/uv)
- **Bun** for the frontend
- **PostgreSQL with PostGIS** on `localhost:5432` (override via
  `DATABASE_URL`)
- A **Clerk** application for the auth keys referenced in `.env`

## Get started

From the repo root:

```bash
cp packages/backend/.env.example packages/backend/.env
# fill in CLERK_JWKS_URL, CLERK_ISSUER, S3_* if you need media uploads

make install        # uv sync (backend) + bun install (frontend)
make db-upgrade     # apply Alembic migrations
make seed           # ~10 demo properties + 6 experiences across CM/SN/CI
make dev            # backend :8000 + frontend :3000, hot reload, prefixed logs
```

Run `make help` for the full list of targets — `dev`, `test`, `lint`,
`format`, `typecheck`, `check`, `build`, plus DB helpers (`db-revision`,
`db-upgrade`, `db-downgrade`, `seed`).

## Per-package docs

- [packages/backend/README.md](packages/backend/README.md)
- [packages/frontend/README.md](packages/frontend/README.md)
