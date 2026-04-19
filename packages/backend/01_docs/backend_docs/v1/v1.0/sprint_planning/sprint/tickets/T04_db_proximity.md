# T04 — Schéma DB: Proximity

**Priorité**: P0 (T04)
**Estimation**: 1.5 jours
**Dépendances**: T01

## Objectif
Ajouter la table `Proximity` pour l’accessibilité des propriétés.

## Portée
- `Proximity` (property_id, destination_name, minutes_away, travel_mode).

## Tâches
- Créer entité SQLAlchemy + migration.
- Ajouter index `property_id`.

## Critères d’acceptation
- Migrations appliquées.
- CRUD possible via repository (si créé dans ticket API).

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
