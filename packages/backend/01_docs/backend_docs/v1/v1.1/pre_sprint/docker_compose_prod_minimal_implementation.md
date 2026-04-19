# Docker Compose Production Minimal Viable — Implémentation (Pré-Sprint)

Date: 2026-02-27  
Scope: ajout d’une référence de déploiement production testable et cohérente avec la policy applicative.

## Objectif

Mettre en place une base `docker-compose.prod.yml` permettant:
- exécution app en mode production avec Gunicorn multi-workers,
- redémarrage automatique,
- limites de ressources,
- variables de production explicites/fail-fast,
- validation via `docker compose config`.

## Changements livrés

### 1) Nouveau fichier `docker-compose.prod.yml`

Fichier: `docker-compose.prod.yml`

Services inclus:
- `app` (FastAPI via `gunicorn` + `uvicorn.workers.UvicornWorker`)
- `db` (PostgreSQL 15)
- `redis` (Redis 7)

Mesures clés:
- `restart: always` sur les 3 services
- `deploy.resources` (limits + reservations) définies
- healthchecks pour app/db/redis
- exposition des ports hôtes pilotée par `.env`:
	- `APP_HOST_PORT`
	- `POSTGRES_HOST_PORT`
	- `REDIS_HOST_PORT`
- variables critiques marquées obligatoires (`${VAR:?message}`) pour fail-fast
- `ENVIRONMENT=production`, `DEBUG=False`, `ENV_WORKERS` appliqué

Compatibilité hôte:
- la limite CPU de `app` est fixée à `2.0` pour rester compatible avec les machines disposant de 2 vCPU.

### 2) Template d’environnement production

Fichier: `.env.prod.example`

Ajouts:
- base complète de variables prod alignée avec `app/config.py`
- valeurs placeholders explicites pour secrets critiques
- valeurs de sécurité par défaut recommandées (`ACCESS_TOKEN_EXPIRE_MINUTES=15`, `REFRESH_TOKEN_EXPIRE_DAYS=7`)

### 3) Intégration Makefile (auto-activation prod)

Fichier: `Makefile`

Mises à jour:
- ajout `ENV_FILE_prod ?= .env.prod`
- ajout lecture de `APP_HOST_PORT_prod` depuis `.env.prod`
- remplacement du `PORTS_prod := 8000` statique par un port prod dynamique

Rappel: les cibles `prod-*` sont déjà auto-activées dès présence de `docker-compose.prod.yml`.

### 4) Checklist pré-sprint

Fichier: `todo_presprint_checklist.md`

- Item coché: `Créer docker-compose.prod.yml minimal viable`.

## Commandes de validation

1. Préparer le fichier runtime:

```bash
cp .env.prod.example .env.prod
# puis éditer .env.prod avec des secrets réels
```

2. Valider le rendu compose:

```bash
COMPOSE_PROJECT_NAME=ganitel-prod docker compose -f docker-compose.prod.yml --env-file .env.prod config
```

3. Démarrer/contrôler via Make:

```bash
make prod-up
make prod-health
make prod-logs-app
```

## Notes de sécurité

- Les secrets critiques sont requis au lancement via expansion `${VAR:?}`.
- Le durcissement de l’image runtime est appliqué: `requirements-test.txt` n’est plus installé dans l’image `runtime`; un target `test` dédié est utilisé pour les pipelines/tests.
- Si l’infra n’exige pas l’accès direct DB/Redis depuis l’hôte, fixer `POSTGRES_HOST_PORT`/`REDIS_HOST_PORT` à des ports non exposés publiquement via firewall et règles réseau.
