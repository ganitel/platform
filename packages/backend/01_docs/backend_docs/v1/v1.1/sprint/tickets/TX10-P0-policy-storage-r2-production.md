# TX10-P0-policy-storage-r2-production

- Source backlog: C-01
- Priorité: P0
- Dépendances tickets: TX03
- Dépendance recommandée: TX09

## Tâche à accomplir
- Imposer fail-fast en production si `STORAGE_TYPE != r2`.
- Garder local/staging compatibles MinIO/local selon policy.
- Standardiser la configuration endpoints/credentials storage.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 3 (accès média), section 5.2 (storage policy).

## DoD
- Boot prod sans R2 => erreur bloquante explicite.
- Local/staging MinIO/local fonctionnels.
- Documentation env mise à jour.
- Revue + merge `dev` + preuve de validation.
