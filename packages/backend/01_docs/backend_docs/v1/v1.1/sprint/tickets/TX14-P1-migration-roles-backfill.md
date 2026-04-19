# TX14-P1-migration-roles-backfill

- Source backlog: B-06
- Priorité: P1
- Dépendances tickets: TX08

## Tâche à accomplir
- Implémenter mapping claims Supabase (`admin/provider/traveler`) vers rôles locaux.
- Écrire script de backfill utilisateurs existants.
- Journaliser les anomalies de mapping.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 4.2 (provisioning), section 4 (claims), section 7.

## DoD
- Mapping rôles validé sur cas nominaux et cas limites.
- Script backfill exécutable avec rapport.
- Pas de corruption de rôles existants.
- Revue + merge `dev` + preuve de validation.
