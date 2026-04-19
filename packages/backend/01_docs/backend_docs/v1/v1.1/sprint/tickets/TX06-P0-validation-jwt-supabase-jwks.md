# TX06-P0-validation-jwt-supabase-jwks

- Source backlog: B-02
- Priorité: P0
- Dépendances tickets: TX05

## Tâche à accomplir
- Implémenter validation JWT Supabase via JWKS avec cache/rotation de clés.
- Valider strictement `iss`, `aud`, `exp`, `nbf`.
- Rejeter les tokens non conformes/non Supabase.
- Exposer un provider de validation réutilisable.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 4.1 (TokenValidator), section 4.3.

## DoD
- Tests unitaires signatures/claims passants.
- Cas invalid token, expired, bad aud/iss couverts.
- Provider documenté et utilisable par dépendances FastAPI.
- Revue + merge `dev` + preuve de validation.
