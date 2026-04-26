.DEFAULT_GOAL := help

COMPOSE := docker compose -f docker-compose.local.yml

dev: ## Run FastAPI locally with reload
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

up: ## Start postgres + redis
	$(COMPOSE) up -d

down: ## Stop services
	$(COMPOSE) down

down-v: ## Stop services and wipe volumes
	$(COMPOSE) down -v

db-revision: ## Generate a migration (M="message")
	@[ -n "$(M)" ] || (echo "Usage: make db-revision M=\"message\""; exit 1)
	uv run alembic revision --autogenerate -m "$(M)"

db-upgrade: ## Apply pending migrations
	uv run alembic upgrade head

db-downgrade: ## Roll back one migration
	uv run alembic downgrade -1

seed: ## Seed the local DB with a demo host + ~10 published properties (idempotent)
	uv run python -m scripts.seed_demo

test: ## Run tests
	uv run pytest

lint: ## Lint (ruff)
	uv run ruff check .

fmt: ## Format (ruff)
	uv run ruff format .

typecheck: ## Type-check (ty)
	uv run ty check app

check: lint typecheck ## Lint + typecheck

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

.PHONY: dev up down down-v db-revision db-upgrade db-downgrade seed test lint fmt typecheck check help
