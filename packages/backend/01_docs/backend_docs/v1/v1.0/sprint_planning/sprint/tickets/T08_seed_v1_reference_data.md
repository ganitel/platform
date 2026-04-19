# T08 — Seed data V1 (Locations, PropertyTypes, Amenities)

**Priorité**: P0 (T08)
**Estimation**: 2 jours
**Dépendances**: T01, T02
**Status**: ✅ COMPLETED

## Objectif
Charger les données de référence (villes, types, amenities).

## Tâches
- ✅ Script de seed idempotent ([`app/scripts/seed_reference_data.py`](../../../app/scripts/seed_reference_data.py))
- ✅ Vérifier absence de doublons (script utilise contraintes uniques et vérification existence)
- ✅ Endpoints API pour accéder aux données ([`app/api/v1/endpoints/reference_data.py`](../../../app/api/v1/endpoints/reference_data.py))

## Critères d'acceptation
- ✅ Seed exécuté plusieurs fois sans duplication
  - Script est idempotent: vérifie existence avant insertion
  - Utilise contraintes uniques sur les noms
  
- ✅ Données visibles via API
  - GET `/api/v1/reference/locations`
  - GET `/api/v1/reference/property-types`
  - GET `/api/v1/reference/amenity-categories`
  - GET `/api/v1/reference/amenities`

## Implémentation Détaillée

### 1. Script de seed idempotent
**Fichier**: `app/scripts/seed_reference_data.py`

Le script charge:
- **5 Locations**: Douala, Yaoundé, Buea, Limbe, Kribi (avec régions)
- **5 Property Types**: Apartment, Duplex, Villa, Studio, Room
- **5 Amenity Categories** + **24 Amenities**:
  - General (7: WiFi, Cable TV, Parking, AC, Heating, Washer, Dryer)
  - Living Room (5: Sofa, Coffee Table, Dining Table, Balcony, Terrace)
  - Main Bedroom (5: King Bed, Queen Bed, Single Bed, Wardrobe, Bedside Lamp)
  - Kitchen (6: Oven, Microwave, Refrigerator, Dishwasher, Utensils, Stove)
  - Security (5: Security Room, CCTV, Guard, Emergency Light, Fire Extinguisher)

**Exécution**: `make seed` ou `python -m app.scripts.seed_reference_data`

### 2. Endpoints API

**Base**: `/api/v1/reference`

Endpoints pour accéder aux données:
- `GET /locations` - Toutes les villes
- `GET /locations/{id}` - Détail d'une ville
- `GET /property-types` - Tous les types de propriété
- `GET /property-types/{id}` - Détail d'un type
- `GET /amenity-categories` - Catégories (avec amenities liées)
- `GET /amenities` - Toutes les amenities
- `GET /amenities?category_id=...` - Filtrer par catégorie

### 3. Test d'idempotence

Exécuter le seed plusieurs fois retourne les mêmes résultats sans doublons:
```bash
make seed  # Première exécution créé les données
make seed  # Deuxième exécution skip les données existantes
```

## Références
- Backlog: [01_docs/01_v1/sprint_planning/01_backlog/sprint_backlog.md](../../../01_docs/01_v1/sprint_planning/01_backlog/sprint_backlog.md)
- Script: [app/scripts/seed_reference_data.py](../../../app/scripts/seed_reference_data.py)
- Endpoints: [app/api/v1/endpoints/reference_data.py](../../../app/api/v1/endpoints/reference_data.py)
