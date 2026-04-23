# ============================================
# GANITEL BACKEND - UNIFIED DRY MAKEFILE
# ============================================

.DEFAULT_GOAL := help

# --------------------------------------------
# Platform detection
# --------------------------------------------
ifeq ($(OS),Windows_NT)
	DETECTED_OS := windows
	SLEEP := powershell -Command "Start-Sleep -Seconds"
	MKDIR := powershell -Command "New-Item -ItemType Directory -Force -Path"
	READ_CONFIRM := powershell -Command "$$confirm = Read-Host 'Type yes to confirm'; if ($$confirm -eq 'yes') { exit 0 } else { exit 1 }"
else
	DETECTED_OS := unix
	SLEEP := sleep
	MKDIR := mkdir -p
	READ_CONFIRM := bash -c 'read -p "Type yes to confirm: " c; [ "$$c" = "yes" ]'
endif

# --------------------------------------------
# Environment wiring
# --------------------------------------------
PROJECT_local ?= ganitel-local
PROJECT_staging ?= ganitel-staging

COMPOSE_local := COMPOSE_PROJECT_NAME=$(PROJECT_local) docker compose -f docker-compose.local.yml --env-file .env.local
COMPOSE_staging := COMPOSE_PROJECT_NAME=$(PROJECT_staging) docker compose -f docker-compose.staging.yml --env-file .env.staging

ENVS := local staging
TEST_ENVS := local staging
PGADMIN_ENVS := local

ifneq (,$(wildcard docker-compose.prod.yml))
PROJECT_prod ?= ganitel-prod
COMPOSE_prod := COMPOSE_PROJECT_NAME=$(PROJECT_prod) docker compose -f docker-compose.prod.yml --env-file .env.prod
ENVS += prod
endif

DB_USER_local ?= ganitel_user
DB_NAME_local ?= ganitel_db
DB_USER_staging ?= ganitel_user
DB_NAME_staging ?= ganitel_staging_db
ifneq (,$(wildcard docker-compose.prod.yml))
DB_USER_prod ?= ganitel_user
DB_NAME_prod ?= ganitel_prod_db
endif

ENV_FILE_local ?= .env.local
ENV_FILE_staging ?= .env.staging
ENV_FILE_prod ?= .env.prod

define ENV_VALUE
$(strip $(shell if [ -f "$(2)" ]; then awk -F= '/^$(1)=/ {print $$2; exit}' "$(2)"; fi))
endef

APP_HOST_PORT_local ?= $(or $(call ENV_VALUE,APP_HOST_PORT,$(ENV_FILE_local)),$(call ENV_VALUE,APP_PORT,$(ENV_FILE_local)),8000)
POSTGRES_HOST_PORT_local ?= $(or $(call ENV_VALUE,POSTGRES_HOST_PORT,$(ENV_FILE_local)),$(call ENV_VALUE,POSTGRES_PORT,$(ENV_FILE_local)),5432)
TEST_POSTGRES_HOST_PORT_local ?= $(or $(call ENV_VALUE,TEST_POSTGRES_HOST_PORT,$(ENV_FILE_local)),$(call ENV_VALUE,TEST_POSTGRES_PORT,$(ENV_FILE_local)),5433)
REDIS_HOST_PORT_local ?= $(or $(call ENV_VALUE,REDIS_HOST_PORT,$(ENV_FILE_local)),$(call ENV_VALUE,REDIS_PORT,$(ENV_FILE_local)),6379)
PGADMIN_HOST_PORT_local ?= $(or $(call ENV_VALUE,PGADMIN_HOST_PORT,$(ENV_FILE_local)),$(call ENV_VALUE,PGADMIN_PORT,$(ENV_FILE_local)),5050)

