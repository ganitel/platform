#!/bin/bash
# Ganitel Backend - Database Backup Script
# Creates a SQL backup of the PostgreSQL database

set -e

COMPOSE_FILE="docker-compose.local.yml"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ganitel_db_${TIMESTAMP}.sql"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          DATABASE BACKUP                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📁 Creating backup directory...${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Check if database container is running
if ! docker-compose -f $COMPOSE_FILE ps db | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Database container is not running${NC}"
    echo "Start it with: docker-compose -f $COMPOSE_FILE up -d db"
    exit 1
fi

# Perform backup
echo -e "${YELLOW}💾 Creating backup...${NC}"
echo "   Database: ganitel_db"
echo "   Output: $BACKUP_FILE"
echo ""

if docker-compose -f $COMPOSE_FILE exec -T db pg_dump -U ganitel_user ganitel_db > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Backup Details:${NC}"
    echo "   • File: $BACKUP_FILE"
    echo "   • Size: $BACKUP_SIZE"
    echo "   • Timestamp: $TIMESTAMP"
    echo ""
    echo -e "${YELLOW}💡 To restore this backup:${NC}"
    echo "   ./scripts/db-restore.sh $BACKUP_FILE"
    echo ""
else
    echo -e "${RED}❌ Backup failed!${NC}"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# List recent backups
echo -e "${BLUE}📋 Recent backups:${NC}"
ls -lh $BACKUP_DIR/*.sql 2>/dev/null | tail -5 | awk '{print "   " $9 " (" $5 ")"}'
echo ""
