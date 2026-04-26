# CLAUDE.md

Notes for any AI agent working in this repo. Keep terse — read the code for everything else.

## Workflow rules (non-negotiable)

- **Never push directly to `main`.** Always branch + open a PR, even for one-line fixes. Use `git switch -c <type>/<short-name>` (e.g. `fix/eslint-config`, `chore/bump-deps`, `feat/booking-flow`). Push the branch, open via `gh pr create`. The user reviews + merges.
- **Auto mode does not bypass the PR rule.** Acting autonomously means moving faster on a *branch*, not pushing to `main`.
- **Don't force-push `main`.** Don't rewrite shared history unless the user explicitly asks.

## Stack

- **Backend** (`packages/backend/`): FastAPI 0.x, Python 3.11, SQLAlchemy 2.x async, Alembic, Pydantic v2, structlog, Clerk JWT verification (no in-house auth), `uv` for deps.
- **Frontend** (`packages/frontend/`): React 19, React Router v7 framework mode (SSR), Tailwind v4, Radix primitives, TanStack Query (client mutations only), Clerk React Router SDK, Vite, `bun` for deps.
- **DB**: PostgreSQL with **PostGIS** (geoalchemy2 needs it). Standard port 5432.
- **Cache / queues**: Redis. Standard port 6379.

## Layout

- Backend: feature folders under `app/modules/{users,properties,bookings,media,payments,reference,outbox,idempotency}/` each containing `routes.py`, `schemas.py`, `service.py`, `models.py`. Cross-cutting infra in `app/core/`.
- Frontend: `client/routes/` for SSR route modules, `client/features/` for feature folders, `client/shared/` for cross-cutting (api client, ui primitives, hooks, lib).

## Make targets (single source of truth — `Makefile` at repo root)

```
make install        backend uv sync + frontend bun install
make dev            both servers, prefixed logs, Ctrl+C cleans up
make dev-backend    just backend (:8000)
make dev-frontend   just frontend (:3000)
make db-upgrade     apply Alembic migrations
make db-revision M="message"
make seed           populate ~10 demo properties
make test           unit tests, both halves
make lint / format / typecheck / check
make build          frontend prod build (build/client + build/server)
```

There is **no per-package Makefile**. Backend recipes call `uv --directory packages/backend …`; frontend recipes use `bun … --cwd packages/frontend`.

## Conventions

- **Money on the wire**: `app/core/money.py` `Money` value object (`{amount: Decimal, currency: Currency}`). Storage splits into `_amount + _currency` columns; the API recomposes. Frontend mirrors via the `Money` interface in `features/properties/types.ts`.
- **Schemas tightened**: `EmailStr` for emails, `Literal["fr","en"]` for languages, ISO 3166 pattern for `country_code`, `Literal[...]` for payment provider, `extra="forbid"` on inputs, image-only MIME literal for media uploads.
- **Logging**: `from app.core.logging import get_logger; log = get_logger(__name__)`. Bind extra context via `structlog.contextvars.bind_contextvars(...)` — `request_id` is auto-bound by `RequestIdMiddleware`.
- **Auth**: backend never issues tokens. `CurrentUser` / `OptionalUser` deps in `app/core/deps.py` resolve Clerk JWTs.
- **SSR loaders** call `serverFetch` (`client/shared/api/server.ts`); client components keep using `apiClient` (`client/shared/api/client.ts`). Don't mix.
- **Tests**: backend `tests/unit/` is pure logic only — no DB/Redis/env/app boot. Integration tests will live elsewhere with the `integration` marker.

## Things deferred (don't extend, don't restore unprompted)

- **Docker** — Dockerfiles + compose files were removed. Use local Postgres + Redis. Re-introduce only if asked.
- **Staging environment** — user explicitly doesn't need staging. Don't add staging-specific code or env files.
- **Per-feature backend tests** — legacy test suite removed during the v2 rewrite; new ones come per-module when needed.
- **Search filters** — backend supports city/country/guests/price/amenity/property_type/sort, but the frontend browse loader currently only wires `q`.
- **Booking + host flows on the frontend** — placeholder routes today.
- **Experiences module** — modeled separately from properties (memory: "properties/experiences as separate modules"). Not built yet.

## Commit style

- Conventional commits: `feat(scope): …`, `fix(scope): …`, `chore: …`, `refactor(scope): …`, `test(scope): …`, `ci(scope): …`.
- Body explains the *why* and lists the surface area touched. Verified-locally line at the end is welcome.
- Co-authoring: end with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` when an agent did the work.

## Memory

User-specific preferences and project context live in `~/.claude/projects/-Users-lvndry-github-ganitel/memory/`. Cross-reference there before assuming defaults — especially around staging, auth, and "keep it simple" preferences.