APP_HOST_PORT_staging ?= $(or $(call ENV_VALUE,APP_HOST_PORT,$(ENV_FILE_staging)),$(call ENV_VALUE,APP_PORT,$(ENV_FILE_staging)),8001)
POSTGRES_HOST_PORT_staging ?= $(or $(call ENV_VALUE,POSTGRES_HOST_PORT,$(ENV_FILE_staging)),$(call ENV_VALUE,POSTGRES_EXPOSE_PORT,$(ENV_FILE_staging)),5434)
REDIS_HOST_PORT_staging ?= $(or $(call ENV_VALUE,REDIS_HOST_PORT,$(ENV_FILE_staging)),$(call ENV_VALUE,REDIS_PORT,$(ENV_FILE_staging)),6380)

ifneq (,$(wildcard docker-compose.prod.yml))
APP_HOST_PORT_prod ?= $(or $(call ENV_VALUE,APP_HOST_PORT,$(ENV_FILE_prod)),$(call ENV_VALUE,APP_PORT,$(ENV_FILE_prod)),8000)
POSTGRES_HOST_PORT_prod ?= $(or $(call ENV_VALUE,POSTGRES_HOST_PORT,$(ENV_FILE_prod)),$(call ENV_VALUE,POSTGRES_PORT,$(ENV_FILE_prod)),5432)
REDIS_HOST_PORT_prod ?= $(or $(call ENV_VALUE,REDIS_HOST_PORT,$(ENV_FILE_prod)),$(call ENV_VALUE,REDIS_PORT,$(ENV_FILE_prod)),6379)
endif

PORTS_local := $(sort $(APP_HOST_PORT_local) $(POSTGRES_HOST_PORT_local) $(TEST_POSTGRES_HOST_PORT_local) $(REDIS_HOST_PORT_local) $(PGADMIN_HOST_PORT_local))
PORTS_staging := $(sort $(APP_HOST_PORT_staging) $(POSTGRES_HOST_PORT_staging) $(REDIS_HOST_PORT_staging))
ifneq (,$(wildcard docker-compose.prod.yml))
PORTS_prod := $(sort $(APP_HOST_PORT_prod) $(POSTGRES_HOST_PORT_prod) $(REDIS_HOST_PORT_prod))
endif

PYTEST_COV_ARGS := --cov=app --cov-report=term-missing --cov-report=html
TEST_CMD_local := $(COMPOSE_local) run --rm --build --entrypoint "" -e DOCKER_ENV=true -e ENVIRONMENT=test --no-deps --user root --use-aliases --workdir /app app-test pytest
TEST_CMD_staging := $(COMPOSE_staging) run --rm --build --entrypoint "" -e DOCKER_ENV=true -e ENVIRONMENT=test --no-deps --user root --use-aliases --workdir /app app-test pytest

TEST_PRE_local := $(MAKE) --no-print-directory local-test-db-start
TEST_PRE_staging := $(COMPOSE_staging) --profile test up -d db redis

PHONY_TARGETS := help all-up all-down all-logs status clean clean-all install install-with-tests rebuild local-test-db-start local-test-db-stop local-test-db-clean local-db-reinit
PHONY_TARGETS += local-dev local-migrate local-migrate-status local-migrate-history local-shell-app local-admin-create
PHONY_TARGETS += local-lint local-format local-typecheck local-check
PHONY_TARGETS += local-test local-test-unit local-test-integration local-test-fast local-test-cov local-test-specific local-test-auth local-test-booking local-test-service
PHONY_TARGETS += local-legacy-migrate-dry local-legacy-migrate-apply

LEGACY_SQL_DUMP_local ?= $(CURDIR)/residencemg_backup.sql
LEGACY_SQL_DUMP_staging ?= $(CURDIR)/residencemg_backup.sql
ifneq (,$(wildcard docker-compose.prod.yml))
LEGACY_SQL_DUMP_prod ?= $(CURDIR)/residencemg_backup.sql
endif

LEGACY_SQL_DUMP_CONTAINER_local ?= /app/residencemg_backup.sql
LEGACY_SQL_DUMP_CONTAINER_staging ?= /app/residencemg_backup.sql
ifneq (,$(wildcard docker-compose.prod.yml))
LEGACY_SQL_DUMP_CONTAINER_prod ?= /app/residencemg_backup.sql
endif

