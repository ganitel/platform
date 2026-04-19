#!/usr/bin/env bash
# ============================================
# DOCKER BUILD CLEANUP SCRIPT
# ============================================
# Fixes Docker build cache and lock issues
# Usage: ./scripts/fix-docker-build.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }

echo "========================================="
echo "🔧 Docker Build Cleanup"
echo "========================================="
echo ""

# Check if running as root (needed for Docker restart)
if [ "$EUID" -ne 0 ]; then 
    echo_warning "Not running as root. Some commands may require sudo."
    SUDO="sudo"
else
    SUDO=""
fi

# Step 1: Stop all containers
echo_info "Step 1: Stopping all containers..."
docker-compose -f docker-compose.staging.yml down 2>/dev/null || true
docker-compose -f docker-compose.local.yml down 2>/dev/null || true
echo_success "Containers stopped"
echo ""

# Step 2: Remove dangling containers
echo_info "Step 2: Removing dangling containers..."
DANGLING=$(docker ps -a -q -f status=exited -f status=dead 2>/dev/null || true)
if [ -n "$DANGLING" ]; then
    docker rm -f $DANGLING
    echo_success "Dangling containers removed"
else
    echo_info "No dangling containers found"
fi
echo ""

# Step 3: Clean build cache
echo_info "Step 3: Cleaning Docker build cache..."
docker builder prune -a -f
echo_success "Build cache cleaned"
echo ""

# Step 4: Remove unused images
echo_info "Step 4: Removing unused images..."
docker image prune -a -f
echo_success "Unused images removed"
echo ""

# Step 5: Check disk space
echo_info "Step 5: Checking disk space..."
df -h /var/lib/docker | tail -1
echo ""

# Step 6: Restart Docker daemon (if running as root)
if [ -n "$SUDO" ]; then
    echo_warning "Skipping Docker restart (need root). Run manually:"
    echo "  sudo systemctl restart docker"
else
    echo_info "Step 6: Restarting Docker daemon..."
    systemctl restart docker
    sleep 3
    echo_success "Docker daemon restarted"
fi
echo ""

# Step 7: Verify Docker is working
echo_info "Step 7: Verifying Docker status..."
if docker info > /dev/null 2>&1; then
    echo_success "Docker is running correctly"
else
    echo_error "Docker is not responding!"
    exit 1
fi
echo ""

echo "========================================="
echo_success "Docker cleanup complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Try building again: ./scripts/deploy-staging.sh"
echo "  2. If issue persists:"
echo "     - Check Docker logs: sudo journalctl -u docker -n 50"
echo "     - Check disk space: df -h"
echo "     - Reboot server: sudo reboot"
echo ""
