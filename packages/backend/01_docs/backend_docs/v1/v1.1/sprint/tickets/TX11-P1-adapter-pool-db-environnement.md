# TX11-P1-adapter-pool-db-environnement

- Source backlog: A-05
- Priorité: P1
- Dépendances tickets: Aucune

## Tâche à accomplir
- Définir `pool_size` et `max_overflow` par environnement.
- Intégrer validation au démarrage.
- Vérifier cohérence settings ↔ engine DB.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 5.1 (pool DB), section 7.

## DoD
- Tests unitaires settings passants.
- Startup validé en local/staging/prod.
- Configuration documentée.
- Revue + merge `dev` + preuve de validation.
