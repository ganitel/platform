#!/bin/bash
# Ganitel Backend - Docker Container Entrypoint Script
# This script runs when the container starts

set -e
set -o pipefail

echo "========================================="
echo "🚀 Starting Ganitel Backend API"
echo "========================================="

# Display environment info
echo "📍 Environment: ${ENVIRONMENT:-local}"
echo "🐍 Python version: $(python --version)"
echo "🔧 Working directory: $(pwd)"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."

# Resolve database connection info
# Prefer explicit POSTGRES_* variables; fallback to DATABASE_URL parsing
DB_HOST="${POSTGRES_SERVER:-}"
DB_USER="${POSTGRES_USER:-}"

if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ]; then
    if [ -n "${DATABASE_URL:-}" ]; then
        # Format: postgresql://user:password@host:port/database
        DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:]+):.*/\1/')
        DB_USER=$(echo "$DATABASE_URL" | sed -E 's/.*:\/\/([^:]+):.*/\1/')
    fi
fi

if [ -z "$DB_HOST" ]; then
    DB_HOST="db"
fi

if [ -z "$DB_USER" ]; then
    DB_USER="postgres"
fi

max_tries=30
count=0

until pg_isready -h "$DB_HOST" -U "$DB_USER" > /dev/null 2>&1 || [ $count -eq $max_tries ]; do
    count=$((count + 1))
    echo "⏳ Attempt $count/$max_tries: PostgreSQL is unavailable - waiting..."
    sleep 2
done

if [ $count -eq $max_tries ]; then
    echo "❌ PostgreSQL did not become ready in time"
    exit 1
fi

echo "✅ PostgreSQL is ready!"

# Run database migrations
echo ""
echo "🔄 Running database migrations..."

if [ "$ENVIRONMENT" = "production" ]; then
    echo "⚠️  Production environment detected"
    echo "⚠️  Skipping auto-migrations (run manually for safety)"
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "📍 Staging environment - running migrations with confirmation"
    # In staging, migrations run automatically but with logging
    if alembic upgrade head 2>&1 | tee /tmp/migration.log; then
        echo "✅ Migrations completed successfully"
    else
        migration_exit_code=$?
        echo "⚠️  Migration failed with exit code $migration_exit_code"
        echo "📋 Migration output:"
        cat /tmp/migration.log
        
        # Check if this is first run with no migrations
        if grep -q "Can't locate revision identified by" /tmp/migration.log; then
            echo "ℹ️  No migrations found - this might be first run"
            echo "ℹ️  Application will start, but database tables won't be created"
        fi
        
        if grep -q "password authentication failed" /tmp/migration.log; then
            echo "❌ Database authentication failed."
            echo "ℹ️  The DB volume may still use an old password."
            echo "ℹ️  Fix: make local-down-v && make local-up"
            exit 1
        fi

        # Don't exit - allow app to start for non-auth migration issues
        echo "⚠️  Continuing to start application..."
    fi
else
    # Auto-run migrations in local/development environments
    if alembic upgrade head 2>&1 | tee /tmp/migration.log; then
        echo "✅ Migrations completed successfully"
    else
        migration_exit_code=$?
        echo "⚠️  Migration failed with exit code $migration_exit_code"
        echo "📋 Migration output:"
        cat /tmp/migration.log
        
        # Check if this is first run with no migrations
        if grep -q "Can't locate revision identified by" /tmp/migration.log; then
            echo "ℹ️  No migrations found - this might be first run"
            echo "ℹ️  Application will start, but database tables won't be created"
        fi
        
        if grep -q "password authentication failed" /tmp/migration.log; then
            echo "❌ Database authentication failed."
            echo "ℹ️  The DB volume may still use an old password."
            echo "ℹ️  Fix: make local-down-v && make local-up"
            exit 1
        fi

        # Don't exit - allow app to start for non-auth migration issues
        echo "⚠️  Continuing to start application..."
    fi
fi

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p /app/uploads /app/logs
echo "✅ Directories created"

echo ""
echo "========================================="
echo "✅ Initialization complete!"
echo "🚀 Starting application..."
echo "========================================="
echo ""

# Execute the main command (passed as arguments to this script)
exec "$@"
