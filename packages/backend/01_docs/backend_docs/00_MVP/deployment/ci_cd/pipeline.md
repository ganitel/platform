## Functional System Description

Let me describe how the **automated deployment pipeline** would work from start to finish:

### Current State
- You have **local development** running on your machine
- You have **staging environment** deployed on a VPS at `staging.ganitel.com`
- The VPS already has Git and SSH configured
- Staging runs using Docker containers (via docker-compose.staging.yml)
- You manually push code and rebuild containers

### Proposed Automated System

**When you push code to the `develop` branch:**

1. **GitHub automatically detects the push** and triggers a workflow

2. **Testing Phase (runs on GitHub's servers):**
   - GitHub spins up temporary containers (PostgreSQL + Redis)
   - Installs all your Python dependencies
   - Runs your entire test suite
   - If **ANY test fails** → the process stops here, nothing gets deployed
   - If **ALL tests pass** → proceeds to deployment

3. **Deployment Phase (happens on your VPS):**
   - GitHub connects to your VPS via SSH (using credentials you'll provide)
   - Navigates to `/var/www/ganitel-backend` on your VPS
   - Pulls the latest code from the `develop` branch
   - **Creates a database backup** (safety measure in case something goes wrong)
   - Stops the currently running Docker containers (`docker-compose down`)
   - Rebuilds the Docker images with the new code (`docker-compose build`)
   - Starts the new containers (`docker-compose up`)
   - Runs database migrations automatically
   - Performs a **health check** on the API (calls `/health` endpoint)
   - If health check fails → alerts you and stops
   - If health check passes → deployment is complete!

4. **Your staging environment at `staging.ganitel.com` is now updated** with the latest code

### Key Benefits

✅ **Tests MUST pass before deployment** - No broken code reaches staging  
✅ **Fully automated** - No manual SSH, no manual docker commands  
✅ **Database safety** - Automatic backups before each deployment  
✅ **Health validation** - Ensures the app actually works after deployment  
✅ **Deployment history** - GitHub keeps logs of every deployment  
✅ **Fast feedback** - You know within minutes if your changes work in staging  

### Safety Features

- **Automatic backups** before each deployment
- **Rollback capability** - You can manually trigger reverting to a previous version
- **Health checks** prevent broken deployments from going live
- **Zero downtime option** (optional advanced feature): runs old and new versions simultaneously, switches only when new version is healthy

### What You Need to Provide

For this to work, you need to give GitHub:
- Your VPS IP address or domain
- SSH username (the one you use to connect)
- SSH private key (so GitHub can connect securely)
- Optionally: Slack/Discord webhook for notifications

### What Stays Secret

Your .env.staging file stays **only on the VPS** - never in GitHub, never in the workflow. The workflow just uses what's already there.

---

