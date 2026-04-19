# T11 — Auth: rate limit + lockout

**Priorité**: P0 (T11)
**Estimation**: 2.5 jours
**Dépendances**: Redis dispo

## Objectif
Limiter les abus login/OTP et normaliser les erreurs.

## Tâches
- Middleware rate‑limit Redis.
- Lockout après N échecs.
- Messages d’erreur uniformes.

## Critères d’acceptation
- Tentatives excessives bloquées.
- Aucun signal d’énumération utilisateur.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
