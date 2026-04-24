#!/bin/bash
set -e
set -o pipefail

echo "========================================="
echo "Starting Ganitel Backend API"
echo "Environment: ${ENVIRONMENT:-local}"
echo "========================================="

# ── Wait for PostgreSQL ───────────────────────────────────────────────────────

DB_HOST="${POSTGRES_SERVER:-db}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "Waiting for PostgreSQL at $DB_HOST..."

max_tries=30
count=0
until pg_isready -h "$DB_HOST" -U "$DB_USER" > /dev/null 2>&1; do
    count=$((count + 1))
    if [ $count -eq $max_tries ]; then
        echo "❌ PostgreSQL did not become ready after ${max_tries} attempts"
        exit 1
    fi
    echo "  attempt $count/$max_tries..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

# ── Run Migrations ────────────────────────────────────────────────────────────

if [ "$ENVIRONMENT" = "production" ]; then
    echo "⚠️  Production: skipping auto-migrations (run manually)"
else
    echo "Running Alembic migrations..."
    if ! alembic upgrade head 2>&1 | tee /tmp/migration.log; then
        echo "❌ Migration failed:"
        cat /tmp/migration.log
        exit 1
    fi
    echo "✅ Migrations complete"
fi

# ── Ensure runtime directories ────────────────────────────────────────────────

mkdir -p /app/uploads /app/logs

echo "========================================="
echo "Starting application..."
echo "========================================="

exec "$@"
