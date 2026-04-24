.DEFAULT_GOAL := help

COMPOSE := COMPOSE_PROJECT_NAME=ganitel-local docker compose -f docker-compose.local.yml --env-file .env.local

# ── Development ───────────────────────────────────────────────────────────────

dev: ## Start FastAPI dev server with live reload
	uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

install: up ## Install deps, sync, and run migrations
	uv sync
	$(MAKE) migrate
	@echo "✅ Ready — run: make dev"

# ── Docker ────────────────────────────────────────────────────────────────────

up: ## Start local services (postgres, redis)
	$(COMPOSE) up -d --remove-orphans

down: ## Stop local services
	$(COMPOSE) down --remove-orphans

down-v: ## Stop local services and delete volumes
	$(COMPOSE) down -v --remove-orphans

restart: ## Restart local services
	$(COMPOSE) restart

logs: ## Tail all service logs
	$(COMPOSE) logs -f

ps: ## Show running containers
	$(COMPOSE) ps

shell-app: ## Shell into the app container
	$(COMPOSE) exec app /bin/bash

shell-db: ## Open psql shell
	$(COMPOSE) exec db psql -U ganitel_user -d ganitel_db

shell-redis: ## Open redis-cli
	$(COMPOSE) exec redis redis-cli

# ── Database ──────────────────────────────────────────────────────────────────

migrate: ## Run pending Alembic migrations
	uv run alembic upgrade head

migrate-status: ## Show current migration revision
	uv run alembic current

migrate-history: ## Show migration history
	uv run alembic history

db-reset: ## DESTRUCTIVE: wipe DB volumes and re-run migrations
	@read -p "Type yes to confirm: " c && [ "$$c" = "yes" ]
	$(COMPOSE) down -v
	$(MAKE) up
	@sleep 3
	$(MAKE) migrate

db-backup: ## Backup local DB into backups/
	@mkdir -p backups
	$(COMPOSE) exec -T db pg_dump -U ganitel_user ganitel_db > backups/local_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup saved to backups/"

db-restore: ## Restore local DB (FILE=backups/file.sql)
	@[ -n "$(FILE)" ] || (echo "❌ Usage: make db-restore FILE=backups/file.sql"; exit 1)
	$(COMPOSE) exec -T db psql -U ganitel_user ganitel_db < $(FILE)

# ── Admin ─────────────────────────────────────────────────────────────────────

admin-create: ## Create or promote admin (EMAIL= PASSWORD= FIRST_NAME= LAST_NAME=)
	uv run python -m app.scripts.create_admin

# ── Tests ─────────────────────────────────────────────────────────────────────

test: _test-db-up ## Run all tests with coverage
	uv run pytest --cov=app --cov-report=term-missing

test-unit: _test-db-up ## Run unit tests
	uv run pytest -m unit --cov=app --cov-report=term-missing

test-integration: _test-db-up ## Run integration tests
	uv run pytest -m integration --cov=app --cov-report=term-missing

test-fast: _test-db-up ## Run all tests except slow ones
	uv run pytest -m "not slow"

test-file: _test-db-up ## Run a specific file (FILE=tests/test_foo.py)
	@[ -n "$(FILE)" ] || (echo "❌ Usage: make test-file FILE=tests/test_foo.py"; exit 1)
	uv run pytest $(FILE) --cov=app --cov-report=term-missing

_test-db-up:
	$(COMPOSE) --profile test up -d db-test
	@sleep 2

# ── Code quality ──────────────────────────────────────────────────────────────

lint: ## Lint with ruff
	uv run ruff check .

format: ## Format with ruff
	uv run ruff format .

typecheck: ## Type-check with ty
	uv run ty check .

check: lint typecheck ## Lint + typecheck (CI equivalent)

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: dev install up down down-v restart logs ps shell-app shell-db shell-redis \
        migrate migrate-status migrate-history db-reset db-backup db-restore \
        admin-create \
        test test-unit test-integration test-fast test-file _test-db-up \
        lint format typecheck check help
