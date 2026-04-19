# T07 — API & Schemas: Models V1 (Property/Location/Type/Amenities/Proximity)

**Priorité**: P0 (T07)
**Estimation**: 3 jours
**Dépendances**: T01, T02, T04, T05

## Objectif
Mettre à jour l’API et les DTOs pour les nouveaux modèles V1.

## Portée
- Endpoints de lecture pour Locations, PropertyTypes, Amenities, Proximity.
- Create/Update property avec `location_id` + `property_type_id`.

## Tâches
- Ajuster schémas Pydantic.
- Adapter endpoints existants (services/properties).

## Critères d’acceptation
- OpenAPI reflète les nouveaux champs.
- Réponses incluent location/type/amenities.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
- Contracts: [01_docs/01_v1/sprint_planning/sprint/contract_interfaces.md](01_docs/01_v1/sprint_planning/sprint/contract_interfaces.md)
