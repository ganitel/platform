# T15 — Migration legacy (ETL post‑schema)

**Priorité**: P0 (T15)
**Estimation**: 3 jours
**Dépendances**: T01–T08 (schéma + API + seed)

## Objectif
Migrer les données legacy vers le nouveau schéma (post‑schema).

## Portée
- Users, locations, property_types, properties, amenities.
- Mapping idempotent + metadata whitelist.

## Tâches
- Implémenter ETL selon le plan.
- Générer report de migration.

## Critères d’acceptation
- Idempotence validée.
- Rapport généré (counts + FK).

## Références
- Migration plan: [01_docs/01_v1/sprint_planning/backlog/migration_plan.md](01_docs/01_v1/sprint_planning/backlog/migration_plan.md)
