#!/bin/bash
# Ganitel Backend - Database Restore Script
# Restores database from a SQL backup file

set -e

COMPOSE_FILE="docker-compose.local.yml"
BACKUP_FILE="${1}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          DATABASE RESTORE                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not specified${NC}"
    echo ""
    echo "Usage: ./scripts/db-restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    if [ -d "backups" ] && [ "$(ls -A backups/*.sql 2>/dev/null)" ]; then
        ls -lh backups/*.sql | awk '{print "  • " $9 " (" $5 ")"}'
    else
        echo "  (No backups found)"
    fi
    echo ""
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check if database container is running
if ! docker-compose -f $COMPOSE_FILE ps db | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Database container is not running${NC}"
    echo "Starting database..."
    docker-compose -f $COMPOSE_FILE up -d db
    sleep 5
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE the current database!${NC}"
echo ""
echo -e "${BLUE}📊 Restore Details:${NC}"
echo "   • Source: $BACKUP_FILE"
echo "   • Size: $BACKUP_SIZE"
echo "   • Target: ganitel_db"
echo ""

# Confirmation
read -p "Are you sure you want to restore? Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}ℹ️  Restore cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Restoring database...${NC}"
echo ""

# Stop the app to avoid connection issues
echo "1. Stopping application..."
docker-compose -f $COMPOSE_FILE stop app 2>/dev/null || true

# Drop existing connections
echo "2. Terminating active connections..."
docker-compose -f $COMPOSE_FILE exec -T db psql -U ganitel_user postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'ganitel_db' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true

# Drop and recreate database
echo "3. Recreating database..."
docker-compose -f $COMPOSE_FILE exec -T db psql -U ganitel_user postgres -c "DROP DATABASE IF EXISTS ganitel_db;" > /dev/null
docker-compose -f $COMPOSE_FILE exec -T db psql -U ganitel_user postgres -c "CREATE DATABASE ganitel_db OWNER ganitel_user;" > /dev/null

# Restore backup
echo "4. Restoring backup data..."
if docker-compose -f $COMPOSE_FILE exec -T db psql -U ganitel_user ganitel_db < "$BACKUP_FILE" > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
    echo ""
    
    # Restart the app
    echo "5. Restarting application..."
    docker-compose -f $COMPOSE_FILE up -d app
    sleep 5
    
    echo ""
    echo -e "${BLUE}📍 Database restored and application restarted${NC}"
    echo ""
    echo -e "${YELLOW}💡 Verify the restore:${NC}"
    echo "   • Check logs: docker-compose -f docker-compose.local.yml logs app"
    echo "   • API health: curl http://localhost:8000/api/v1/health/"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Restore failed!${NC}"
    echo "The database may be in an inconsistent state."
    echo "Consider running: ./scripts/reset-local.sh"
    exit 1
fi
