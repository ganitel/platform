# T01 — Schéma DB: Property + Location + PropertyType

**Priorité**: P0 (T01)
**Estimation**: 3 jours
**Dépendances**: Aucune (base du sprint)

## Objectif
Créer le socle du modèle d’hébergement en base : `Property`, `Location`, `PropertyType`.

## Portée
- Nouvelles tables + relations FK.
- Champs clés selon backlog V1.

## Tâches
- Définir les entités SQLAlchemy.
- Créer migration Alembic.
- Vérifier indexes nécessaires (location_id, property_type_id, provider_id).

## Critères d’acceptation
- Migrations appliquées sans erreur sur DB vide.
- `Property` référence `Location` et `PropertyType` via FK.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
- Contracts: [01_docs/01_v1/sprint_planning/sprint/contract_interfaces.md](01_docs/01_v1/sprint_planning/sprint/contract_interfaces.md)
