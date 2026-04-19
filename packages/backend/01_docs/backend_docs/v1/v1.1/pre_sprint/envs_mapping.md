# Environments Mapping (Pre-Sprint Baseline)

Objectif: unifier les environnements et éviter les divergences de comportement.

## Règle de normalisation

- `local` est conservé pour l'équipe, mais est traité comme `development` par la policy de `app/config.py`.
- Valeurs autorisées pour `ENVIRONMENT`: `local`, `development`, `test`, `staging`, `production`.
- En interne, `local` et `development` partagent la même policy.

## Matrice finale (valeurs attendues)

| Clé | local (alias dev) | test | staging | production |
|---|---|---|---|---|
| `ENVIRONMENT` | `local` | `test` | `staging` | `production` |
| `DEBUG` | `true` (par défaut) | `false` (par défaut, autorisé) | `false` (par défaut, autorisé) | `false` (obligatoire) |
| `TESTING` | `false` | `true` | `true` | `false` |
| `ALGORITHM` | `HS256` | `HS256` | `HS256` | `HS256` |
| `ENV_WORKERS` | `2` (défaut policy) | `1` (défaut policy) | `>=2` (défaut `2`) | `>=2` (défaut `3`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` (défaut policy) | `30` (défaut policy) | `15-30` (défaut `30`) | `15-30` (défaut `15`) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | `7` | `7` | `7` |
| `CORS_ORIGINS` | localhost explicites | localhost explicites | domaines staging uniquement | domaines prod uniquement |
| `CORS_ALLOW_CREDENTIALS` | `true` | `true` | `true` (sans `*`) | `true` (sans `*`) |
| `DATABASE_URL` | PostgreSQL local/docker | PostgreSQL obligatoire | PostgreSQL staging | PostgreSQL production |
| `REDIS_URL` | redis local/docker | redis test | redis staging | redis production |

## Ports hôtes (anti-conflits)

Ports internes des services (stables):

- App: `8000`
- PostgreSQL: `5432`
- Redis: `6379`

Ports exposés sur l'hôte (configurables):

| Clé | local (recommandé) | staging (recommandé) |
|---|---|---|
| `APP_HOST_PORT` | `8000` | `8001` |
| `POSTGRES_HOST_PORT` | `5432` | `5434` |
| `REDIS_HOST_PORT` | `6379` | `6380` |
| `TEST_POSTGRES_HOST_PORT` | `5433` | n/a |
| `PGADMIN_HOST_PORT` | `5050` | n/a |

## Secrets et fail-fast

En `staging` et `production`, l'application doit refuser de démarrer si:

- `DEBUG=true` en `production`.

- `SECRET_KEY` est la valeur par défaut ou < 32 caractères.
- `ADMIN_EMAIL` est la valeur par défaut (`admin@ganitel.com`).
- `ADMIN_PASSWORD` est la valeur par défaut.
- `ACCESS_TOKEN_EXPIRE_MINUTES` est hors intervalle `15-30`.
- `ENV_WORKERS < 2` en `staging`/`production`.
- Un port hôte est hors plage valide (`<1` ou `>65535`).
- Deux bindings de ports hôtes utilisent la même valeur sur un même environnement.
- Un secret critique est placeholder (`your-*` / vide), notamment:
	- `TRANZAK_*` clés principales
	- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
	- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
	- `ORANGE_MONEY_CLIENT_ID`, `ORANGE_MONEY_CLIENT_SECRET`, `ORANGE_MONEY_MERCHANT_KEY`
	- `MOBILE_MONEY_BASIC_AUTH`

## Clés à utiliser (source de vérité)

Le runtime lit **uniquement** les clés définies dans `app/config.py`.

En particulier, ne pas utiliser:

- `JWT_SECRET_KEY` (remplacé par `SECRET_KEY`)
- `JWT_ALGORITHM` (remplacé par `ALGORITHM`)

## Politique tests

- Les tests tournent **uniquement** sur PostgreSQL.
- Le fallback SQLite est supprimé.
- Si PostgreSQL est inaccessible, la suite échoue immédiatement.

