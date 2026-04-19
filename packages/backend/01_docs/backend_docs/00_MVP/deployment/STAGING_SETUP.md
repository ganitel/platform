# 🚀 Ganitel Backend - Staging Environment Setup

Complete guide for deploying Ganitel Backend to the staging environment (`staging.ganitel.com`).

---

## 📋 **Prerequisites**

### **On Your VPS**
- Ubuntu 22.04 LTS (or similar Linux distribution)
- Minimum 2GB RAM, 2 CPU cores, 20GB disk
- Root or sudo access
- Domain DNS configured: `staging.ganitel.com` → VPS IP address

### **Software to Install**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install -y git

# Install Certbot (for SSL) - Apache or Nginx
sudo apt install -y certbot python3-certbot-apache  # If using Apache
# OR
sudo apt install -y certbot python3-certbot-nginx   # If using Nginx

# Install ufw (firewall)
sudo apt install -y ufw
```

---

## 🔒 **Step 1: Server Security Setup**

### **1.1 Configure Firewall**
```bash
# Allow SSH (IMPORTANT: don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

### **1.2 Create Deployment User**
```bash
# Create user
sudo adduser ganitel

# Add to docker group
sudo usermod -aG docker ganitel

# Add sudo privileges (if needed)
sudo usermod -aG sudo ganitel

# Switch to new user
su - ganitel
```

---

## 📦 **Step 2: Clone Repository**

```bash
# Navigate to home directory
cd ~

# Clone repository (replace with your repo URL)
git clone https://github.com/hansou237/ganitel-backend.git
cd ganitel-backend

# Checkout deployment branch
git checkout feature/deployment-integration
```

---

## 🔐 **Step 3: Configure Environment Variables**

### **3.1 Create .env.staging**
```bash
# Copy template
cp .env.staging.example .env.staging

# Edit with your favorite editor
nano .env.staging
```

### **3.2 Generate Secrets**
```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate JWT_SECRET_KEY (use different value!)
openssl rand -hex 32

# Generate strong passwords (20+ characters)
openssl rand -base64 24
```

### **3.3 Required Changes in .env.staging**
Update these values (minimum required):

```bash
# Security (MUST CHANGE!)
SECRET_KEY=<your-generated-secret-key>
JWT_SECRET_KEY=<your-generated-jwt-secret>

# Database
POSTGRES_PASSWORD=<strong-password-here>

# Redis
REDIS_PASSWORD=<strong-password-here>

# Admin User
ADMIN_EMAIL=admin@ganitel.com
ADMIN_PASSWORD=<strong-admin-password>

# Payment Gateway (Sandbox)
TRANZAK_API_KEY=<your-sandbox-api-key>
TRANZAK_APP_ID=<your-sandbox-app-id>
```

### **3.4 Verify Configuration**
```bash
# Check that file exists and has correct permissions
ls -la .env.staging

# Should show: -rw------- (only owner can read/write)
# If not, fix with:
chmod 600 .env.staging
```

---

## 🔒 **Step 4: SSL Certificate Setup**

### **4.1 Initial Setup (HTTP only)**
First deployment without SSL to get Let's Encrypt certificate:

```bash
# Create temporary nginx config for HTTP only
mkdir -p nginx/ssl
touch nginx/ssl/.gitkeep

# Create certbot directory
sudo mkdir -p /var/www/certbot
```

### **4.2 Get SSL Certificate**

**Option A: Using Apache Plugin (Easiest if Apache is installed)**
```bash
# Request certificate using Apache plugin
sudo certbot --apache -d staging.ganitel.com

# Certbot will:
# 1. Automatically configure Apache for HTTPS
# 2. Save certificates to: /etc/letsencrypt/live/staging.ganitel.com/
# 3. Setup auto-renewal
```

**Option B: Standalone Mode (if no web server running)**
```bash
# Stop any running web servers first
# sudo systemctl stop apache2
# OR
# docker-compose -f docker-compose.staging.yml down

# Request certificate
sudo certbot certonly --standalone \
  -d staging.ganitel.com \
  --email admin@ganitel.com \
  --agree-tos \
  --no-eff-email

# Certificates will be in: /etc/letsencrypt/live/staging.ganitel.com/
```

### **4.3 Verify Certificates**
```bash
# Check certificate files
sudo ls -la /etc/letsencrypt/live/staging.ganitel.com/

# Should see:
# - fullchain.pem
# - privkey.pem
# - chain.pem
# - cert.pem
```

