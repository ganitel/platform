# Makefile Strategy & Architecture

## Overview

This document outlines the **cross-platform, DRY (Don't Repeat Yourself) Makefile** strategy for Ganitel Backend, designed to eliminate duplication across local, staging, and production environments.

---

## Core Architecture

### 1. **Multi-Environment Design**

Three separate Docker Compose files per environment:
- `docker-compose.local.yml` - Local development
- `docker-compose.staging.yml` - Staging environment
- `docker-compose.prod.yml` - Production environment (to be created)

**Rationale**: Each environment has unique configurations (ports, resource limits, secrets handling, healthchecks), which become unwieldy to manage via overrides.

### 2. **Dynamic Target Generation (DRY Principle)**

Instead of manually duplicating targets for each environment (~200 lines of repetition), we use GNU Make's **`eval` + `call`** functions to generate targets from templates.

**Pattern**:
```makefile
define ENV_TEMPLATE
$(1)-build:
	@echo "🔨 Building $(1)..."
	$$(COMPOSE_$(1)) build

$(1)-up:
	@echo "🚀 Starting $(1)..."
	$$(COMPOSE_$(1)) up -d
    
# ... more targets
endef

ENVS := local staging prod
$(foreach env,$(ENVS),$(eval $(call ENV_TEMPLATE,$(env))))
```

**Benefit**: Define a target once, it automatically works for all three environments (`local-build`, `staging-build`, `prod-build`).

### 3. **Platform Compatibility (Windows & Linux)**

Use conditional logic to detect OS and set appropriate commands:

```makefile
ifeq ($(OS),Windows_NT)
    DETECTED_OS := windows
    SLEEP := powershell -Command "Start-Sleep -Seconds"
    MKDIR := powershell -Command "New-Item -ItemType Directory -Force -Path"
    RM_MIGRATIONS := powershell command to delete migrations
    READ_CONFIRM := powershell -Command "$$confirm = Read-Host 'Type yes'; if ($$confirm -eq 'yes') { exit 0 }"
else
    DETECTED_OS := unix
    SLEEP := sleep
    MKDIR := mkdir -p
    RM_MIGRATIONS := find migrations/versions -name '*.py' ! -name '__init__.py' -delete
    READ_CONFIRM := bash -c 'read -p "Type yes: " c; [ "$$c" = "yes" ]'
endif
```

---

## Target Structure

### Generated Targets (Per Environment)

Each environment (`local`, `staging`, `prod`) gets these targets via the template:

#### **Container Lifecycle**
| Target | Purpose |
|--------|---------|
| `{env}-build` | Build Docker images |
| `{env}-up` | Start all services (detached) |
| `{env}-down` | Stop all services, preserve volumes |
| `{env}-down-v` | Stop all services, **delete volumes** |
| `{env}-delete` | **Full cleanup**: remove containers, images, networks, volumes |
| `{env}-restart` | Restart all services |
| `{env}-stop` | Stop without removing |
| `{env}-start` | Start stopped services |
| `{env}-ps` | List running containers |

#### **Shell Access**
| Target | Purpose |
|--------|---------|
| `{env}-shell` | **Interactive menu** to select service shell (app, db, redis) |
| `{env}-shell-app` | Shell into app container |
| `{env}-shell-db` | Shell into database |
| `{env}-shell-redis` | Shell into Redis CLI |

#### **Database & Migrations**
| Target | Purpose |
|--------|---------|
| `{env}-migrate` | Run all pending migrations (alembic upgrade head) |
| `{env}-migrate-status` | Show current migration version |
| `{env}-migrate-history` | Show all migration history |
| `{env}-db-reset` | **DESTRUCTIVE**: Stop, remove volumes, re-migrate |
| `{env}-db-backup` | Backup database to `backups/` |
| `{env}-db-restore` | Restore from backup file (require `FILE=path/to/backup.sql`) |

#### **Logs**
| Target | Purpose |
|--------|---------|
| `{env}-logs` | Tail all service logs |
| `{env}-logs-app` | Tail app logs only |
| `{env}-logs-db` | Tail database logs only |
| `{env}-logs-redis` | Tail Redis logs only |

#### **Testing** (local & staging only)
| Target | Purpose |
|--------|---------|
| `{env}-test` | Run all tests |
| `{env}-test-unit` | Run unit tests only |
| `{env}-test-integration` | Run integration tests only |
| `{env}-test-fast` | Fast tests (exclude slow) |
| `{env}-test-cov` | Tests with coverage report |
| `{env}-test-specific` | Run specific test file (`FILE=tests/test_auth.py`) |
| `{env}-test-auth` | Auth tests |
| `{env}-test-booking` | Booking tests |
| `{env}-test-service` | Service tests |

#### **Utilities**
| Target | Purpose |
|--------|---------|
| `{env}-pgadmin` | Start with PgAdmin (via `--profile tools`) - local/staging only |
| `{env}-health` | Check service health (database, redis, app) |
| `{env}-config` | Show docker-compose config |

### Meta Targets (Cross-Environment)

| Target | Purpose |
|--------|---------|
| `help` | Show all available targets |
| `all-up` | Start all environments (local + staging + prod) |
| `all-down` | Stop all environments |
| `all-logs` | Tail logs from ALL environments simultaneously |
| `status` | Show status of all environments |
| `clean` | Remove dangling containers/images (safe, doesn't touch data) |
| `clean-all` | **DESTRUCTIVE**: Remove everything (all envs, volumes, images) |

### One-Off Setup Targets

| Target | Purpose |
|--------|---------|
| `install` | Fresh setup: build → migrate → up (local) |
| `install-with-tests` | Install + start test database |
| `rebuild` | Clean rebuild: down → build → up (local) |

---

## Usage Examples

### Local Development

```bash
# Initial setup
make install                    # Build, migrate, start (local)

# Daily workflow
make local-up                   # Start services
make local-logs                 # View logs
make local-shell                # Menu to pick: app / db / redis shell
make local-test                 # Run tests
make local-down                 # Stop (preserve data)

# Database operations
make local-db-backup            # Backup database
make local-migrate              # Run new migrations
make local-db-reset             # Full reset (destructive)

# Cleanup
make local-down-v               # Stop and remove volumes
make local-delete               # Remove containers, images, networks
```

### Staging Deployment

```bash
# Deploy
make staging-build              # Build staging images
make staging-up                 # Start staging services
make staging-migrate            # Run migrations
make staging-test-unit          # Run unit tests

# Troubleshooting
make staging-logs               # View logs
make staging-shell              # Open shell (menu)
make staging-health             # Health check
make staging-db-backup          # Create backup before changes

# Reset if needed
make staging-db-reset           # Full database reset
make staging-delete             # Remove all staging resources
```

### Production

```bash
make prod-build                 # Build prod images
make prod-up                    # Start prod services
make prod-migrate               # Run migrations
make prod-logs                  # View logs
make prod-shell                 # Access production shell (emergency only)
make prod-health                # Health check
make prod-db-backup             # Backup before maintenance
```

### Cross-Environment

```bash
make status                     # Show all endpoints and container status
make all-down                   # Stop all environments
make clean-all                  # Nuclear option: remove everything
```

---

## Implementation Details

### 1. **Shell Menu (Interactive Selection)**

When running `make {env}-shell`, users are presented with:

```
Select service to connect to:
  1) app (FastAPI application)
  2) db (PostgreSQL database)
  3) redis (Redis cache)
Enter choice [1-3]:
```

Uses shell `select` on Unix, PowerShell menu on Windows.

### 2. **Port Cleanup on Delete**

The `{env}-delete` target:
- Stops and removes containers
- Removes networks
- **Removes volumes** (data is deleted)
- Removes images
- **Frees up ports** by killing processes bound to app/db ports

**Windows** (PowerShell):
```powershell
netstat -ano | findstr :PORT | For-Object { taskkill /PID $pid /F }
```

**Unix** (bash):
```bash
lsof -ti:PORT | xargs kill -9
```

### 3. **Confirmation Prompts**

Destructive operations (`db-reset`, `delete`, `clean-all`) use environment-specific confirmation:
- Unix: `read -p "Type yes to confirm: "`
- Windows: `Read-Host` from PowerShell

### 4. **Environment Variables**

Variables are defined per-environment:
```makefile
COMPOSE_local := docker compose -f docker-compose.local.yml --env-file .env.local
COMPOSE_staging := docker compose -f docker-compose.staging.yml --env-file .env.staging
COMPOSE_prod := docker compose -f docker-compose.prod.yml --env-file .env.prod
```

Allows flexibility for secret management and environment-specific configs.

---

## Key Decisions

1. **Delete ≠ Reset Migrations**  
   `{env}-delete` removes Docker resources only. Migrations remain on disk (`migrations/versions/`). This is safer—you can inspect migration history even after cleanup.

2. **Database Backups Automatic**  
   Backups go to `backups/` with timestamp: `backups/local_db_20260220_153045.sql`

3. **Testing Database Always Separate**  
   Uses `--profile test` to keep test DB isolated from dev DB.

4. **No `prod-pgadmin`**  
   PgAdmin only available in `local-pgadmin` and `staging-pgadmin` (security).

5. **Logs Follow Best Practice**  
   All `{env}-logs*` targets use `-f` (follow mode) unless running in CI.

---

## Platform-Specific Behavior

| Feature | Linux | Windows |
|---------|-------|---------|
| Shell command | `/bin/bash` | `cmd.exe` (Git Bash fallback) |
| Sleep | `sleep 5` | `Start-Sleep -Seconds 5` |
| Delete migrations | `find ... -delete` | PowerShell loop + `Remove-Item` |
| Read confirmation | `read` + bash | `Read-Host` from PowerShell |
| Path separators | `/` (handled by Docker) | `\` (Docker Compose abstracts) |

---

## File Structure

```
Makefile                                    # Single unified Makefile
docker-compose.local.yml                   # Local
docker-compose.staging.yml                 # Staging
docker-compose.prod.yml                    # Production (WIP)
.env.local                                 # Local secrets
.env.staging                               # Staging secrets
.env.prod                                  # Production secrets (on VPS only)
migrations/                                # Migration files (not cleaned by delete)
backups/                                   # Database backups (auto-created)
```

---

## Design Patterns Used

1. **Template-Based Generation**: Eliminates ~70% duplication
2. **Phony Targets**: All targets marked `.PHONY` for safety
3. **Conditional Compilation**: Platform detection at Makefile parse time
4. **Helper Functions**: `ENV_TEMPLATE` called for each environment
5. **Consistent Naming**: `{env}-{action}` pattern is predictable
6. **Error Handling**: Confirmation prompts on destructive ops
7. **Documentation**: Inline comments + help target

---

## Future Enhancements

- [ ] Add `{env}-logs-watch` with service filtering
- [ ] Add `{env}-perf` target to run performance tests
- [ ] Add `{env}-deploy-check` to verify pre-deployment health
- [ ] Add `{env}-lint` target for Dockerfile/compose validation
- [ ] Add auto-detection of `.env` files (don't require manual `--env-file`)

---

## Quick Reference

```makefile
# Typical workflow
make install              # 🎯 First time only
make local-up             # ▶️ Start work
make local-test           # 🧪 Test
make local-logs           # 📋 Inspect
make local-shell          # 🐚 Debug
make local-down           # ⏹️ End session
```

