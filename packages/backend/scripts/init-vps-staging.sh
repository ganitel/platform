#!/bin/bash
# ============================================
# GANITEL - VPS Staging Initialization Script
# ============================================
# Prepares VPS for CI/CD deployment with Git
# Run this ONCE before the first deployment

set -e

echo "🚀 Ganitel Backend - VPS Staging Initialization"
echo "================================================"

# Configuration
VPS_USER="${1:-root}"
VPS_HOST="${2}"
DEPLOY_PATH="${3:-/root/ganitel-backend}"
REPO_URL="https://github.com/hansou237/ganitel-backend.git"

if [ -z "$VPS_HOST" ]; then
    echo "❌ Usage: $0 [user] <vps_host> [deploy_path]"
    echo "Example: $0 root staging.ganitel.com /root/ganitel-backend"
    exit 1
fi

echo ""
echo "📋 Configuration:"
echo "   VPS User: $VPS_USER"
echo "   VPS Host: $VPS_HOST"
echo "   Deploy Path: $DEPLOY_PATH"
echo "   Repository: $REPO_URL"
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🔌 Testing SSH connection..."
ssh -o ConnectTimeout=10 ${VPS_USER}@${VPS_HOST} "echo '✅ SSH connection successful'"

echo ""
echo "📦 Setting up deployment directory..."

ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
set -e

echo "📁 Creating deployment directory: $DEPLOY_PATH"
mkdir -p "$DEPLOY_PATH"
cd "$DEPLOY_PATH"

# Backup existing files if any
if [ -f ".env.staging" ]; then
    echo "💾 Backing up existing .env.staging..."
    cp .env.staging /tmp/.env.staging.backup.\$(date +%Y%m%d_%H%M%S)
fi

# Stop existing containers if any
if [ -f "docker-compose.staging.yml" ]; then
    echo "🛑 Stopping existing containers..."
    docker-compose -f docker-compose.staging.yml down || true
fi

# Initialize git repository
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git remote add origin $REPO_URL
    git fetch origin develop
    git checkout -b develop origin/develop
else
    echo "✅ Git repository already exists"
    git remote set-url origin $REPO_URL
    git fetch origin develop
    git reset --hard origin/develop
    git checkout develop
fi

# Create necessary directories
mkdir -p backups logs uploads

echo ""
echo "✅ VPS initialized successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Create/configure .env.staging file:"
echo "      nano $DEPLOY_PATH/.env.staging"
echo ""
echo "   2. Configure GitHub Secrets (6 required):"
echo "      - SSH_PRIVATE_KEY"
echo "      - VPS_HOST = $VPS_HOST"
echo "      - VPS_USER = $VPS_USER"
echo "      - DEPLOY_PATH = $DEPLOY_PATH"
echo "      - MAIL_USERNAME"
echo "      - MAIL_PASSWORD"
echo ""
echo "   3. Push to develop branch to trigger deployment"
echo ""

ENDSSH

echo "🎉 Initialization complete!"
