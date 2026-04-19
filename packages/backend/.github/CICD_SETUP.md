# 🚀 CI/CD Setup Guide - GitHub Actions

This guide explains how to set up automated deployment to staging using GitHub Actions.

## 📋 Overview
#

The CI/CD pipeline automatically:
1. ✅ Runs all tests when you push to `develop`
2. 🏗️ Builds Docker images
3. 📤 Deploys to your staging VPS
4. 🗄️ Backs up the database before deployment
5. 🔄 Runs migrations
6. ✅ Performs health checks
7. ❌ Rolls back on failure

## 🔐 Required GitHub Secrets

You need to configure **6 secrets** in your GitHub repository:

### Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### 1. SSH_PRIVATE_KEY
**Your SSH private key to access the VPS**

```bash
# Generate a new SSH key pair (if you don't have one)
ssh-keygen -t ed25519 -C "github-actions-ganitel" -f ~/.ssh/ganitel_deploy

# Display the private key (copy this to GitHub secret)
cat ~/.ssh/ganitel_deploy

# Copy the public key to your VPS
ssh-copy-id -i ~/.ssh/ganitel_deploy.pub YOUR_USER@YOUR_VPS_IP

# Also add the public key to GitHub for SSH Git access
# Go to: https://github.com/settings/keys
# Click "New SSH key" and paste the public key
cat ~/.ssh/ganitel_deploy.pub
```

**⚠️ Important**: 
- Copy the **ENTIRE private key** to GitHub secret including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...all the lines...
-----END OPENSSH PRIVATE KEY-----
```
- Add the **public key** to your GitHub account settings for Git access
- This key is used both for SSH access to VPS and for Git operations

### 2. VPS_HOST
**Your VPS IP address or domain**

```
Example: 123.456.789.012
or: vps.example.com
```

### 3. VPS_USER
**SSH username on your VPS**

```
Example: root
or: ubuntu
or: ganitel
```

### 4. DEPLOY_PATH
**Absolute path where the application is deployed on the VPS**

```
Example: /opt/ganitel-backend
or: /home/ganitel/ganitel-backend
or: /var/www/ganitel-backend
```

**⚠️ Make sure this directory exists on your VPS:**
```bash
ssh YOUR_USER@YOUR_VPS "mkdir -p /opt/ganitel-backend"
```

### 5. MAIL_USERNAME
**Gmail address for sending notifications**

```
Example: your-email@gmail.com
```

### 6. MAIL_PASSWORD
**Gmail App Password (NOT your regular password)**

```
Generate at: https://myaccount.google.com/apppasswords
```

**⚠️ Important steps to get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification (required)
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Name it "GitHub Actions Ganitel"
6. Copy the 16-character password
7. Paste it in GitHub secret (no spaces)

**Note**: You'll receive deployment notifications at **hansou.business@gmail.com**

---

## 📝 Complete Setup Checklist

### Step 1: Prepare your VPS

```bash
# 1. SSH into your VPS
ssh YOUR_USER@YOUR_VPS_IP

# 2. Install Docker and Docker Compose (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Create deployment directory
mkdir -p /opt/ganitel-backend
cd /opt/ganitel-backend

# 4. Create .env.staging file
cp .env.staging.example .env.staging
nano .env.staging  # Edit with your actual values

# 5. Make sure Apache is configured
sudo a2enmod proxy proxy_http ssl headers rewrite
sudo systemctl restart apache2
```

### Step 2: Configure GitHub Secrets

1. Go to your repository on GitHub
2. Click `Settings` → `Secrets and variables` → `Actions`
3. Add each of the **6 secrets** listed above

**Visual guide:**
```
GitHub Repo → Settings
    └── Secrets and variables
        └── Actions
            └── New repository secret
                ├── SSH_PRIVATE_KEY (your private key)
                ├── VPS_HOST (123.456.789.012)
                ├── VPS_USER (root or ubuntu)
                ├── DEPLOY_PATH (/opt/ganitel-backend)
                ├── MAIL_USERNAME (your-email@gmail.com)
                └── MAIL_PASSWORD (app password from Gmail)
```

### Step 3: Configure SSH Key for GitHub Access on VPS

The VPS needs SSH access to GitHub to pull code. You have two options:

**Option A: Use a Deploy Key (Recommended for single repository)**
```bash
# 1. SSH into your VPS
ssh YOUR_USER@YOUR_VPS_IP

# 2. Generate an SSH key on the VPS
ssh-keygen -t ed25519 -C "ganitel-vps-deploy" -f ~/.ssh/id_ed25519 -N ""

# 3. Display the public key
cat ~/.ssh/id_ed25519.pub

