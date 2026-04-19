#!/bin/bash

# SSH Setup Verification Script for CI/CD
# This script helps verify that SSH is correctly configured for the CI/CD pipeline

set -e

echo "🔐 SSH Setup Verification for CI/CD"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY="${SSH_KEY:-$HOME/.ssh/ganitel_deploy}"
VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST}"
DEPLOY_PATH="${DEPLOY_PATH:-/root/ganitel-backend}"

# Check if required variables are set
if [ -z "$VPS_HOST" ]; then
    echo -e "${RED}❌ Error: VPS_HOST environment variable is not set${NC}"
    echo "Usage: VPS_HOST=your-vps-ip VPS_USER=root ./verify-ssh-setup.sh"
    exit 1
fi

echo "📋 Configuration:"
echo "   SSH Key: $SSH_KEY"
echo "   VPS User: $VPS_USER"
echo "   VPS Host: $VPS_HOST"
echo "   Deploy Path: $DEPLOY_PATH"
echo ""

# Test 1: Check SSH key exists
echo "1️⃣  Checking SSH key exists..."
if [ -f "$SSH_KEY" ]; then
    echo -e "   ${GREEN}✅ SSH key found: $SSH_KEY${NC}"
else
    echo -e "   ${RED}❌ SSH key not found: $SSH_KEY${NC}"
    echo "   Generate one with: ssh-keygen -t ed25519 -C 'github-actions-ganitel' -f $SSH_KEY"
    exit 1
fi

# Test 2: Check SSH key permissions
echo "2️⃣  Checking SSH key permissions..."
KEY_PERMS=$(stat -c %a "$SSH_KEY" 2>/dev/null || stat -f %A "$SSH_KEY" 2>/dev/null)
if [ "$KEY_PERMS" = "600" ] || [ "$KEY_PERMS" = "400" ]; then
    echo -e "   ${GREEN}✅ SSH key permissions are correct ($KEY_PERMS)${NC}"
else
    echo -e "   ${YELLOW}⚠️  SSH key permissions are $KEY_PERMS, should be 600${NC}"
    echo "   Fix with: chmod 600 $SSH_KEY"
fi

# Test 3: Test SSH connection to VPS
echo "3️⃣  Testing SSH connection to VPS..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "echo ''" &>/dev/null; then
    echo -e "   ${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "   ${RED}❌ SSH connection failed${NC}"
    echo "   Make sure:"
    echo "   1. Public key is added to VPS: ssh-copy-id -i $SSH_KEY.pub $VPS_USER@$VPS_HOST"
    echo "   2. VPS allows SSH key authentication"
    exit 1
fi

# Test 4: Check if deploy directory exists on VPS
echo "4️⃣  Checking deploy directory on VPS..."
if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "[ -d '$DEPLOY_PATH' ]"; then
    echo -e "   ${GREEN}✅ Deploy directory exists: $DEPLOY_PATH${NC}"
else
    echo -e "   ${YELLOW}⚠️  Deploy directory does not exist: $DEPLOY_PATH${NC}"
    echo "   Create it with: ssh $VPS_USER@$VPS_HOST 'mkdir -p $DEPLOY_PATH'"
fi

# Test 5: Check GitHub SSH access from VPS
echo "5️⃣  Testing GitHub SSH access from VPS..."
if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "ssh -T git@github.com" 2>&1 | grep -q "successfully authenticated"; then
    echo -e "   ${GREEN}✅ VPS can authenticate with GitHub via SSH${NC}"
else
    echo -e "   ${RED}❌ VPS cannot authenticate with GitHub via SSH${NC}"
    echo "   Steps to fix:"
    echo "   1. SSH into VPS: ssh -i $SSH_KEY $VPS_USER@$VPS_HOST"
    echo "   2. Generate SSH key (if needed): ssh-keygen -t ed25519 -C 'ganitel-vps' -f ~/.ssh/id_ed25519 -N ''"
    echo "   3. Display public key: cat ~/.ssh/id_ed25519.pub"
    echo "   4. Add as Deploy Key: https://github.com/YOUR_USERNAME/ganitel-backend/settings/keys"
    echo "   5. Test: ssh -T git@github.com"
    exit 1
fi

# Test 6: Check if Git repository exists on VPS
echo "6️⃣  Checking Git repository on VPS..."
if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "[ -d '$DEPLOY_PATH/.git' ]"; then
    echo -e "   ${GREEN}✅ Git repository exists${NC}"
    
    # Check Git remote URL
    REMOTE_URL=$(ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "cd $DEPLOY_PATH && git remote get-url origin" 2>/dev/null || echo "")
    if [[ "$REMOTE_URL" == git@github.com:* ]]; then
        echo -e "   ${GREEN}✅ Git remote uses SSH: $REMOTE_URL${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Git remote uses HTTPS: $REMOTE_URL${NC}"
        echo "   Change to SSH: cd $DEPLOY_PATH && git remote set-url origin git@github.com:USERNAME/ganitel-backend.git"
    fi
else
    echo -e "   ${YELLOW}⚠️  Git repository not initialized yet${NC}"
    echo "   The CI/CD workflow will initialize it on first run"
fi

# Test 7: Check .env.staging file
echo "7️⃣  Checking .env.staging file..."
if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "[ -f '$DEPLOY_PATH/.env.staging' ]"; then
    echo -e "   ${GREEN}✅ .env.staging file exists${NC}"
    
    # Check if it has real values
    if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "grep -q 'CHANGE_THIS' '$DEPLOY_PATH/.env.staging'"; then
        echo -e "   ${YELLOW}⚠️  .env.staging contains placeholder values (CHANGE_THIS)${NC}"
        echo "   Update with real values"
    else
        echo -e "   ${GREEN}✅ .env.staging appears to have real values${NC}"
    fi
else
    echo -e "   ${RED}❌ .env.staging file not found${NC}"
    echo "   Create it with: ssh -i $SSH_KEY $VPS_USER@$VPS_HOST 'cp $DEPLOY_PATH/.env.staging.example $DEPLOY_PATH/.env.staging'"
    exit 1
fi

# Test 8: Check Docker
echo "8️⃣  Checking Docker on VPS..."
if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "which docker" &>/dev/null; then
    DOCKER_VERSION=$(ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "docker --version" 2>/dev/null || echo "unknown")
    echo -e "   ${GREEN}✅ Docker is installed: $DOCKER_VERSION${NC}"
else
    echo -e "   ${RED}❌ Docker is not installed${NC}"
    echo "   Install Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    exit 1
fi

# Test 9: Check Docker Compose
echo "9️⃣  Checking Docker Compose on VPS..."
if ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "which docker-compose" &>/dev/null; then
    COMPOSE_VERSION=$(ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "docker-compose --version" 2>/dev/null || echo "unknown")
    echo -e "   ${GREEN}✅ Docker Compose is installed: $COMPOSE_VERSION${NC}"
else
    echo -e "   ${RED}❌ Docker Compose is not installed${NC}"
    echo "   Install: sudo curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)' -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}✅ All SSH setup checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Add the following secrets to GitHub:"
echo "   - SSH_PRIVATE_KEY (content of $SSH_KEY)"
echo "   - VPS_HOST ($VPS_HOST)"
echo "   - VPS_USER ($VPS_USER)"
echo "   - DEPLOY_PATH ($DEPLOY_PATH)"
echo "   - MAIL_USERNAME (your-email@gmail.com)"
echo "   - MAIL_PASSWORD (Gmail app password)"
echo ""
echo "2. Push to develop branch to trigger deployment"
echo ""
echo "3. Monitor workflow: https://github.com/YOUR_USERNAME/ganitel-backend/actions"
