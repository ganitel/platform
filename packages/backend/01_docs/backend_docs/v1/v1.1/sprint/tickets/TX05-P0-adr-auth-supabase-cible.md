# TX05-P0-adr-auth-supabase-cible

- Source backlog: B-01
- Priorité: P0
- Dépendances tickets: TX01, TX02, TX03, TX04

## Tâche à accomplir
- Rédiger et faire valider l’ADR auth Supabase (source de vérité auth).
- Définir claims et règles de validation (`sub`, `email`, `roles`, `iss`, `aud`, `exp`, `nbf`).
- Définir politique de provisioning utilisateur local.
- Inclure schéma de flux et stratégie de rollback.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 4 (auth Supabase), section 7.

## DoD
- ADR signé/validé.
- Schéma de flux auth publié.
- Règles claims/provisioning sans ambiguïté.
- Preuve de validation (review architecture).
