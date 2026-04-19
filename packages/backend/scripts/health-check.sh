#!/usr/bin/env bash
# ============================================
# GANITEL - QUICK HEALTH CHECK
# ============================================
# Quick script to check if staging is healthy
# Used by CI/CD for post-deployment verification

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }
echo_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

# Configuration
HEALTH_URL="${HEALTH_URL:-http://localhost:8000/api/v1/health/}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"
SLEEP_INTERVAL="${SLEEP_INTERVAL:-5}"

echo "🏥 Health Check Starting..."
echo "URL: $HEALTH_URL"
echo "Max attempts: $MAX_ATTEMPTS"
echo ""

attempt=0
while [ $attempt -lt $MAX_ATTEMPTS ]; do
  attempt=$((attempt + 1))
  
  # Try health check
  if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
    echo_success "Health check passed! (attempt $attempt/$MAX_ATTEMPTS)"
    
    # Get response details
    response=$(curl -s "$HEALTH_URL")
    echo ""
    echo "📊 Health Response:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    
    exit 0
  fi
  
  echo_info "Attempt $attempt/$MAX_ATTEMPTS - waiting for service..."
  
  if [ $attempt -eq $MAX_ATTEMPTS ]; then
    echo_error "Health check failed after $MAX_ATTEMPTS attempts"
    exit 1
  fi
  
  sleep $SLEEP_INTERVAL
done
