# TX07-P0-remplacer-dependances-auth-backend

- Source backlog: B-03
- Priorité: P0
- Dépendances tickets: TX06

## Tâche à accomplir
- Migrer `get_current_user`, `get_current_admin`, `get_optional_current_user` vers Supabase JWT validé JWKS.
- Préserver compatibilité des contrôles de rôles côté endpoints métier.
- Harmoniser les retours d’erreurs auth avec le contrat API.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 4.3 (dépendances FastAPI), section 1 (erreurs API).

## DoD
- Dépendances auth unifiées Supabase en place.
- Tests API authz/roles passants.
- Aucun endpoint métier cassé par la migration des dépendances.
- Revue + merge `dev` + preuve de validation.
