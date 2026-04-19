.PHONY: help build up down down-v logs shell test test-unit test-unit-domain test-integration test-coverage restart clean staging-up staging-down staging-down-v staging-logs staging-test staging-build staging-test-unit staging-test-integration staging-test-all staging-test-all-including-slow staging-test-critical-workflow staging-test-libtorrent staging-logs-api staging-logs-worker staging-logs-cron staging-logs-postgres staging-logs-redis staging-shell-api staging-shell-worker staging-shell-cron staging-restart-api staging-restart-worker staging-restart-cron staging-ps prod-build prod-up prod-down prod-down-v prod-logs prod-ps prod-test prod-shell prod-shell-api prod-shell-worker prod-shell-cron prod-logs-api prod-logs-worker prod-logs-cron prod-logs-redis prod-restart-api prod-restart-worker prod-restart-cron

# Default target
help:
	@echo "CineYang Backend - Available Commands"
	@echo "===================================="
	@echo ""
	@echo "Local Environment:"
	@echo "  make build              Build Docker images"
	@echo "  make up                 Start all services"
	@echo "  make down               Stop all services"
	@echo "  make down-v             Stop all services and remove volumes"
	@echo "  make restart            Restart all services"
	@echo "  make logs               View logs from all services"
	@echo "  make logs-api           View logs from API service only"
	@echo "  make shell              Open shell in API container"
	@echo "  make clean              Remove containers, volumes, and networks"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test               Run all tests"
	@echo "  make test-unit          Run unit tests only"
	@echo "  make test-unit-domain   Run unit tests for domain only"
	@echo "  make test-integration   Run integration tests"
	@echo "  make test-coverage      Run tests with coverage report"
	@echo ""
	@echo "Database Commands:"
	@echo "  make migrate            Run database migrations"
	@echo "  make migrate-create     Create a new migration"
	@echo ""
	@echo "Staging Environment:"
	@echo "  make staging-build      Build staging images"
	@echo "  make staging-up         Start staging environment"
	@echo "  make staging-down       Stop staging environment"
	@echo "  make staging-down-v     Stop staging environment and remove volumes"
	@echo "  make staging-logs       View staging logs (all services)"
	@echo "  make staging-ps         Show staging container status"
	@echo ""
	@echo "Staging Testing Commands:"
	@echo "  make staging-test          Run staging-specific tests only"
	@echo "  make staging-test-unit     Run unit tests (domain, infrastructure)"
	@echo "  make staging-test-integration Run integration tests"
	@echo "  make staging-test-critical-workflow  Run critical workflow staging tests"
	@echo "  make staging-test-all      Run all tests (excluding slow/expensive)"
	@echo "  make staging-test-all-including-slow  Run all tests INCLUDING slow (with confirmation)"
	@echo ""
	@echo "Staging Container Logs:"
	@echo "  make staging-logs-api       View API logs"
	@echo "  make staging-logs-worker    View worker logs"
	@echo "  make staging-logs-cron     View cron logs"
	@echo "  make staging-logs-postgres View postgres logs"
	@echo "  make staging-logs-redis    View redis logs"
	@echo ""
	@echo "Staging Container Shells:"
	@echo "  make staging-shell          Open shell in API container"
	@echo "  make staging-shell-api      Open shell in API container"
	@echo "  make staging-shell-worker   Open shell in worker container"
	@echo "  make staging-shell-cron     Open shell in cron container"
	@echo ""
	@echo "Staging Container Restart:"
	@echo "  make staging-restart-api    Restart API container"
	@echo "  make staging-restart-worker Restart worker container"
	@echo "  make staging-restart-cron   Restart cron container"
	@echo ""
	@echo "Production Environment:"
	@echo "  make prod-build         Build production images"
	@echo "  make prod-up            Start production environment"
	@echo "  make prod-down          Stop production environment"
	@echo "  make prod-down-v        Stop production environment and remove volumes"
	@echo "  make prod-logs          View production logs (all services)"
	@echo "  make prod-ps            Show production container status"
	@echo ""
	@echo "Production Testing Commands:"
	@echo "  make prod-test          Run production health tests only"
	@echo ""
	@echo "Production Container Logs:"
	@echo "  make prod-logs-api       View API logs"
	@echo "  make prod-logs-worker    View worker logs"
	@echo "  make prod-logs-cron      View cron logs"
	@echo "  make prod-logs-redis     View redis logs"
	@echo ""
	@echo "Production Container Shells:"
	@echo "  make prod-shell          Open shell in API container"
	@echo "  make prod-shell-api      Open shell in API container"
	@echo "  make prod-shell-worker   Open shell in worker container"
	@echo "  make prod-shell-cron     Open shell in cron container"
	@echo ""
	@echo "Production Container Restart:"
	@echo "  make prod-restart-api    Restart API container"
	@echo "  make prod-restart-worker Restart worker container"
	@echo "  make prod-restart-cron   Restart cron container"
	@echo ""

