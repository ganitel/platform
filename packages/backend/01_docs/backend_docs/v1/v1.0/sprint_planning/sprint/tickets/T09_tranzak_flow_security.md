# T09 — Tranzak: token flow + endpoints + signature

**Priorité**: P0 (T09)
**Estimation**: 3 jours
**Dépendances**: aucune (indépendant du modèle Property)

## Objectif
Aligner Tranzak (token, mapping, webhooks sécurisés).

## Tâches
- Token /auth/token + cache.
- Headers `Authorization` + `X-App-ID`.
- Mapping `requestId` + `paymentAuthUrl`.
- Signature webhook + idempotence.

## Critères d’acceptation
- Tests paiement passent.
- Webhook traité une seule fois.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
