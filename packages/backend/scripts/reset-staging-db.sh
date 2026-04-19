#!/bin/bash
# Script to completely reset staging database (nuclear option)
# WARNING: This will DELETE ALL DATA in the staging database

set -e

echo "========================================="
echo "💣 RESET STAGING DATABASE (NUCLEAR)"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  WARNING: This will DELETE ALL DATA in staging database!${NC}"
echo ""
read -p "Are you sure you want to continue? Type 'yes' to confirm: " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "Step 1: Stopping services..."
docker compose -f docker-compose.staging.yml --env-file .env.staging down

echo ""
echo "Step 2: Removing database volume..."
docker volume rm ganitel_postgres_data_staging || echo "Volume already removed"

echo ""
echo "Step 3: Starting services (database will be recreated)..."
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d

echo ""
echo "Step 4: Waiting for services to be healthy..."
sleep 10

echo ""
echo -e "${GREEN}✅ Database reset complete!${NC}"
echo ""
echo "Check logs:"
echo "  docker compose -f docker-compose.staging.yml --env-file .env.staging logs app"
