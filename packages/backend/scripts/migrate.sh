#!/bin/bash
# Ganitel Backend - Database Migration Helper Script
# Usage: ./scripts/migrate.sh [command] [args]

set -e

COMPOSE_FILE="docker-compose.local.yml"
ENVIRONMENT="${ENVIRONMENT:-local}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed"
    exit 1
fi

# Parse command
COMMAND="${1:-help}"

case $COMMAND in
    "init")
        print_info "Initializing Alembic (creating initial migration)..."
        docker-compose -f $COMPOSE_FILE run --rm app alembic revision --autogenerate -m "initial_schema"
        print_success "Initial migration created in migrations/versions/"
        ;;
    
    "create")
        if [ -z "$2" ]; then
            print_error "Migration name required. Usage: ./scripts/migrate.sh create <migration_name>"
            exit 1
        fi
        print_info "Creating new migration: $2"
        docker-compose -f $COMPOSE_FILE run --rm app alembic revision --autogenerate -m "$2"
        print_success "Migration created in migrations/versions/"
        ;;
    
    "upgrade")
        REVISION="${2:-head}"
        print_info "Upgrading database to revision: $REVISION"
        docker-compose -f $COMPOSE_FILE run --rm app alembic upgrade $REVISION
        print_success "Database upgraded successfully"
        ;;
    
    "downgrade")
        REVISION="${2:--1}"
        print_warning "Downgrading database to revision: $REVISION"
        docker-compose -f $COMPOSE_FILE run --rm app alembic downgrade $REVISION
        print_success "Database downgraded successfully"
        ;;
    
    "history")
        print_info "Migration history:"
        docker-compose -f $COMPOSE_FILE run --rm app alembic history
        ;;
    
    "current")
        print_info "Current database revision:"
        docker-compose -f $COMPOSE_FILE run --rm app alembic current
        ;;
    
    "heads")
        print_info "Head revisions:"
        docker-compose -f $COMPOSE_FILE run --rm app alembic heads
        ;;
    
    "show")
        if [ -z "$2" ]; then
            print_error "Revision required. Usage: ./scripts/migrate.sh show <revision>"
            exit 1
        fi
        docker-compose -f $COMPOSE_FILE run --rm app alembic show $2
        ;;
    
    "reset")
        print_warning "⚠️  WARNING: This will RESET all migrations and data!"
        read -p "Are you sure? Type 'yes' to confirm: " CONFIRM
        if [ "$CONFIRM" = "yes" ]; then
            print_info "Stopping containers..."
            docker-compose -f $COMPOSE_FILE down -v
            
            print_info "Removing migration files..."
            rm -f migrations/versions/*.py
            
            print_info "Starting database..."
            docker-compose -f $COMPOSE_FILE up -d db redis
            
            print_info "Waiting for database..."
            sleep 5
            
            print_info "Creating initial migration..."
            docker-compose -f $COMPOSE_FILE run --rm app alembic revision --autogenerate -m "initial_schema"
            
            print_info "Running migrations..."
            docker-compose -f $COMPOSE_FILE run --rm app alembic upgrade head
            
            print_success "Database reset complete!"
        else
            print_info "Reset cancelled"
        fi
        ;;
    
    "help"|*)
        echo "Ganitel Backend - Migration Helper"
        echo ""
        echo "Usage: ./scripts/migrate.sh <command> [args]"
        echo ""
        echo "Commands:"
        echo "  init                    Create initial migration from models"
        echo "  create <name>           Create new migration with auto-detection"
        echo "  upgrade [revision]      Upgrade to revision (default: head)"
        echo "  downgrade [revision]    Downgrade to revision (default: -1)"
        echo "  history                 Show migration history"
        echo "  current                 Show current database revision"
        echo "  heads                   Show head revisions"
        echo "  show <revision>         Show details of a specific revision"
        echo "  reset                   Reset database and migrations (DESTRUCTIVE)"
        echo "  help                    Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./scripts/migrate.sh init"
        echo "  ./scripts/migrate.sh create add_user_avatar"
        echo "  ./scripts/migrate.sh upgrade head"
        echo "  ./scripts/migrate.sh downgrade -1"
        echo "  ./scripts/migrate.sh current"
        ;;
esac
