# Ganitel Backend - Quick Start Guide

## 🚀 Local Development Setup

This guide covers the automated Docker-based local development environment with integrated database migrations and admin user creation.

---

## Prerequisites

- Docker Desktop installed and running
- Git
- (Optional) Make utility for easier command execution

---

## Quick Start (3 Steps)

### 1. Build Docker Images
```bash
docker-compose -f docker-compose.local.yml build
```

### 2. Create Initial Migration
```bash
docker-compose -f docker-compose.local.yml run --rm --no-deps --entrypoint "alembic" app revision --autogenerate -m "initial_schema"
```

### 3. Start All Services
```bash
docker-compose -f docker-compose.local.yml up -d
```

**That's it!** The system will:
- ✅ Start PostgreSQL and Redis
- ✅ Auto-run database migrations
- ✅ Create default admin account
- ✅ Start FastAPI application

---

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:8000 | - |
| **API Docs** | http://localhost:8000/docs | - |
| **PgAdmin** | http://localhost:5050 | admin@ganitel.local / admin123 |

### Default Admin Account
```
Email: admin@ganitel.com
Password: YourSecurePassword123!
```
⚠️ **Change this password after first login!**

---

## Using Makefile (Recommended)

If you have `make` installed, use these convenient commands:

```bash
# Build images
make build

# Create initial migration
make migrate-init

# Start all services
make up

# View logs
make logs

# Stop services
make down
```

### Available Make Commands

#### Docker Operations
```bash
make build          # Build Docker images
make up             # Start all services
make down           # Stop and remove containers
make restart        # Restart services
make logs           # Tail all logs
make logs-app       # Tail app logs only
make ps             # List running containers
```

#### Database Migrations
```bash
make migrate-init                       # Create initial migration
make migrate-create MESSAGE="add_field" # Create new migration
make migrate-upgrade                    # Apply migrations
make migrate-downgrade                  # Rollback last migration
make migrate-current                    # Show current version
make migrate-history                    # Show migration history
```

#### Shell Access
```bash
make shell          # Open shell in app container
make db-shell       # Open PostgreSQL shell
make redis-cli      # Open Redis CLI
```

#### Database Operations
```bash
make db-backup      # Backup database
make db-reset       # Reset database (DESTRUCTIVE!)
```

#### Testing
```bash
make test           # Run tests
make test-cov       # Run tests with coverage
```

---

## Manual Commands (Without Make)

### Database Migration Commands

#### Create a new migration
```bash
docker-compose -f docker-compose.local.yml run --rm --no-deps --entrypoint "alembic" app revision --autogenerate -m "migration_name"
```

#### Apply migrations
```bash
docker-compose -f docker-compose.local.yml run --rm --no-deps --entrypoint "alembic" app upgrade head
```

#### Rollback migration
```bash
docker-compose -f docker-compose.local.yml run --rm --no-deps --entrypoint "alembic" app downgrade -1
```

#### View current migration
```bash
docker-compose -f docker-compose.local.yml run --rm --no-deps --entrypoint "alembic" app current
```

#### View migration history
```bash
docker-compose -f docker-compose.local.yml run --rm --no-deps --entrypoint "alembic" app history
```

### Service Management

#### Start specific services
```bash
docker-compose -f docker-compose.local.yml up -d db redis
```

#### View logs
```bash
docker-compose -f docker-compose.local.yml logs -f app
```

#### Restart a service
```bash
docker-compose -f docker-compose.local.yml restart app
```

#### Stop all services
```bash
docker-compose -f docker-compose.local.yml down
```

#### Stop and remove volumes (data loss!)
```bash
docker-compose -f docker-compose.local.yml down -v
```

### Shell Access

#### App container shell
```bash
docker-compose -f docker-compose.local.yml exec app /bin/bash
```

#### Database shell
```bash
docker-compose -f docker-compose.local.yml exec db psql -U ganitel_user -d ganitel_db
```

