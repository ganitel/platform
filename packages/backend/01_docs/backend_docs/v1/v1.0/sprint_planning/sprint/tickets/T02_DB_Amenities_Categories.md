# T02 — Schéma DB: AmenityCategory + Amenity + PropertyAmenity

**Priorité**: P0 (T02)
**Estimation**: 2 jours
**Dépendances**: T01

## Objectif
Mettre en place le modèle d’amenities catégorisés et la jointure property‑amenity.

## Portée
- Tables `amenity_categories`, `amenities`, `property_amenities`.
- Champs localisés (name_en, name_fr) et icônes.

## Tâches
- Ajouter entités SQLAlchemy.
- Créer migration Alembic.
- Indexes sur `category_id` et `property_id`.

## Critères d’acceptation
- Migrations appliquées sans erreur.
- Jointure property‑amenity fonctionnelle.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
- Contracts: [01_docs/01_v1/sprint_planning/sprint/contract_interfaces.md](01_docs/01_v1/sprint_planning/sprint/contract_interfaces.md)
