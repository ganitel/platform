# TX02-P0-durcir-strategie-exception-api

- Source backlog: A-02
- Priorité: P0
- Dépendances tickets: TX01

## Tâche à accomplir
- Standardiser le pattern d’exception sur les endpoints critiques à risque.
- Limiter les captures larges à la frontière HTTP.
- Conserver les handlers globaux métier existants.
- Documenter un snippet de référence unique et l’appliquer aux endpoints prioritaires.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 1 (mapping d’erreurs), section 7.

## DoD
- Pattern d’exception unifié sur les endpoints ciblés.
- Tests de non-régression des codes 400/401/403/404/409/500 passants.
- Aucune fuite de détails internes en 500.
- Revue + merge `dev` + preuve de validation.