LEGACY_REPORTS_DIR_CONTAINER_local ?= /tmp/legacy_migration_reports
LEGACY_REPORTS_DIR_CONTAINER_staging ?= /tmp/legacy_migration_reports
ifneq (,$(wildcard docker-compose.prod.yml))
LEGACY_REPORTS_DIR_CONTAINER_prod ?= /tmp/legacy_migration_reports
endif

# --------------------------------------------
# Templates
# --------------------------------------------
define ENV_TEMPLATE
PHONY_TARGETS += $(1)-build $(1)-up $(1)-down $(1)-down-v $(1)-delete $(1)-restart $(1)-stop $(1)-start $(1)-ps
PHONY_TARGETS += $(1)-shell $(1)-shell-app $(1)-shell-db $(1)-shell-redis
PHONY_TARGETS += $(1)-migrate $(1)-migrate-status $(1)-migrate-history $(1)-db-reset $(1)-db-backup $(1)-db-restore
PHONY_TARGETS += $(1)-admin-create
PHONY_TARGETS += $(1)-logs $(1)-logs-app $(1)-logs-db $(1)-logs-redis
PHONY_TARGETS += $(1)-health $(1)-config
PHONY_TARGETS += $(1)-legacy-migrate-dry $(1)-legacy-migrate-apply

$(1)-build: ## Build Docker images for $(1)
	@echo "🔨 Building $(1) images..."
	$$(COMPOSE_$(1)) build

$(1)-up: ## Start $(1) services (detached)
	@echo "🚀 Starting $(1) services..."
	$$(COMPOSE_$(1)) up -d --remove-orphans

$(1)-down: ## Stop $(1) services (preserve volumes)
	@echo "🛑 Stopping $(1) services..."
	$$(COMPOSE_$(1)) down --remove-orphans

$(1)-down-v: ## Stop $(1) services and remove volumes
	@echo "🧹 Stopping $(1) services and removing volumes..."
	$$(COMPOSE_$(1)) down -v --remove-orphans

$(1)-delete: ## Full cleanup for $(1): containers, images, networks, volumes
	@echo "⚠️  $(1)-delete is destructive."
	@$(READ_CONFIRM) && ( \
		echo "🗑️  Removing $(1) docker resources..." && \
		$$(COMPOSE_$(1)) down -v --rmi all --remove-orphans \
	) || (echo "❌ Delete cancelled"; exit 1)
ifeq ($(OS),Windows_NT)
	@for %%p in ($$(PORTS_$(1))) do powershell -Command "$$port=%%p; $$lines=(netstat -ano | Select-String ":$$port"); foreach($$line in $$lines){ $$parts=$$line.ToString() -split '\\s+'; $$pid=$$parts[-1]; if($$pid -match '^[0-9]+$$'){ taskkill /PID $$pid /F | Out-Null } }"
else
	@for port in $$(PORTS_$(1)); do \
		pids=$$(lsof -ti:$$port 2>/dev/null); \
		if [ -n "$$pids" ]; then \
			echo "🔌 Freeing port $$port"; \
			kill -9 $$pids >/dev/null 2>&1 || true; \
		fi; \
	done
endif
	@echo "✅ $(1) delete complete"

$(1)-restart: ## Restart $(1) services
	@echo "🔄 Restarting $(1) services..."
	$$(COMPOSE_$(1)) restart

$(1)-stop: ## Stop $(1) services without removing
	@echo "⏸️  Stopping $(1) services..."
	$$(COMPOSE_$(1)) stop

$(1)-start: ## Start stopped $(1) services
	@echo "▶️  Starting $(1) services..."
	$$(COMPOSE_$(1)) start

$(1)-ps: ## List $(1) containers
	$$(COMPOSE_$(1)) ps

