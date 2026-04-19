# T12 — Tests: safety + app factory

**Priorité**: P0 (T12)
**Estimation**: 3 jours
**Dépendances**: DB + API minimal

## Objectif
Sécuriser l’exécution des tests et uniformiser le client.

## Tâches
- Bloquer tests si `TESTING!=true`.
- Factory app unique pour toutes les suites.
- Nettoyage tables via metadata.

## Critères d’acceptation
- Tests refusent de démarrer sans DB de test.
- Performance/security utilisent la factory.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
