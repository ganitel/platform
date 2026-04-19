#!/bin/bash
# Ganitel Backend - Reset Local Environment Script
# This script completely resets your local development environment

set -e

COMPOSE_FILE="docker-compose.local.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                                                    ║${NC}"
echo -e "${RED}║        ⚠️  LOCAL ENVIRONMENT RESET  ⚠️              ║${NC}"
echo -e "${RED}║                                                    ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}This will:${NC}"
echo "  • Stop and remove all containers"
echo "  • Delete all Docker volumes (DATABASE WILL BE ERASED)"
echo "  • Remove all migration files"
echo "  • Rebuild everything from scratch"
echo ""
echo -e "${RED}⚠️  ALL LOCAL DATA WILL BE LOST! ⚠️${NC}"
echo ""

# Confirmation prompt
read -p "Are you sure you want to continue? Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}ℹ️  Reset cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Starting reset process...                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Stop and remove containers with volumes
echo -e "${YELLOW}[1/6] Stopping and removing containers...${NC}"
docker-compose -f $COMPOSE_FILE down -v --remove-orphans
echo -e "${GREEN}✅ Containers and volumes removed${NC}"
echo ""

# Step 2: Remove migration files
echo -e "${YELLOW}[2/6] Removing migration files...${NC}"
if [ -d "migrations/versions" ]; then
    find migrations/versions -name "*.py" -type f ! -name "__init__.py" -delete
    echo -e "${GREEN}✅ Migration files removed${NC}"
else
    echo -e "${BLUE}ℹ️  No migration files to remove${NC}"
fi
echo ""

# Step 3: Rebuild Docker images
echo -e "${YELLOW}[3/6] Rebuilding Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache
echo -e "${GREEN}✅ Docker images rebuilt${NC}"
echo ""

# Step 4: Start database services
echo -e "${YELLOW}[4/6] Starting database services...${NC}"
docker-compose -f $COMPOSE_FILE up -d db redis
sleep 5
echo -e "${GREEN}✅ Database services started${NC}"
echo ""

# Step 5: Create initial migration
echo -e "${YELLOW}[5/6] Creating initial migration...${NC}"
docker-compose -f $COMPOSE_FILE run --rm --no-deps --entrypoint "alembic" app revision --autogenerate -m "initial_schema"
echo -e "${GREEN}✅ Initial migration created${NC}"
echo ""

# Step 6: Start application
echo -e "${YELLOW}[6/6] Starting application...${NC}"
docker-compose -f $COMPOSE_FILE up -d app
echo ""

# Wait for app to be healthy
echo -e "${BLUE}⏳ Waiting for application to be ready...${NC}"
sleep 10

# Check health
if curl -f http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is healthy!${NC}"
else
    echo -e "${YELLOW}⚠️  Application might still be starting up...${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║        ✅  RESET COMPLETE!  ✅                     ║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Access Points:${NC}"
echo "   • API: http://localhost:8000"
echo "   • Docs: http://localhost:8000/docs"
echo "   • Health: http://localhost:8000/api/v1/health/"
echo ""
echo -e "${BLUE}🔑 Default Admin:${NC}"
echo "   • Email: admin@ganitel.com"
echo "   • Password: YourSecurePassword123!"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "   • View logs: docker-compose -f docker-compose.local.yml logs -f"
echo "   • Check status: docker-compose -f docker-compose.local.yml ps"
echo ""
