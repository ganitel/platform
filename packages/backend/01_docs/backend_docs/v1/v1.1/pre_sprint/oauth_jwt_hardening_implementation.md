# OAuth & JWT Hardening — Implémentation (Pré-Sprint)

Date: 2026-02-27
Scope: suppression de l’exposition des tokens OAuth, redirections d’erreur génériques, validation stricte du type de JWT.

## Objectifs couverts

1. Retirer les tokens OAuth des URLs de redirection.
2. Supprimer les détails d’exception exposés au client lors des callbacks OAuth.
3. Refuser les `refresh` tokens sur les endpoints API protégés (accepter uniquement `type=access`).

## Changements techniques

### 1) Code OAuth temporaire (Redis, TTL court, one-time)

- Nouveau module: `app/core/oauth_exchange.py`
- Principe:
  - Génération d’un code aléatoire (`token_urlsafe`).
  - Stockage Redis avec clé `oauth_exchange_code:<code>`.
  - TTL par défaut: `60` secondes.
  - Consommation en usage unique (`GETDEL` si disponible, sinon `GET` + `DELETE`).
- Payload stocké: `{ "user_id": "...", "provider": "google|facebook" }`

### 2) Callbacks OAuth sécurisés

Fichier: `app/api/v1/endpoints/auth.py`

- `GET /api/v1/auth/oauth/google/callback`
- `GET /api/v1/auth/oauth/facebook/callback`

Nouveau comportement:

- En succès:
  - Plus de `token=<jwt>` dans l’URL.
  - Redirection vers frontend avec `code=<temporary_code>&provider=<provider>`.
- En erreur:
  - Redirection avec message générique uniquement:
    - `error=oauth_callback_failed`
  - Le détail technique est journalisé côté serveur (`logger.warning` / `logger.exception`) avec `request_id`.

### 3) Endpoint d’échange sécurisé par POST

Fichier: `app/api/v1/endpoints/auth.py`

- Nouveau endpoint: `POST /api/v1/auth/oauth/exchange-code`
- Schéma d’entrée: `OAuthCodeExchangeRequest` (`code`, `provider`)
- Étapes:
  - Valide et consomme le code temporaire en Redis (one-time).
  - Vérifie que le provider correspond.
  - Vérifie l’existence de l’utilisateur.
  - Émet un nouvel access token JWT et retourne `TokenResponse`.
- En cas d’erreur/expiration/rejeu:
  - `401` avec `"Invalid or expired OAuth code"`.

### 4) Validation stricte du type de JWT

Fichier: `app/dependencies.py`

- `get_current_user_id` vérifie explicitement `payload["type"] == "access"`.
- Si type différent (`refresh`, etc.), retourne `401` avec `"Invalid token type"`.
- `get_optional_current_user` ignore désormais aussi les tokens non-access (retourne `None`).

## Contrat frontend (mis à jour)

### Étape A — Callback browser

Après authentification fournisseur, le frontend reçoit:

- succès: `/auth/callback?code=<temporary_code>&provider=<google|facebook>`
- erreur: `/auth/callback?error=oauth_callback_failed&provider=<...>&ref=<request_id>`

### Étape B — Échange backend

Le frontend appelle immédiatement:

`POST /api/v1/auth/oauth/exchange-code`

Body JSON:

```json
{
  "code": "<temporary_code>",
  "provider": "google"
}
```

Réponse:

- `200`: `{ "access_token": "...", "token_type": "bearer", "refresh_token": null }`
- `401`: code invalide/expiré/rejoué

## Tests ajoutés

Fichier: `tests/test_auth_endpoints.py`

- Callback OAuth ne met jamais de JWT dans l’URL.
- Échange code OAuth valide -> access token JWT valide (`type=access`).
- Rejeu du même code -> `401`.
- Erreur callback OAuth -> redirection générique sans fuite du message interne.
- `refresh_token` refusé sur endpoint protégé (`/auth/logout`) -> `401 Invalid token type`.

## Impact sécurité

- Réduction forte du risque de fuite JWT via URL/history/referer/logs.
- Réduction de l’exposition d’informations internes côté client.
- Blocage explicite de l’usage des refresh tokens pour l’accès API.
