#!/bin/bash
# Script to reset Alembic migrations in staging environment
# Use this when migrations are out of sync with the database

set -e

echo "========================================="
echo "🔄 Resetting Staging Database Migrations"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on staging server
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  Warning: This script will reset the Alembic version in staging database${NC}"
    echo ""
    echo "Usage: ./scripts/reset-staging-migrations.sh [current_revision_id]"
    echo ""
    echo "Example: ./scripts/reset-staging-migrations.sh 91e870784d19"
    echo ""
    exit 1
fi

REVISION_ID=$1

echo "Step 1: Clearing alembic_version table..."
docker-compose -f docker-compose.staging.yml exec -T db psql -U ganitel_user -d ganitel_staging_db -c "DELETE FROM alembic_version;" || {
    echo -e "${YELLOW}⚠️  alembic_version table might not exist (first run?)${NC}"
}

echo ""
echo "Step 2: Stamping database with revision $REVISION_ID..."
docker-compose -f docker-compose.staging.yml exec -T app alembic stamp $REVISION_ID

echo ""
echo "Step 3: Running migrations to head..."
docker-compose -f docker-compose.staging.yml exec -T app alembic upgrade head

echo ""
echo -e "${GREEN}✅ Migrations reset complete!${NC}"
echo ""
echo "Current database revision:"
docker-compose -f docker-compose.staging.yml exec -T app alembic current
