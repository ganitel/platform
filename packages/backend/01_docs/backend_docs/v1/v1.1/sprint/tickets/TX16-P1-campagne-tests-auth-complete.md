# TX16-P1-campagne-tests-auth-complete

- Source backlog: B-07
- Priorité: P1
- Dépendances tickets: TX06, TX09, TX13

## Tâche à accomplir
- Mettre en place campagne tests auth unit + integration + e2e.
- Couvrir cas: invalid token, expired, bad aud/iss, rôle insuffisant.
- Stabiliser les scénarios de non-régression auth.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 6 (contrat de test minimum), section 4 (auth Supabase).

## DoD
- Couverture auth multi-niveaux en place et passante.
- Cas négatifs sécurité auth couverts.
- Rapport de campagne publié.
- Revue + merge `dev` + preuve de validation.
