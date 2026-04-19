# T13 — Admin bootstrap safety

**Priorité**: P0 (T13)
**Estimation**: 1.5 jours
**Dépendances**: App lifecycle

## Objectif
Supprimer la création admin non sécurisée et ajouter un script safe.

## Tâches
- Gate par ENV (local/staging uniquement).
- Remplacer endpoint par script sécurisé.

## Critères d’acceptation
- Aucun admin créé en production.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
