#!/usr/bin/env bash
# ============================================
# GANITEL BACKEND - STAGING DEPLOYMENT SCRIPT
# ============================================
# Automates deployment to staging environment
# Usage: ./scripts/deploy-staging.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }

# ============================================
# Configuration
# ============================================
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"
BACKUP_DIR="backups"
DEPLOYMENT_LOG="logs/deployment_$(date +%Y%m%d_%H%M%S).log"

# Docker Compose command with explicit env file
COMPOSE="docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE"

# Create logs directory
mkdir -p logs backups

# Redirect all output to log file as well
exec > >(tee -a "$DEPLOYMENT_LOG")
exec 2>&1

echo "========================================="
echo "🚀 GANITEL STAGING DEPLOYMENT"
echo "========================================="
echo "📅 Date: $(date)"
echo "📍 Environment: staging"
echo "📝 Log: $DEPLOYMENT_LOG"
echo ""

# ============================================
# Pre-deployment Checks
# ============================================
echo_info "Running pre-deployment checks..."

# Check if running on server (not local)
if [ ! -f "$ENV_FILE" ]; then
    echo_error ".env.staging not found!"
    echo "Please create .env.staging from .env.staging.example"
    echo "cp .env.staging.example .env.staging"
    echo "Then edit .env.staging with your actual values"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo_error "Docker is not running!"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo_error "docker-compose is not installed!"
    exit 1
fi

echo_success "Pre-deployment checks passed"
echo ""

# ============================================
# Backup Current Database
# ============================================
echo_info "Creating database backup..."

if $COMPOSE ps | grep -q "ganitel-db-staging.*Up"; then
    BACKUP_FILE="$BACKUP_DIR/ganitel_staging_pre_deploy_$(date +%Y%m%d_%H%M%S).sql"
    
    if $COMPOSE exec -T db pg_dump -U ganitel_user ganitel_staging_db > "$BACKUP_FILE" 2>/dev/null; then
        echo_success "Database backup created: $BACKUP_FILE"
    else
        echo_warning "Database backup failed (database might not exist yet)"
    fi
else
    echo_info "Database not running, skipping backup"
fi
echo ""

# ============================================
# Pull Latest Code
# ============================================
echo_info "Pulling latest code from repository..."

if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    echo_info "Current branch: $CURRENT_BRANCH"
    
    # Stash any local changes
    if [ -n "$(git status --porcelain)" ]; then
        echo_warning "Local changes detected, stashing..."
        git stash
    fi
    
    # Pull latest changes
    git pull origin $CURRENT_BRANCH
    echo_success "Code updated"
else
    echo_info "Not a git repository, skipping pull"
fi
echo ""

# ============================================
# Build Docker Images
# ============================================
echo_info "Building Docker images..."

$COMPOSE build --no-cache app

echo_success "Docker images built"
echo ""

# ============================================
# Stop Old Containers
# ============================================
echo_info "Stopping old containers..."

$COMPOSE down

echo_success "Old containers stopped"
echo ""

# ============================================
# Start New Containers
# ============================================
echo_info "Starting new containers..."

$COMPOSE up -d

echo_success "Containers started"
echo ""

# ============================================
# Wait for Services to be Healthy
# ============================================
echo_info "Waiting for services to be healthy..."

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    
    # Check if app container is healthy
    if $COMPOSE ps | grep -q "ganitel-app-staging.*healthy"; then
        echo_success "All services are healthy"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo_error "Services did not become healthy in time"
        echo_info "Checking logs..."
        $COMPOSE logs --tail=50 app
        exit 1
    fi
    
    echo_info "Attempt $attempt/$max_attempts - waiting for health check..."
    sleep 5
done
echo ""

# ============================================
# Run Smoke Tests
# ============================================
echo_info "Running smoke tests..."

# Test health endpoint
if curl -f -s https://staging.ganitel.com/health > /dev/null 2>&1; then
    echo_success "Health endpoint responding"
else
    echo_warning "Health endpoint not responding (might need SSL setup)"
    
    # Try HTTP as fallback
    if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
        echo_success "Health endpoint responding on HTTP"
    else
        echo_error "Health endpoint not responding!"
        echo_info "Check logs: docker-compose -f $COMPOSE_FILE logs app"
        exit 1
    fi
fi

# Test API documentation
if curl -f -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo_success "API docs accessible"
else
    echo_warning "API docs not accessible"
fi

echo ""

# ============================================
# Display Service Status
# ============================================
echo_info "Service status:"
$COMPOSE ps
echo ""

# ============================================
# Deployment Complete
# ============================================
echo "========================================="
echo_success "DEPLOYMENT SUCCESSFUL!"
echo "========================================="
echo ""
echo "📍 Staging URL: https://staging.ganitel.com"
echo "📍 API Docs: https://staging.ganitel.com/docs"
echo "📍 Health Check: https://staging.ganitel.com/health"
echo ""
echo "📝 View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "📊 Service status: docker-compose -f $COMPOSE_FILE ps"
echo ""
echo "🔐 Default admin credentials:"
echo "   Email: admin@ganitel.com"
echo "   Password: (from .env.staging)"
echo ""

# ============================================
# Post-Deployment Reminders
# ============================================
echo_warning "POST-DEPLOYMENT CHECKLIST:"
echo "  [ ] Test admin login"
echo "  [ ] Test user registration"
echo "  [ ] Test booking creation"
echo "  [ ] Test payment integration (sandbox)"
echo "  [ ] Check application logs for errors"
echo "  [ ] Verify SSL certificate is valid"
echo "  [ ] Test API documentation is accessible"
echo ""
echo "📋 Full deployment log: $DEPLOYMENT_LOG"
echo ""