$(1)-shell: ## Interactive shell menu for $(1) (app/db/redis)
ifeq ($(OS),Windows_NT)
	@powershell -Command "Write-Host 'Select service to connect to:'; Write-Host '  1) app'; Write-Host '  2) db'; Write-Host '  3) redis'; $$choice = Read-Host 'Enter choice [1-3 or app/db/redis]'; $$choice = $$choice.Trim().ToLower(); if($$choice -eq '1' -or $$choice -eq 'app'){ $$cmd='$$(COMPOSE_$(1)) exec app /bin/bash' } elseif($$choice -eq '2' -or $$choice -eq 'db'){ $$cmd='$$(COMPOSE_$(1)) exec db psql -U $$(DB_USER_$(1)) -d $$(DB_NAME_$(1))' } elseif($$choice -eq '3' -or $$choice -eq 'redis'){ $$cmd='$$(COMPOSE_$(1)) exec redis redis-cli' } else { Write-Host 'Invalid choice'; exit 1 }; cmd /c $$cmd"
else
	@bash -eu -c 'echo "Select service to connect to:"; echo "  1) app (FastAPI application)"; echo "  2) db (PostgreSQL database)"; echo "  3) redis (Redis cache)"; printf "Enter choice [1-3 or app/db/redis]: "; read -r choice < /dev/tty; choice=$$(printf "%s" "$$choice" | tr "[:upper:]" "[:lower:]" | xargs); case "$$choice" in 1|app) $$(COMPOSE_$(1)) exec app /bin/bash ;; 2|db) $$(COMPOSE_$(1)) exec db psql -U $$(DB_USER_$(1)) -d $$(DB_NAME_$(1)) ;; 3|redis) $$(COMPOSE_$(1)) exec redis redis-cli ;; *) echo "Invalid choice"; exit 1 ;; esac'
endif

$(1)-shell-app: ## Shell into $(1) app
	$$(COMPOSE_$(1)) exec app /bin/bash

$(1)-shell-db: ## Shell into $(1) PostgreSQL
	$$(COMPOSE_$(1)) exec db psql -U $$(DB_USER_$(1)) -d $$(DB_NAME_$(1))

$(1)-shell-redis: ## Shell into $(1) Redis
	$$(COMPOSE_$(1)) exec redis redis-cli

$(1)-migrate: ## Run migrations for $(1)
	@echo "⬆️  Running migrations for $(1)..."
	$$(COMPOSE_$(1)) run --rm --entrypoint "" app alembic upgrade head

$(1)-migrate-status: ## Show migration status for $(1)
	$$(COMPOSE_$(1)) run --rm --entrypoint "" app alembic current

$(1)-migrate-history: ## Show migration history for $(1)
	$$(COMPOSE_$(1)) run --rm --entrypoint "" app alembic history

$(1)-db-reset: ## DESTRUCTIVE: reset $(1) database then re-run migrations
	@echo "⚠️  $(1)-db-reset is destructive (data loss)."
	@$(READ_CONFIRM) && ( \
		echo "🧹 Resetting $(1) database..." && \
		$$(COMPOSE_$(1)) down -v && \
		$$(COMPOSE_$(1)) up -d db redis && \
		$(SLEEP) 5 && \
		$$(COMPOSE_$(1)) run --rm --entrypoint "" app alembic upgrade head \
	) || (echo "❌ Reset cancelled"; exit 1)

$(1)-db-backup: ## Backup $(1) database into backups/
	@$(MKDIR) backups
	@echo "💾 Creating $(1) database backup..."
	$$(COMPOSE_$(1)) exec -T db pg_dump -U $$(DB_USER_$(1)) $$(DB_NAME_$(1)) > backups/$(1)_db_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created in backups/"

$(1)-db-restore: ## Restore $(1) database (use FILE=backups/file.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ ERROR: FILE is required"; \
		echo "Usage: make $(1)-db-restore FILE=backups/$(1)_db_YYYYmmdd_HHMMSS.sql"; \
		exit 1; \
	fi
	@echo "📥 Restoring $(1) database from $(FILE)..."
	$$(COMPOSE_$(1)) exec -T db psql -U $$(DB_USER_$(1)) $$(DB_NAME_$(1)) < $(FILE)
	@echo "✅ Restore complete"

