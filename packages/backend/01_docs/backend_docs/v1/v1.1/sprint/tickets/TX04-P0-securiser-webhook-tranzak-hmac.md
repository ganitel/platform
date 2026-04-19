# TX04-P0-securiser-webhook-tranzak-hmac

- Source backlog: A-04
- Priorité: P0
- Dépendances tickets: TX01, TX02

## Tâche à accomplir
- Vérifier la signature HMAC via header dédié sur le body brut de la requête.
- Faire une comparaison en temps constant.
- Rejeter les signatures absentes/invalides.
- Garder une réponse webhook générique sans détails internes.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 2 (Webhook signé), section 1 (erreurs API), section 7.

## DoD
- Signature valide => événement traité.
- Signature absente/invalide => rejet.
- Payload altéré => rejet.
- Logs exploitables sans fuite sensible.
- Revue + merge `dev` + preuve de validation.
