# Exception & Logging Hardening — Implémentation (Pré-Sprint)

Date: 2026-02-27  
Scope: centralisation des erreurs métier, suppression des fuites en 500, remplacement des `print()` critiques.

## Objectifs couverts

1. Centraliser la gestion des exceptions métier (`GanitelException`) via handlers globaux FastAPI.
2. Empêcher l’exposition de détails internes dans les réponses HTTP 500.
3. Remplacer les logs critiques `print()` par logging structuré key-value.

## Changements techniques

### 1) Handlers globaux d’exceptions

Fichier: `app/core/exception_handlers.py`

- Ajout de `register_exception_handlers(app)`.
- Handler `GanitelException`:
  - statut = `exc.status_code`
  - payload standard:
    - `detail`
    - `error_code`
    - `request_id`
- Handler `Exception` (fallback global):
  - statut `500`
  - payload standard générique:
    - `detail = "An internal error occurred"`
    - `error_code = "InternalServerError"`
    - `request_id`
- Les handlers extraient le `request_id` depuis `X-Request-ID` (ou génèrent un UUID).

### 2) Intégration dans l’application

Fichier: `app/main.py`

- Enregistrement des handlers globaux via `register_exception_handlers(app)`.
- Ajout d’une configuration logging centralisée (`app/core/logging_config.py`).
- Remplacement des `print()` critiques de startup/lifespan/bootstrap admin par:
  - `logger.info(...)`
  - `logger.warning(...)`
  - `logger.exception(...)`

### 3) Suppression des fuites d’erreurs en 500

Fichiers:
- `app/api/v1/endpoints/payments.py`
- `app/api/v1/endpoints/admin.py`

Principes appliqués:
- Plus de `detail=str(e)` dans les erreurs 500.
- Plus de `print(traceback...)` en endpoint.
- Journalisation serveur via `logger.exception(...)`.
- Message API générique pour 500:
  - `Payment initiation failed`
  - `Refund failed`
  - `Failed to get statistics`
  - `Webhook processing failed` (réponse webhook)

### 4) Adoption du handler global métier

Fichier: `app/api/v1/endpoints/payments.py`

- Les `GanitelException` ne sont plus transformées en `HTTPException` locale sur les parcours ciblés.
- Elles sont relancées (`raise`) pour être formatées de manière homogène par le handler global.

## Contrat API d’erreur standardisé

Pour les exceptions métier et fallback serveur:

```json
{
  "detail": "...",
  "error_code": "...",
  "request_id": "..."
}
```

## Tests ajoutés

Fichier: `tests/test_exception_handling.py`

- `GanitelException` -> payload standard (`detail`, `error_code`, `request_id`).
- Exception non gérée -> `500` générique sans fuite de détails internes.
- `payments/initiate` -> 500 générique sans fuite (`RuntimeError` simulée).
- `admin/stats` -> 500 générique sans fuite (`RuntimeError` simulée).

## Impact

- Réduction du risque de fuite d’informations internes (SQL, paths, stack traces).
- Uniformisation des réponses d’erreur consommées par le frontend.
- Base de logs plus exploitable en opération (niveaux + contexte + corrélation request).