$(1)-admin-create: ## Create or promote admin in $(1) (optional: EMAIL, FIRST_NAME, LAST_NAME, PHONE, PASSWORD)
	@echo "👤 Creating/promoting admin for $(1)..."
	@$(MAKE) --no-print-directory $(1)-migrate
	$$(COMPOSE_$(1)) run --rm --entrypoint "" \
		-e ADMIN_CREATE_EMAIL="$(EMAIL)" \
		-e ADMIN_CREATE_FIRST_NAME="$(FIRST_NAME)" \
		-e ADMIN_CREATE_LAST_NAME="$(LAST_NAME)" \
		-e ADMIN_CREATE_PHONE="$(PHONE)" \
		-e ADMIN_CREATE_PASSWORD="$(PASSWORD)" \
		app python -m app.scripts.create_admin

$(1)-logs: ## Tail all $(1) logs
	$$(COMPOSE_$(1)) logs -f

$(1)-logs-app: ## Tail $(1) app logs
	$$(COMPOSE_$(1)) logs -f app

$(1)-logs-db: ## Tail $(1) db logs
	$$(COMPOSE_$(1)) logs -f db

$(1)-logs-redis: ## Tail $(1) redis logs
	$$(COMPOSE_$(1)) logs -f redis

$(1)-health: ## Health checks for $(1)
	@echo "🏥 Health checks for $(1):"
	@$$(COMPOSE_$(1)) ps
	@echo "- database:" && $$(COMPOSE_$(1)) exec db pg_isready -U $$(DB_USER_$(1)) -d $$(DB_NAME_$(1)) || true
	@echo "- redis:" && $$(COMPOSE_$(1)) exec redis redis-cli ping || true
	@echo "- app:" && $$(COMPOSE_$(1)) exec app curl -fsS http://localhost:8000/api/v1/health/ >/dev/null && echo "OK" || echo "Not healthy"

$(1)-config: ## Render docker compose config for $(1)
	$$(COMPOSE_$(1)) config

$(1)-legacy-migrate-dry: ## Run legacy ETL dry-run for $(1)
	@if [ ! -f "$$(LEGACY_SQL_DUMP_$(1))" ]; then \
		echo "❌ SQL dump not found: $$(LEGACY_SQL_DUMP_$(1))"; \
		exit 1; \
	fi
	@echo "🧪 Running legacy ETL dry-run for $(1)..."
	$$(COMPOSE_$(1)) run --rm --entrypoint "" \
		-v "$$(LEGACY_SQL_DUMP_$(1)):$$(LEGACY_SQL_DUMP_CONTAINER_$(1)):ro" \
		app python app/scripts/legacy_migration_etl.py --source $$(LEGACY_SQL_DUMP_CONTAINER_$(1)) --report-dir $$(LEGACY_REPORTS_DIR_CONTAINER_$(1)) --dry-run

$(1)-legacy-migrate-apply: ## Apply legacy ETL for $(1)
	@if [ ! -f "$$(LEGACY_SQL_DUMP_$(1))" ]; then \
		echo "❌ SQL dump not found: $$(LEGACY_SQL_DUMP_$(1))"; \
		exit 1; \
	fi
	@echo "🚚 Applying legacy ETL for $(1)..."
	$$(COMPOSE_$(1)) run --rm --entrypoint "" \
		-v "$$(LEGACY_SQL_DUMP_$(1)):$$(LEGACY_SQL_DUMP_CONTAINER_$(1)):ro" \
		app python app/scripts/legacy_migration_etl.py --source $$(LEGACY_SQL_DUMP_CONTAINER_$(1)) --report-dir $$(LEGACY_REPORTS_DIR_CONTAINER_$(1)) --apply
endef