#### Redis CLI
```bash
docker-compose -f docker-compose.local.yml exec redis redis-cli
```

---

## Environment Configuration

The local environment uses `.env.local` file. Key configurations:

```env
# Environment
ENVIRONMENT=local
DEBUG=True

# Database
POSTGRES_DB=ganitel_db
POSTGRES_USER=ganitel_user
POSTGRES_PASSWORD=ganitel_local_password_2024

# Admin Account (auto-created on startup)
ADMIN_EMAIL=admin@ganitel.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=Ganitel
```

---

## Data Persistence

Docker volumes ensure data persists between container restarts:

- `ganitel_postgres_data_local` - PostgreSQL data
- `ganitel_redis_data_local` - Redis data
- `./uploads` - Uploaded files
- `./logs` - Application logs

---

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose -f docker-compose.local.yml logs app

# Check container status
docker-compose -f docker-compose.local.yml ps

# Restart services
docker-compose -f docker-compose.local.yml restart
```

### Database connection issues
```bash
# Check if database is ready
docker-compose -f docker-compose.local.yml exec db pg_isready -U ganitel_user

# Verify database exists
docker-compose -f docker-compose.local.yml exec db psql -U ganitel_user -l
```

### Migration errors
```bash
# Check current migration version
make migrate-current

# View migration history
make migrate-history

# If stuck, reset database (DESTRUCTIVE!)
make db-reset
```

### Port conflicts
If ports 5432, 6379, or 8000 are already in use, edit `.env.local`:
```env
POSTGRES_PORT=5433
REDIS_PORT=6380
APP_PORT=8001
```

---

## Development Workflow

### 1. Making Code Changes

The application supports hot-reload. Just edit files in `app/` and the server will auto-restart.

### 2. Adding Database Changes

```bash
# 1. Update your models in app/domain/entities/
# 2. Create migration
make migrate-create MESSAGE="add_user_avatar_field"

# 3. Review generated migration in migrations/versions/
# 4. Apply migration
make migrate-upgrade

# 5. Restart app (if needed)
make restart
```

### 3. Running Tests

```bash
# Run all tests
make test

# Run with coverage
make test-cov
```

---

## Starting with PgAdmin

To include PgAdmin for database management:

```bash
docker-compose -f docker-compose.local.yml --profile tools up -d
```

Or with Make:
```bash
make pgadmin
```

Access PgAdmin at http://localhost:5050

**Server Configuration:**
- Host: `db` (or `ganitel-db-local`)
- Port: `5432`
- Database: `ganitel_db`
- Username: `ganitel_user`
- Password: `ganitel_local_password_2024`

---

## Clean Slate / Reset Everything

```bash
# Stop all services and remove volumes
docker-compose -f docker-compose.local.yml down -v

# Remove migration files
rm -rf migrations/versions/*.py

# Rebuild and start fresh
make build
make migrate-init
make up
```

Or simply:
```bash
make db-reset
```

---

## Next Steps

1. **Test the API**: Visit http://localhost:8000/docs
2. **Login as admin**: Use default credentials
3. **Explore endpoints**: Check the interactive API documentation
4. **Make changes**: Edit code and see hot-reload in action
5. **Add features**: Create new models, migrations, and endpoints

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Docker Compose Local            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │PostgreSQL│  │  Redis   │           │
│  │  :5432   │  │  :6379   │           │
│  └────┬─────┘  └────┬─────┘           │
│       │             │                  │
│       └──────┬──────┘                  │
│              │                         │
│        ┌─────▼──────┐                 │
│        │  FastAPI   │                 │
│        │   :8000    │                 │
│        └────────────┘                 │
│              │                         │
│     Auto Migration + Admin Creation   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Support

For issues or questions:
- Check logs: `make logs`
- Review documentation in `01_docs/`
- Check deployment plan: `deployment_plan.md`

---

**Happy Coding! 🚀**
