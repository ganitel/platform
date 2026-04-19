#!/bin/bash
# Ganitel Backend - View Logs Script
# Quick access to container logs

set -e

COMPOSE_FILE="docker-compose.local.yml"

# Colors
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
SERVICE="${1:-all}"
FOLLOW="${2:--f}"

echo -e "${BLUE}📋 Viewing logs for: $SERVICE${NC}"
echo ""

case $SERVICE in
    "all")
        docker-compose -f $COMPOSE_FILE logs $FOLLOW
        ;;
    "app"|"api")
        docker-compose -f $COMPOSE_FILE logs $FOLLOW app
        ;;
    "db"|"database"|"postgres")
        docker-compose -f $COMPOSE_FILE logs $FOLLOW db
        ;;
    "redis"|"cache")
        docker-compose -f $COMPOSE_FILE logs $FOLLOW redis
        ;;
    "pgadmin")
        docker-compose -f $COMPOSE_FILE logs $FOLLOW pgadmin
        ;;
    *)
        echo "Usage: ./scripts/logs.sh [service] [options]"
        echo ""
        echo "Services:"
        echo "  all       - All services (default)"
        echo "  app       - FastAPI application"
        echo "  db        - PostgreSQL database"
        echo "  redis     - Redis cache"
        echo "  pgadmin   - PgAdmin (if running)"
        echo ""
        echo "Options:"
        echo "  -f        - Follow log output (default)"
        echo "  --tail=N  - Show last N lines"
        echo ""
        echo "Examples:"
        echo "  ./scripts/logs.sh              # All logs, follow mode"
        echo "  ./scripts/logs.sh app          # App logs, follow mode"
        echo "  ./scripts/logs.sh db --tail=50 # Last 50 db log lines"
        ;;
esac