define TEST_TEMPLATE
PHONY_TARGETS += $(1)-test $(1)-test-unit $(1)-test-integration $(1)-test-fast $(1)-test-cov $(1)-test-specific $(1)-test-auth $(1)-test-booking $(1)-test-service

$(1)-test: ## Run all tests for $(1)
	@$(TEST_PRE_$(1))
	$$(TEST_CMD_$(1)) $(PYTEST_COV_ARGS)

$(1)-test-unit: ## Run unit tests for $(1)
	@$(TEST_PRE_$(1))
	$$(TEST_CMD_$(1)) -m unit $(PYTEST_COV_ARGS)

$(1)-test-integration: ## Run integration tests for $(1)
	@$(TEST_PRE_$(1))
	$$(TEST_CMD_$(1)) -m integration $(PYTEST_COV_ARGS)

$(1)-test-fast: ## Run fast tests for $(1) (exclude slow)
	@$(TEST_PRE_$(1))
	$$(TEST_CMD_$(1)) -m "not slow" $(PYTEST_COV_ARGS)

$(1)-test-cov: ## Run tests with coverage for $(1)
	@$(TEST_PRE_$(1))
	$$(TEST_CMD_$(1)) $(PYTEST_COV_ARGS)

$(1)-test-specific: ## Run specific test file for $(1) (use FILE=tests/test_foo.py)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ ERROR: FILE is required"; \
		echo "Usage: make $(1)-test-specific FILE=tests/test_auth_endpoints.py"; \
		exit 1; \
	fi
	@$(TEST_PRE_$(1))
	$$(TEST_CMD_$(1)) $(FILE) $(PYTEST_COV_ARGS)

$(1)-test-auth: ## Run auth tests for $(1)
	@$(TEST_PRE_$(1))
	$$(TEST_CMD_$(1)) -m auth $(PYTEST_COV_ARGS)

$(1)-test-booking: ## Run booking tests for $(1)
	@$(TEST_PRE_$(1))
	$$(TEST_CMD_$(1)) -m booking $(PYTEST_COV_ARGS)

$(1)-test-service: ## Run service tests for $(1)
	@$(TEST_PRE_$(1))
	$$(TEST_CMD_$(1)) -m service $(PYTEST_COV_ARGS)
endef

define PGADMIN_TEMPLATE
PHONY_TARGETS += $(1)-pgadmin
$(1)-pgadmin: ## Start $(1) with PgAdmin (tools profile)
	@echo "🔧 Starting $(1) with PgAdmin profile..."
	$$(COMPOSE_$(1)) --profile tools up -d
endef

$(foreach env,$(ENVS),$(eval $(call ENV_TEMPLATE,$(env))))
$(foreach env,$(TEST_ENVS),$(eval $(call TEST_TEMPLATE,$(env))))
$(foreach env,$(PGADMIN_ENVS),$(eval $(call PGADMIN_TEMPLATE,$(env))))

.PHONY: $(PHONY_TARGETS)

# --------------------------------------------
# Local testing DB helpers
# --------------------------------------------
local-test-db-start: ## Start local test database (profile test)
	@echo "🗄️  Starting local test database..."
	$(COMPOSE_local) --profile test up -d db-test
	@$(SLEEP) 3

local-test-db-stop: ## Stop local test database
	$(COMPOSE_local) stop db-test

local-test-db-clean: ## Stop and remove local test database volume
	$(COMPOSE_local) --profile test down -v db-test

local-db-reinit: ## DESTRUCTIVE: recreate local DB volume and rerun migrations
	@echo "⚠️  local-db-reinit will delete local database data"
	@$(READ_CONFIRM) && ( \
		$(MAKE) --no-print-directory local-down-v && \
		$(MAKE) --no-print-directory local-up && \
		$(MAKE) --no-print-directory local-migrate \
	) || (echo "❌ local-db-reinit cancelled"; exit 1)

