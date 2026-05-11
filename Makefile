.DEFAULT_GOAL := help

.PHONY: install install-hooks dev dev-backend dev-frontend \
        db-revision db-upgrade db-downgrade seed \
        test test-backend test-frontend \
        lint format typecheck check precommit build help

# ── Bootstrap ─────────────────────────────────────────────────────────────────

install: ## Install all deps + git hooks (backend uv sync + frontend bun install + pre-commit install)
	cd packages/backend && uv sync --frozen --all-groups
	cd packages/frontend && bun install
	$(MAKE) -s install-hooks

install-hooks: ## Install git pre-commit hook into .git/hooks/
	cd packages/backend && uv run pre-commit install --install-hooks

# ── Dev ───────────────────────────────────────────────────────────────────────
# Requires PostgreSQL (with PostGIS) on the standard port (5432).
# Override via DATABASE_URL in .env.

dev: ## Start frontend + backend dev servers concurrently (hot reload)
	@echo "Starting frontend + backend dev servers (Ctrl+C to stop)…"
	@trap 'kill 0' INT TERM EXIT; \
		($(MAKE) -s dev-backend 2>&1 | sed -e 's/^/[backend]  /') & \
		($(MAKE) -s dev-frontend 2>&1 | sed -e 's/^/[frontend] /') & \
		wait

dev-backend: ## Backend FastAPI dev server (http://localhost:8000)
	@echo "→ FastAPI dev server: http://localhost:8000"
	# PYTHONUNBUFFERED=1: when `make dev` pipes our stdout through `sed`,
	# Python switches to block-buffered output. For a long-running server,
	# logs would sit in the buffer for minutes before becoming visible.
	# Unbuffered flushes per line so `team.submit.*` / `team.email.*` logs
	# show up in your terminal as requests fire.
	cd packages/backend && PYTHONUNBUFFERED=1 uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Frontend Vite dev server (http://localhost:3000)
	@echo "→ Vite dev server: http://localhost:3000"
	cd packages/frontend && bun run dev

# ── Database ──────────────────────────────────────────────────────────────────

db-revision: ## Generate a migration (M="message")
	@[ -n "$(M)" ] || (echo "Usage: make db-revision M=\"message\""; exit 1)
	cd packages/backend && uv run alembic revision --autogenerate -m "$(M)"

db-upgrade: ## Apply pending migrations
	cd packages/backend && uv run alembic upgrade head

db-downgrade: ## Roll back one migration
	cd packages/backend && uv run alembic downgrade -1

seed: ## Seed local DB with ~5 demo hosts + ~10 properties + ~6 experiences (idempotent)
	cd packages/backend && uv run python -m scripts.seed_demo

# ── Tests ─────────────────────────────────────────────────────────────────────

test: test-backend test-frontend ## Run all tests

test-backend: ## Backend unit tests (no DB required)
	cd packages/backend && uv run pytest tests/unit/ -v

test-frontend: ## Frontend tests (vitest)
	cd packages/frontend && bun run test

# ── Code quality ──────────────────────────────────────────────────────────────

lint: ## Lint everything
	cd packages/backend && uv run ruff check .
	cd packages/frontend && bun run lint

format: ## Format everything (writes)
	cd packages/backend && uv run ruff format .
	cd packages/frontend && bun run format

typecheck: ## Type-check everything (ty + tsc)
	cd packages/backend && uv run ty check app
	cd packages/frontend && bun run typecheck

check: lint typecheck ## Lint + typecheck

precommit: ## Run all pre-commit hooks against every tracked file
	cd packages/backend && uv run pre-commit run --all-files --show-diff-on-failure

# ── Build ─────────────────────────────────────────────────────────────────────

build: ## Build frontend for production (build/{client,server})
	cd packages/frontend && bun run build

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
