.DEFAULT_GOAL := help

UV := uv --directory packages/backend
# Bun's `--cwd` flag belongs *after* the subcommand for `run`, so we keep
# install and run paths separate. Don't collapse to a single `bun --cwd …`
# macro — `bun --cwd <path> run <script>` silently swallows the script.
BUN_RUN := bun run --cwd packages/frontend

# ── Bootstrap ─────────────────────────────────────────────────────────────────

install: ## Install all deps (backend uv sync + frontend bun install)
	$(UV) sync --frozen --all-groups
	bun install --cwd packages/frontend

# ── Dev ───────────────────────────────────────────────────────────────────────
# Requires PostgreSQL (with PostGIS) + Redis running locally on the standard
# ports (5432 / 6379). Override via DATABASE_URL / REDIS_URL in .env.

dev: ## Start frontend + backend dev servers concurrently (hot reload)
	@echo "Starting frontend + backend dev servers (Ctrl+C to stop)…"
	@trap 'kill 0' INT TERM EXIT; \
		($(MAKE) -s dev-backend 2>&1 | sed -e 's/^/[backend]  /') & \
		($(MAKE) -s dev-frontend 2>&1 | sed -e 's/^/[frontend] /') & \
		wait

dev-backend: ## Backend FastAPI dev server (http://localhost:8000)
	@echo "→ FastAPI dev server: http://localhost:8000"
	$(UV) run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Frontend Vite dev server (http://localhost:3000)
	@echo "→ Vite dev server: http://localhost:3000"
	$(BUN_RUN) dev

# ── Database ──────────────────────────────────────────────────────────────────

db-revision: ## Generate a migration (M="message")
	@[ -n "$(M)" ] || (echo "Usage: make db-revision M=\"message\""; exit 1)
	$(UV) run alembic revision --autogenerate -m "$(M)"

db-upgrade: ## Apply pending migrations
	$(UV) run alembic upgrade head

db-downgrade: ## Roll back one migration
	$(UV) run alembic downgrade -1

seed: ## Seed local DB with demo host + ~10 published properties (idempotent)
	$(UV) run python -m scripts.seed_demo

# ── Tests ─────────────────────────────────────────────────────────────────────

test: test-backend test-frontend ## Run all tests

test-backend: ## Backend unit tests (no DB required)
	$(UV) run pytest tests/unit/ -v

test-frontend: ## Frontend tests (vitest)
	$(BUN_RUN) test

# ── Code quality ──────────────────────────────────────────────────────────────

lint: ## Lint everything
	$(UV) run ruff check .
	$(BUN_RUN) lint

format: ## Format everything (writes)
	$(UV) run ruff format .
	$(BUN_RUN) format

typecheck: ## Type-check everything (ty + tsc)
	$(UV) run ty check app
	$(BUN_RUN) typecheck

check: lint typecheck ## Lint + typecheck

# ── Build ─────────────────────────────────────────────────────────────────────

build: ## Build frontend for production (build/{client,server})
	$(BUN_RUN) build

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.PHONY: install dev dev-backend dev-frontend \
        db-revision db-upgrade db-downgrade seed \
        test test-backend test-frontend \
        lint format typecheck check build help