# Detect docker-compose command (docker compose or docker-compose)
# Cross-platform detection
ifeq ($(OS),Windows_NT)
    # Windows: try docker-compose first, fallback to docker compose
    DOCKER_COMPOSE := $(shell powershell -NoProfile -Command "if (Get-Command docker-compose -ErrorAction SilentlyContinue) { Write-Host 'docker-compose' } else { Write-Host 'docker compose' }")
    PYTHON := python
    CHECK_ENV_STAGING := python -c "import os, sys; sys.exit(0 if os.path.exists('.env.staging') else (print('Error: .env.staging not found') or 1))"
	CHECK_ENV_PROD := python -c "import os, sys; sys.exit(0 if os.path.exists('.env.prod') else (print('Error: .env.prod not found') or 1))"
    SLEEP := python -c "import time; time.sleep(20)"
    CLEAN_PYCACHE := python scripts/clean_pycache.py
    CONFIRM_PROMPT := powershell -NoProfile -Command "$$response = Read-Host 'Continue? [y/N]'; if ($$response -eq 'y' -or $$response -eq 'Y') { exit 0 } else { Write-Host 'Aborted.'; exit 1 }"
else
    # Unix/Linux/Mac: try docker-compose, fallback to docker compose
    DOCKER_COMPOSE := $(shell command -v docker-compose >/dev/null 2>&1 && echo docker-compose || echo "docker compose")
    PYTHON := python3
    CHECK_ENV_STAGING := python3 -c "import os, sys; sys.exit(0 if os.path.exists('.env.staging') else (print('Error: .env.staging not found') or 1))"
	CHECK_ENV_PROD := python3 -c "import os, sys; sys.exit(0 if os.path.exists('.env.prod') else (print('Error: .env.prod not found') or 1))"
    SLEEP := sleep 20
    CLEAN_PYCACHE := python3 scripts/clean_pycache.py
    CONFIRM_PROMPT := bash -c 'read -p "Continue? [y/N] " -n 1 -r && echo && [[ $$REPLY =~ ^[Yy]$$ ]]'
endif

# Docker commands
build:
	$(DOCKER_COMPOSE) up -d --build

up:
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down

down-v:
	$(DOCKER_COMPOSE) down -v

restart: down up

logs:
	$(DOCKER_COMPOSE) logs -f

logs-api:
	$(DOCKER_COMPOSE) logs -f api

shell:
	$(DOCKER_COMPOSE) exec api /bin/bash

# Testing commands
test:
	$(DOCKER_COMPOSE) exec api pytest tests/ -v

test-unit:
	$(DOCKER_COMPOSE) exec api pytest tests/unit/ -v

test-unit-domain:
	$(DOCKER_COMPOSE) exec api pytest tests/unit/domain -v

test-unit-entities:
	$(DOCKER_COMPOSE) exec api pytest tests/unit/domain/entities -v

test-unit-validators:
	$(DOCKER_COMPOSE) exec api pytest tests/unit/domain/validators -v

test-unit-value-objects:
	$(DOCKER_COMPOSE) exec api pytest tests/unit/domain/value_objects -v

test-integration:
	$(DOCKER_COMPOSE) exec api pytest tests/integration/ -v

test-coverage:
	$(DOCKER_COMPOSE) exec api pytest tests/ --cov=src --cov-report=html --cov-report=term

# Database commands
migrate:
	$(DOCKER_COMPOSE) exec api alembic upgrade head

migrate-create:
	@message=$$($(PYTHON) scripts/get_migration_message.py); \
	$(DOCKER_COMPOSE) exec api alembic revision --autogenerate -m "$$message"

# Cleanup
clean:
	$(DOCKER_COMPOSE) down -v
	@$(CLEAN_PYCACHE)

# Health check
health:
	@echo "Checking service health..."
	@$(DOCKER_COMPOSE) ps