# 4. Add this public key as a Deploy Key in your GitHub repository:
#    - Go to: https://github.com/YOUR_USERNAME/ganitel-backend/settings/keys
#    - Click "Add deploy key"
#    - Title: "VPS Staging Server"
#    - Key: Paste the public key from step 3
#    - ✅ Check "Allow write access" (required for git operations)
```

**Option B: Use Personal SSH Key (if you have one)**
```bash
# If you already have an SSH key added to your GitHub account,
# copy it to the VPS:
ssh-copy-id -i ~/.ssh/your_github_key YOUR_USER@YOUR_VPS_IP
```

### Step 4: Test SSH Connection

```bash
# From your local machine, test the SSH key
ssh -i ~/.ssh/ganitel_deploy YOUR_USER@YOUR_VPS_IP "echo 'SSH connection successful'"

# Test GitHub SSH access from VPS
ssh YOUR_USER@YOUR_VPS_IP "ssh -T git@github.com"
# You should see: "Hi USERNAME! You've successfully authenticated..."
```

### Step 5: Verify .env.staging on VPS

```bash
# SSH into VPS
ssh YOUR_USER@YOUR_VPS_IP

# Go to deploy directory
cd /opt/ganitel-backend

# Make sure .env.staging exists and has correct values
ls -la .env.staging
cat .env.staging  # Check it has real values (not CHANGE_THIS)
```

### Step 6: Setup Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Name it "GitHub Actions Ganitel"
6. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
7. Paste it in GitHub secret `MAIL_PASSWORD` (remove spaces)

### Step 7: Test the Workflow

```bash
# On your local machine
git checkout develop
git add .
git commit -m "test: trigger CI/CD pipeline"
git push origin develop
```

Then watch the deployment:
1. Go to your GitHub repository
2. Click the `Actions` tab
3. You should see the workflow running

---

## 🔍 Monitoring Deployments

### View Workflow Runs
```
GitHub Repo → Actions → Click on a workflow run
```

### View Logs on VPS
```bash
# SSH into VPS
ssh YOUR_USER@YOUR_VPS_IP

# View container logs
cd /opt/ganitel-backend
docker-compose -f docker-compose.staging.yml logs -f app

# View deployment logs
ls -lh logs/deployment_*.log
tail -f logs/deployment_*.log
```

### Check Service Status
```bash
# On VPS
cd /opt/ganitel-backend
docker-compose -f docker-compose.staging.yml ps

# Health check
curl http://localhost:8000/api/v1/health/
curl https://staging.ganitel.com/api/v1/health/
```

---

## 🛠️ Troubleshooting

### "Permission denied (publickey)"
- ✅ Make sure the public key is in `~/.ssh/authorized_keys` on VPS
- ✅ Check SSH key format in GitHub secret (must include headers)
- ✅ Verify VPS_USER is correct

### "No such file or directory"
- ✅ Verify DEPLOY_PATH exists on VPS
- ✅ Check path is absolute (starts with `/`)

### "Database backup failed"
- ℹ️ This is OK on first deployment (database doesn't exist yet)
- ✅ After first deployment, backups should work

### "Health check failed"
- ✅ Check if containers are running: `docker-compose ps`
- ✅ View application logs: `docker-compose logs app`
- ✅ Verify .env.staging has correct values
- ✅ Check Apache configuration and restart: `sudo systemctl restart apache2`

### Deployment succeeded but site not accessible
- ✅ Check Apache logs: `sudo tail -f /var/log/apache2/staging_ganitel_error.log`
- ✅ Verify DNS points to VPS: `dig staging.ganitel.com`
- ✅ Check SSL certificate: `sudo certbot certificates`
- ✅ Test local connection: `curl http://localhost:8000/api/v1/health/`

---

## 🔄 Manual Deployment (Fallback)

If CI/CD fails, you can deploy manually:

```bash
# SSH into VPS
ssh YOUR_USER@YOUR_VPS_IP
cd /opt/ganitel-backend

# Pull latest code
git pull origin develop

# Deploy
./scripts/deploy-staging.sh
```

---

## 🎯 Next Steps

Once staging is working well:

1. **Add production workflow** (`.github/workflows/deploy-production.yml`)
2. **Enable Slack notifications** (uncomment in workflow)
3. **Add deployment approvals** (GitHub Environments)
4. **Monitor with Sentry or similar** (error tracking)
5. **Set up automated backups** (database snapshots)

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SSH Key Authentication](https://www.ssh.com/academy/ssh/keygen)
- [Let's Encrypt SSL Setup](https://certbot.eff.org/)

---

## 🆘 Need Help?

If you encounter issues:
1. Check workflow logs in GitHub Actions tab
2. Check VPS logs: `docker-compose logs -f`
3. Verify all secrets are set correctly
4. Test SSH connection manually
5. Review `.env.staging` values

**Remember**: Never commit `.env.staging` or secrets to Git! 🔐
