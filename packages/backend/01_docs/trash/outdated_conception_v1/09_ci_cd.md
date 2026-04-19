

---

# ✅ Ganitel – Docker-Based CI/CD Strategy (Best Practices)

This will give you:

* A clean **Dev → Test → Prod** workflow
* An introduction to **Docker**, **GitHub Actions**, and **Linux-based VPS DevOps**
* A **solid foundation for scaling**, versioning, and rollback

---

## 📦 Architecture Recap

| Environment | Hosted on VPS? | Uses Docker? | Publicly Exposed?   |
| ----------- | -------------- | ------------ | ------------------- |
| Local       | No             | Yes          | No                  |
| Test        | ✅ Yes          | ✅ Yes        | Optional (internal) |
| Production  | ✅ Yes          | ✅ Yes        | ✅ Yes               |

---

## 🧱 Directory Structure

```bash
ganitel-backend/
├── Dockerfile
├── docker-compose.yml
├── .env.test
├── .env.production
├── src/
│   ├── main.py
│   └── ...
├── requirements.txt
└── tests/
```

---

## 🐳 Dockerfile (FastAPI backend)

```dockerfile
# Dockerfile
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY . .

# Expose port
EXPOSE 8000

# Run app with uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🐳 docker-compose.yml (test + prod support)

```yaml
version: '3.9'

services:
  ganitel-api:
    build: .
    container_name: ganitel_api
    env_file:
      - .env.${ENV:-test}  # ENV is a variable: test or production
    ports:
      - "8000:8000"
    restart: always
```

---

## ⚙️ CI/CD Flow (Test + Prod on VPS)

### ✅ Dev workflow (local)

```bash
# For local dev:
docker compose --env-file .env.test up --build
```

---

### ✅ Test deployment (on VPS)

* GitHub Actions will SSH into your VPS
* Pull the code → Build Docker image → Start test container
* Port `8001`, password-protected (optional)

---

### ✅ Production deployment

* Pull main branch
* Build + run container with `.env.production`
* Expose on port `8000`
* Use **Caddy** or **Nginx** as HTTPS proxy

---

## 🧪 CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Hostinger VPS (Docker)

on:
  push:
    branches: [main, develop]

env:
  DEPLOY_ENV: ${{ github.ref == 'refs/heads/main' && 'production' || 'test' }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Copy files to VPS
        run: |
          ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_IP }} "
            cd /home/ganitel/$DEPLOY_ENV &&
            git pull origin ${{ github.ref_name }}
          "

      - name: Deploy Docker container
        run: |
          ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_IP }} "
            cd /home/ganitel/$DEPLOY_ENV &&
            docker compose --env-file .env.$DEPLOY_ENV up -d --build
          "
```

> ✅ `secrets.VPS_USER`, `VPS_IP` and optionally `DEPLOY_KEY` will be added in GitHub → Settings → Secrets.

---

## 📂 VPS Folder Structure (Suggested)

```bash
/home/ganitel
├── test/
│   ├── .env.test
│   ├── docker-compose.yml
│   └── app/
├── production/
│   ├── .env.production
│   ├── docker-compose.yml
│   └── app/
```

---

## 🔐 `.env.production` (sample)

```
ENV=production
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_KEY=...
TRAZAK_SECRET=...
TWILIO_SID=...
TWILIO_TOKEN=...
```

---

## 🧰 Best Practices Recap

| Best Practice                  | Why it matters                      |
| ------------------------------ | ----------------------------------- |
| Use Docker                     | Reproducible builds, easier testing |
| Separate envs                  | Avoid test data leaking into prod   |
| GitHub Actions                 | Reliable and automatable            |
| Avoid root SSH                 | Use a dedicated `ganitel` user      |
| Use `.env` files               | Secrets don’t live in source code   |
| Test locally                   | Use `docker compose` before pushing |
| Use `:latest` or tagged images | For rollback and tracking           |

---

## 🧠 Want to Go Further?

* Add **auto-backups** to your VPS
* Run **PostgreSQL inside Docker** (for full offline dev)
* Use **Docker volumes** for persistent uploads (e.g. images)
* Add **Sentry** for production error tracking

---