# Staging environment commands
staging-build:
	@$(CHECK_ENV_STAGING) || (echo "Copy .env.staging.example to .env.staging" && exit 1)
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging build

staging-up:
	@$(CHECK_ENV_STAGING) || (echo "Copy .env.staging.example to .env.staging" && exit 1)
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging up -d
	@echo "Waiting for services to be healthy..."
	@$(SLEEP)
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec -T api alembic upgrade head || true

staging-down:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging down

staging-down-v:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging down -v

staging-logs:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging logs -f

staging-test:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec api pytest tests/staging -v -m staging

staging-test-unit:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec api pytest tests/unit -v -m unit

staging-test-integration:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec api pytest tests/integration -v

staging-test-all:
	@$(CHECK_ENV_STAGING) || exit 1
	@echo "Running full test suite in staging environment..."
	@echo "  - Unit tests (domain, infrastructure)"
	@echo "  - Integration tests"
	@echo "  - Staging-specific tests (excluding slow/expensive)"
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec api pytest tests/unit tests/integration tests/staging -v -m "not slow"

staging-test-all-including-slow:
	@$(CHECK_ENV_STAGING) || exit 1
	@echo "Running FULL test suite (including slow/expensive tests)..."
	@echo "WARNING: This will make real API calls to Bunny, R2, TMDB"
	@echo "WARNING: May take 5-10 minutes and incur costs"
	@if [ "$(CI)" = "true" ]; then \
		echo "CI=true detected: running tests without confirmation"; \
		$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec api pytest tests/unit tests/integration tests/staging -v; \
	else \
		$(CONFIRM_PROMPT) || (echo "Aborted." && exit 1); \
		$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec api pytest tests/unit tests/integration tests/staging -v; \
	fi

staging-test-critical-workflow:
	@$(CHECK_ENV_STAGING) || exit 1
	@echo "Running critical workflow staging tests (real services)..."
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec api pytest tests/staging/test_critical_workflow.py -v -m staging

staging-test-libtorrent:
	@$(CHECK_ENV_STAGING) || exit 1
	@echo "Running libtorrent extraction test in worker container..."
	@echo "Note: This test requires libtorrent (available in worker) and a test torrent file"
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec worker pytest tests/staging/test_staging_workflow.py::test_libtorrent_extraction_staging -v

staging-shell:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec api /bin/bash

staging-shell-api:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec api /bin/bash

staging-shell-worker:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec worker /bin/bash

staging-shell-cron:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging exec cron /bin/bash

# Staging container logs
staging-logs-api:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging logs -f api

staging-logs-worker:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging logs -f worker

staging-logs-cron:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging logs -f cron

staging-logs-postgres:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging logs -f postgres

staging-logs-redis:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging logs -f redis

# Staging container restart
staging-restart-api:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging restart api

staging-restart-worker:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging restart worker

staging-restart-cron:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging restart cron

# Staging container status
staging-ps:
	@$(CHECK_ENV_STAGING) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.staging.yml --env-file .env.staging ps

# Production environment commands
prod-build:
	@$(CHECK_ENV_PROD) || (echo "Copy .env.prod.example to .env.prod" && exit 1)
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod build

prod-up:
	@$(CHECK_ENV_PROD) || (echo "Copy .env.prod.example to .env.prod" && exit 1)
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod up -d
	@echo "Waiting for services to be healthy..."
	@$(SLEEP)
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod exec -T api alembic upgrade head || true

prod-down:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod down

prod-down-v:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod down -v

prod-logs:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod logs -f

prod-test:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod exec api pytest tests/production -v -m production

prod-shell:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod exec api /bin/bash

prod-shell-api:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod exec api /bin/bash

prod-shell-worker:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod exec worker /bin/bash

prod-shell-cron:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod exec cron /bin/bash

# Production container logs
prod-logs-api:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod logs -f api

prod-logs-worker:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod logs -f worker

prod-logs-cron:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod logs -f cron

prod-logs-redis:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod logs -f redis

# Production container restart
prod-restart-api:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod restart api

prod-restart-worker:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod restart worker

prod-restart-cron:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod restart cron

# Production container status
prod-ps:
	@$(CHECK_ENV_PROD) || exit 1
	$(DOCKER_COMPOSE) -f docker-compose.prod.yml --env-file .env.prod ps