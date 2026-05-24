# ganitel

**Africa-first marketplace for housing, experiences, and payments.**

ganitel lets travellers browse and book stays and experiences, and lets
hosts list properties and experiences from a single account. The interface
ships in French and English (mobile-first, anonymous browsing).

## Codebase highlights

- **Monorepo, two packages.** `packages/backend` (FastAPI, Python 3.12) and
  `packages/frontend` (React Router v7), driven by a single root `Makefile`.
- **Feature-modular backend.** Every domain (`properties`, `experiences`,
  `bookings`, `payments`, `media`, `users`, `reference`, `outbox`,
  `idempotency`) lives in `app/modules/<feature>` with its own `routes.py` /
  `schemas.py` / `service.py` / `models.py`. Cross-cutting concerns (auth,
  db, errors, storage, money, logging) sit in `app/core`.
- **PostgreSQL + PostGIS** via SQLAlchemy 2 async, asyncpg, GeoAlchemy2 and
  Shapely — listings carry geometry, not just city strings.
- **Transactional outbox + per-user idempotency table** as first-class
  modules, ready for event dispatch and safe request replay.
- **React Router v7 in framework mode with SSR**, Tailwind v4, shadcn/ui on
  top of Radix, TanStack Query, react-hook-form + Zod, Clerk for auth.
- **Demo data** seeds ~10 properties and 6 experiences across Cameroon,
  Senegal, and Côte d'Ivoire (`make seed`, idempotent).

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
# S3_* if you need media uploads

cp packages/frontend/.env.example packages/frontend/.env

make install        # uv sync (backend) + bun install (frontend)
make db-upgrade     # apply Alembic migrations
make seed           # demo properties + experiences
make dev            # backend :8000 + frontend :3000, hot reload, prefixed logs
```

Run `make help` for the full list of targets — `dev`, `test`, `lint`,
`format`, `typecheck`, `check`, `build`, plus DB helpers (`db-revision`,
`db-upgrade`, `db-downgrade`, `seed`).

## Per-package docs

- [packages/backend/README.md](packages/backend/README.md)
- [packages/frontend/README.md](packages/frontend/README.md)
