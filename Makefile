.DEFAULT_GOAL := help

# ── Dev ───────────────────────────────────────────────────────────────────────

dev-frontend: ## Start frontend dev server
	bun run --cwd packages/frontend dev

dev-backend: ## Start backend FastAPI dev server
	$(MAKE) -C packages/backend dev

# ── Install ───────────────────────────────────────────────────────────────────

install: ## Install all dependencies (frontend + backend)
	bun install --cwd packages/frontend
	$(MAKE) -C packages/backend install

# ── Build ─────────────────────────────────────────────────────────────────────

build-frontend: ## Build frontend for production
	bun run --cwd packages/frontend build

# ── Tests ─────────────────────────────────────────────────────────────────────

test-frontend: ## Run frontend tests
	bun run --cwd packages/frontend test

test-backend: ## Run backend tests
	$(MAKE) -C packages/backend test

test: test-frontend test-backend ## Run all tests

# ── Code quality ──────────────────────────────────────────────────────────────

lint: ## Lint everything
	bun run --cwd packages/frontend lint
	$(MAKE) -C packages/backend lint

format: ## Format everything
	bun run --cwd packages/frontend format
	$(MAKE) -C packages/backend format

check: ## Lint + typecheck everything
	bun run --cwd packages/frontend lint
	$(MAKE) -C packages/backend check

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: dev-frontend dev-backend install build-frontend \
        test-frontend test-backend test \
        lint format check help
