# Ganitel V2 Backend

Backend API pour la plateforme Ganitel - Multi-service travel platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)

## 🚀 Quick Start (Docker - Recommended)

The **fastest way** to get started with Ganitel Backend is using Docker:

```bash
# 1. Build images
docker-compose -f docker-compose.local.yml build

# 2. Create initial migration
docker-compose -f docker-compose.local.yml run --rm --no-deps --entrypoint "alembic" app revision --autogenerate -m "initial_schema"

# 3. Start everything
docker-compose -f docker-compose.local.yml up -d
```

**That's it!** 🎉 Your API is now running at:
- **API:** http://localhost:8000
- **Interactive Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/v1/health/

### 🔄 CI/CD Pipeline

Automated deployment to staging is configured with GitHub Actions:
- **Trigger:** Push to `develop` branch
- **Process:** Tests → Build → Deploy → Health Check
- **Setup Guide:** [.github/CICD_SETUP.md](.github/CICD_SETUP.md)

**Staging Environment:** https://staging.ganitel.com

### Default Admin Credentials
```
Email: admin@ganitel.com
Password: YourSecurePassword123!
```
⚠️ **Change this password after first login!**

### Using Makefile (Even Easier!)

If you have `make` installed:
```bash
make build        # Build images
make migrate-init # Create initial migration
make up           # Start services
make logs         # View logs
```

See all available commands: `make help`

---

## 📚 Full Documentation

For detailed setup, configuration, and deployment guides, see:
- **[Local Setup Guide](DOCKER_SETUP_LOCAL.md)** - Complete Docker setup and usage
- **[Deployment Plan](deployment_plan.md)** - Staging and production deployment
- **[Project Documentation](01_docs/)** - Architecture, API specs, and more
- **[Environment Mapping Baseline](01_docs/backend_docs/v1/v1.1/pre_sprint/envs_mapping.md)** - Canonical dev/test/staging/prod config matrix

---

## 🛠️ Alternative: Local Python Setup

If you prefer running without Docker:

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Create virtual environment**:
```bash
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate  # Windows
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Run migrations**:
```bash
alembic upgrade head
```

5. **Start the server**:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🔧 Development Tools

### Available Scripts

#### Utility Scripts
```bash
./scripts/reset-local.sh   # Reset entire local environment
./scripts/logs.sh [service] # View container logs
./scripts/db-backup.sh     # Backup database
./scripts/db-restore.sh <file> # Restore database
./scripts/migrate.sh       # Migration helper
```

#### Makefile Commands
```bash
make help          # Show all available commands
make build         # Build Docker images
make up            # Start all services
make down          # Stop services
make logs          # View logs
make shell         # Open app container shell
make db-shell      # Open PostgreSQL shell
make test          # Run tests
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:8000 | - |
| **API Docs** | http://localhost:8000/docs | - |
| **ReDoc** | http://localhost:8000/redoc | - |
| **Health Check** | http://localhost:8000/api/v1/health/ | - |
| **PgAdmin** | http://localhost:5050 | admin@ganitel.local / admin123 |

---

## 🧪 Testing

### Tous les tests

```bash
# Activer l'environnement virtuel
source .venv/bin/activate

# Lancer tous les tests
pytest

# Avec verbosité
pytest -v

# Avec couverture de code
pytest --cov=app --cov-report=html
```

### Tests spécifiques

```bash
# Tests simples (sans base de données)
pytest tests/test_simple.py

# Tests des use cases de services
pytest tests/test_service_use_cases.py

# Tests des use cases de bookings
pytest tests/test_booking_use_cases.py

# Un test spécifique
pytest tests/test_simple.py::test_health_endpoint
```

### Options utiles

```bash
# Afficher les print statements
pytest -s

# Arrêter au premier échec
pytest -x

# Exécuter seulement les tests qui ont échoué la dernière fois
pytest --lf

# Mode verbose avec traces
pytest -vv
```

## 📝 Commandes utiles

### Vérifier que l'application se charge

```bash
source .venv/bin/activate
python3 -c "from app.main import app; print('✅ Application OK')"
```

### Tester un endpoint manuellement

```bash
# Health check
curl http://localhost:8000/api/v1/health/

# Root endpoint
curl http://localhost:8000/

# Recherche de services
curl http://localhost:8000/api/v1/services/search
```

## 🗄️ Base de données et migrations

### Configuration initiale

1. **Créer la base de données PostgreSQL** :
```sql
CREATE DATABASE ganitel_db;
CREATE USER ganitel_user WITH PASSWORD 'ganitel_password';
GRANT ALL PRIVILEGES ON DATABASE ganitel_db TO ganitel_user;
```

2. **Configurer `.env`** :
```env
DATABASE_URL=postgresql://ganitel_user:ganitel_password@localhost:5432/ganitel_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
DEBUG=True
ENVIRONMENT=development
```

### Migrations Alembic

**Avec le script** (recommandé) :
```bash
# Appliquer toutes les migrations
./migrate.sh upgrade

# Créer une nouvelle migration
./migrate.sh create "Description des changements"

# Voir la version actuelle
./migrate.sh current

# Voir l'historique
./migrate.sh history

# Revenir en arrière
./migrate.sh downgrade
```

**Commandes directes** :
```bash
source .venv/bin/activate

# Créer une nouvelle migration (auto-détection)
alembic revision --autogenerate -m "description"

# Appliquer les migrations
alembic upgrade head

# Revenir en arrière
alembic downgrade -1

# Voir l'état
alembic current
alembic history
```

📚 **Voir `MIGRATIONS.md` pour plus de détails**

## 📚 Structure du projet

```
ganitel-backend/
├── app/
│   ├── api/v1/          # Endpoints API
│   ├── application/      # Use cases (logique métier)
│   ├── domain/           # Entités et interfaces
│   ├── infrastructure/   # Implémentations (repositories)
│   ├── config.py         # Configuration
│   ├── database.py       # Configuration DB
│   ├── main.py           # Point d'entrée FastAPI
│   └── exceptions.py     # Exceptions personnalisées
├── tests/                # Tests
├── migrations/           # Migrations Alembic
└── README.md            # Ce fichier
```

## 🐛 Dépannage

### Port déjà utilisé

Si le port 8000 est déjà utilisé :
```bash
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Erreurs d'import

Vérifier que vous êtes dans le bon répertoire et que l'environnement virtuel est activé.

### Erreurs de base de données

Les tests simples ne nécessitent pas de base de données. Pour les fonctionnalités complètes, configurer PostgreSQL et Redis.