# --------------------------------------------
# Meta targets
# --------------------------------------------
help: ## Show available targets
	@echo "Ganitel Backend - Available Commands"
	@echo ""
	@echo "Meta:"
	@echo "  help, all-up, all-down, all-logs, status, clean, clean-all"
	@echo "  install, install-with-tests, rebuild"
	@echo ""
	@echo "Local test DB helpers:"
	@echo "  local-test-db-start, local-test-db-stop, local-test-db-clean"
	@echo "  local-db-reinit"
	@echo ""
	@echo "Local (uv) — lint & types:"
	@echo "  local-lint, local-format, local-typecheck, local-check"
	@echo ""
	@for env in $(ENVS); do \
		echo "$$env targets:"; \
		echo "  $$env-build $$env-up $$env-down $$env-down-v $$env-delete $$env-restart $$env-stop $$env-start $$env-ps"; \
		echo "  $$env-shell $$env-shell-app $$env-shell-db $$env-shell-redis"; \
		echo "  $$env-migrate $$env-migrate-status $$env-migrate-history"; \
		echo "  $$env-db-reset $$env-db-backup $$env-db-restore $$env-admin-create"; \
		echo "  $$env-legacy-migrate-dry $$env-legacy-migrate-apply"; \
		echo "  $$env-logs $$env-logs-app $$env-logs-db $$env-logs-redis"; \
		echo "  $$env-health $$env-config"; \
		case " $(TEST_ENVS) " in *" $$env "*) \
			echo "  $$env-test $$env-test-unit $$env-test-integration $$env-test-fast $$env-test-cov"; \
			echo "  $$env-test-specific $$env-test-auth $$env-test-booking $$env-test-service"; \
		esac; \
		case " $(PGADMIN_ENVS) " in *" $$env "*) echo "  $$env-pgadmin" ;; esac; \
		echo ""; \
	done
	@echo "Detected OS: $(DETECTED_OS)"
	@echo "Enabled environments: $(ENVS)"

all-up: ## Start all enabled environments
	@for env in $(ENVS); do $(MAKE) --no-print-directory $$env-up; done

all-down: ## Stop all enabled environments
	@for env in $(ENVS); do $(MAKE) --no-print-directory $$env-down; done

all-logs: ## Tail logs for all enabled environments
	@$(foreach env,$(ENVS),$(COMPOSE_$(env)) logs -f & ) wait

status: ## Show container status for all enabled environments
	@for env in $(ENVS); do \
		echo ""; \
		echo "===== $$env ====="; \
		$(MAKE) --no-print-directory $$env-ps; \
	done

clean: ## Remove dangling containers and images (safe)
	docker container prune -f
	docker image prune -f

clean-all: ## DESTRUCTIVE: remove all enabled env resources
	@echo "⚠️  clean-all is destructive."
	@$(READ_CONFIRM) && ( \
		for env in $(ENVS); do $(MAKE) --no-print-directory $$env-delete; done \
	) || (echo "❌ clean-all cancelled"; exit 1)

# --------------------------------------------
# One-off setup targets
# --------------------------------------------
install: ## Fresh local setup: build -> up -> migrate
	@$(MAKE) --no-print-directory local-build
	@$(MAKE) --no-print-directory local-up
	@$(MAKE) --no-print-directory local-migrate
	@echo "✅ Local install complete"
	@echo "📍 API: http://localhost:8000"
	@echo "📍 Docs: http://localhost:8000/docs"

install-with-tests: install ## Install + start local test database
	@$(MAKE) --no-print-directory local-test-db-start
	@echo "✅ Local test database ready"

rebuild: ## Rebuild local: down -> build -> up
	@$(MAKE) --no-print-directory local-down
	@$(MAKE) --no-print-directory local-build
	@$(MAKE) --no-print-directory local-up



# ============================================
# LOCAL OVERRIDES — FastAPI runs via uv, not Docker
# ============================================

local-dev: ## Start FastAPI dev server locally via uv
	uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

local-migrate: ## Run Alembic migrations locally via uv
	uv run alembic upgrade head

local-migrate-status: ## Show current Alembic revision locally
	uv run alembic current