### **4.4 Setup Auto-Renewal**
```bash
# Test renewal
sudo certbot renew --dry-run

# Setup cron job for auto-renewal
sudo crontab -e

# Add this line:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload apache2"  # For Apache
# OR
0 3 * * * certbot renew --quiet --post-hook "docker-compose -f /home/ganitel/ganitel-backend/docker-compose.staging.yml restart nginx"  # For Nginx
```

---

## 🌐 **Step 4.5: Web Server Configuration**

### **Option A: Using Apache2 (Recommended if Apache is already running)**

#### **Enable Required Apache Modules**
```bash
sudo a2enmod proxy proxy_http ssl headers rewrite
```

#### **Configure Apache Virtual Host**
```bash
# Copy Apache configuration
sudo cp apache/staging-ganitel.conf /etc/apache2/sites-available/staging.ganitel.com.conf

# Enable the site
sudo a2ensite staging.ganitel.com.conf

# Test configuration
sudo apache2ctl configtest

# Reload Apache
sudo systemctl reload apache2
```

**Apache configuration file: `/etc/apache2/sites-available/staging.ganitel.com.conf`**

The configuration includes:
- ✅ HTTP to HTTPS redirect
- ✅ SSL certificate setup (Let's Encrypt)
- ✅ Reverse proxy to Docker app on `localhost:8000`
- ✅ Security headers
- ✅ WebSocket support
- ✅ File upload limits
- ✅ Timeout settings

#### **Docker Compose for Apache Setup**
When using Apache as reverse proxy, the app container should expose port 8000:
```yaml
services:
  app:
    ports:
      - "8000:8000"  # Apache proxies to localhost:8000
```

---

### **Option B: Using Nginx in Docker (Alternative)**

If you prefer containerized Nginx:

1. Update `docker-compose.staging.yml` to include nginx service
2. Configure nginx to proxy to app container
3. Let's Encrypt certificate needs to be mounted into nginx container

See `nginx/staging.conf` for nginx configuration example.

---

## 🚀 **Step 5: First Deployment**

### **5.1 Build and Start Services**
```bash
# Make deployment script executable
chmod +x scripts/deploy-staging.sh

# Run deployment
./scripts/deploy-staging.sh
```

**The script will:**
1. ✅ Check prerequisites
2. ✅ Backup existing database (if any)
3. ✅ Pull latest code
4. ✅ Build Docker images
5. ✅ Start containers
6. ✅ Run health checks
7. ✅ Display service status

### **5.2 Monitor Deployment**
```bash
# Watch logs during deployment
docker-compose -f docker-compose.staging.yml logs -f app

# Check service status
docker-compose -f docker-compose.staging.yml ps

# Check health
curl https://staging.ganitel.com/health
```

---

## ✅ **Step 6: Verify Deployment**

### **6.1 Test Health Endpoint**
```bash
curl https://staging.ganitel.com/health

# Should return:
# {"status":"healthy","environment":"staging"}
```

### **6.2 Test API Documentation**
Visit in browser:
- https://staging.ganitel.com/docs (Swagger UI)
- https://staging.ganitel.com/redoc (ReDoc)

### **6.3 Test Admin Login**
```bash
# Login with admin credentials
curl -X POST https://staging.ganitel.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ganitel.com",
    "password": "your-admin-password"
  }'

# Should return JWT token
```

### **6.4 Check SSL Certificate**
```bash
# Check SSL certificate
curl -vI https://staging.ganitel.com 2>&1 | grep -i "SSL\|TLS"

# Or visit in browser and check lock icon
```

---

## 🔧 **Common Commands**

### **View Logs**
```bash
# All services
docker-compose -f docker-compose.staging.yml logs -f

# Specific service
docker-compose -f docker-compose.staging.yml logs -f app
docker-compose -f docker-compose.staging.yml logs -f nginx
docker-compose -f docker-compose.staging.yml logs -f db
```

### **Service Management**
```bash
# Start services
docker-compose -f docker-compose.staging.yml up -d

# Stop services
docker-compose -f docker-compose.staging.yml down

# Restart specific service
docker-compose -f docker-compose.staging.yml restart app

# Check status
docker-compose -f docker-compose.staging.yml ps
```

### **Database Management**
```bash
# Access database shell
docker-compose -f docker-compose.staging.yml exec db psql -U ganitel_user -d ganitel_staging_db

# Backup database
docker-compose -f docker-compose.staging.yml exec -T db \
  pg_dump -U ganitel_user ganitel_staging_db > backup_$(date +%Y%m%d).sql

# Restore database
cat backup.sql | docker-compose -f docker-compose.staging.yml exec -T db \
  psql -U ganitel_user ganitel_staging_db
```

### **Run Migrations Manually**
```bash
# Access app container
docker-compose -f docker-compose.staging.yml exec app bash

# Inside container
alembic upgrade head
```

---

## 🐛 **Troubleshooting**

### **Problem: Can't connect to staging.ganitel.com**
```bash
# 1. Check DNS
nslookup staging.ganitel.com

# 2. Check nginx is running
docker-compose -f docker-compose.staging.yml ps nginx

# 3. Check nginx logs
docker-compose -f docker-compose.staging.yml logs nginx

# 4. Test locally
curl http://localhost:8000/health
```

### **Problem: SSL Certificate Error**
```bash
# Check certificate exists
sudo ls -la /etc/letsencrypt/live/staging.ganitel.com/

# Re-generate if needed
sudo certbot certonly --standalone -d staging.ganitel.com --force-renew

# Restart nginx
docker-compose -f docker-compose.staging.yml restart nginx
```

### **Problem: Database Migration Failed**
```bash
# Check database is running
docker-compose -f docker-compose.staging.yml ps db

# Access database
docker-compose -f docker-compose.staging.yml exec db psql -U ganitel_user -d ganitel_staging_db

# Check alembic version
\dt alembic_version

# Run migrations manually
docker-compose -f docker-compose.staging.yml exec app alembic upgrade head
```

### **Problem: App Container Keeps Restarting**
```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs app

# Check environment variables
docker-compose -f docker-compose.staging.yml exec app env | grep -i postgres

# Restart all services
docker-compose -f docker-compose.staging.yml down
docker-compose -f docker-compose.staging.yml up -d
```

---

## 🔄 **Updating Staging**

### **Deploy New Changes**
```bash
# Pull latest code
git pull origin feature/deployment-integration

# Run deployment script (handles everything)
./scripts/deploy-staging.sh
```

### **Rollback to Previous Version**
```bash
# Stop containers
docker-compose -f docker-compose.staging.yml down

# Checkout previous commit
git log --oneline  # Find commit hash
git checkout <commit-hash>

# Deploy old version
./scripts/deploy-staging.sh
```

---

## 📊 **Monitoring**

### **System Resources**
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker stats
docker stats

# Check container resource usage
docker-compose -f docker-compose.staging.yml ps -q | xargs docker stats
```

### **Application Health**
```bash
# Create health check script
cat > ~/check-health.sh << 'EOF'
#!/bin/bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.ganitel.com/health)
if [ $STATUS -eq 200 ]; then
    echo "✅ Application is healthy"
else
    echo "❌ Application is down (HTTP $STATUS)"
    # Send alert (email, Slack, etc.)
fi
EOF

chmod +x ~/check-health.sh

# Run every 5 minutes via cron
crontab -e
# Add: */5 * * * * /home/ganitel/check-health.sh
```

---

## 🔐 **Security Best Practices**

✅ **Implemented:**
- Non-root Docker containers
- Strong password requirements
- SSL/TLS encryption
- Rate limiting via nginx
- Security headers (HSTS, CSP, etc.)
- Firewall configured (ufw)

📋 **Additional Recommendations:**
- [ ] Setup fail2ban for SSH protection
- [ ] Enable automatic security updates
- [ ] Setup log monitoring/alerting
- [ ] Regular database backups (automated)
- [ ] Implement secrets rotation policy

---

## 📞 **Support**

- **Documentation**: `docs/` directory
- **Logs**: Check `logs/deployment_*.log`
- **Health**: https://staging.ganitel.com/health
- **API Docs**: https://staging.ganitel.com/docs

---

## 📝 **Next Steps**

After staging is stable:
1. ✅ Test all API endpoints
2. ✅ Test payment integration (sandbox)
3. ✅ Load testing (optional)
4. ✅ Security audit
5. 🚀 Deploy to production (Phase 5)

---

**Staging is production-like, treat it seriously! 🎯**