local-migrate-history: ## Show Alembic migration history locally
	uv run alembic history

local-shell-app: ## Open Python REPL via uv
	uv run python

local-admin-create: ## Create admin locally via uv (EMAIL, PASSWORD, etc.)
	uv run python -m app.scripts.create_admin

local-lint: ## Lint with ruff
	uv run ruff check .

local-format: ## Format with ruff
	uv run ruff format .

local-typecheck: ## Type check with ty
	uv run ty check .

local-check: ## Ruff lint + format check + ty (same as CI)
	uv run ruff check .
	uv run ruff format --check .
	uv run ty check .

local-test: ## Run all tests locally via uv
	@$(MAKE) --no-print-directory local-test-db-start
	uv run pytest $(PYTEST_COV_ARGS)

local-test-unit: ## Run unit tests locally via uv
	@$(MAKE) --no-print-directory local-test-db-start
	uv run pytest -m unit $(PYTEST_COV_ARGS)

local-test-integration: ## Run integration tests locally via uv
	@$(MAKE) --no-print-directory local-test-db-start
	uv run pytest -m integration $(PYTEST_COV_ARGS)

local-test-fast: ## Run fast tests locally via uv
	@$(MAKE) --no-print-directory local-test-db-start
	uv run pytest -m "not slow" $(PYTEST_COV_ARGS)

local-test-cov: ## Run tests with coverage locally via uv
	@$(MAKE) --no-print-directory local-test-db-start
	uv run pytest $(PYTEST_COV_ARGS)

local-test-specific: ## Run specific test file locally (FILE=tests/test_foo.py)
	@if [ -z "$(FILE)" ]; then echo "❌ FILE is required. Usage: make local-test-specific FILE=tests/test_foo.py"; exit 1; fi
	@$(MAKE) --no-print-directory local-test-db-start
	uv run pytest $(FILE) $(PYTEST_COV_ARGS)

local-test-auth: ## Run auth tests locally via uv
	@$(MAKE) --no-print-directory local-test-db-start
	uv run pytest -m auth $(PYTEST_COV_ARGS)

local-test-booking: ## Run booking tests locally via uv
	@$(MAKE) --no-print-directory local-test-db-start
	uv run pytest -m booking $(PYTEST_COV_ARGS)

local-test-service: ## Run service tests locally via uv
	@$(MAKE) --no-print-directory local-test-db-start
	uv run pytest -m service $(PYTEST_COV_ARGS)

local-legacy-migrate-dry: ## Run legacy ETL dry-run locally via uv
	@if [ ! -f "$(LEGACY_SQL_DUMP_local)" ]; then echo "❌ SQL dump not found: $(LEGACY_SQL_DUMP_local)"; exit 1; fi
	uv run python app/scripts/legacy_migration_etl.py --source $(LEGACY_SQL_DUMP_local) --report-dir /tmp/legacy_migration_reports --dry-run

local-legacy-migrate-apply: ## Apply legacy ETL locally via uv
	@if [ ! -f "$(LEGACY_SQL_DUMP_local)" ]; then echo "❌ SQL dump not found: $(LEGACY_SQL_DUMP_local)"; exit 1; fi
	uv run python app/scripts/legacy_migration_etl.py --source $(LEGACY_SQL_DUMP_local) --report-dir /tmp/legacy_migration_reports --apply

install: ## Fresh local setup: start services -> install deps -> migrate
	@$(MAKE) --no-print-directory local-up
	uv sync
	@$(MAKE) --no-print-directory local-migrate
	@echo "✅ Local install complete"
	@echo "📍 Start API: make local-dev"
	@echo "📍 API docs:  http://localhost:8000/docs"

install-with-tests: install ## Install + start test database
	@$(MAKE) --no-print-directory local-test-db-start
	@echo "✅ Test database ready"

rebuild: ## Rebuild local services (down -> up)
	@$(MAKE) --no-print-directory local-down
	@$(MAKE) --no-print-directory local-up
