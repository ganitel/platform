# Contracts & Interfaces — Parallel Development (V1 Sprint)

Objectif : définir les **interfaces/contrats stables** pour permettre des flux de dev parallèles sans blocage. Ce document s’appuie sur le backlog : [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md).

---

## 1) Contrats de données (DB / Domain)

### 1.1 Property & Localization
**Contrat**
- `Property` (id, title, description, property_type_id, location_id, price, capacity, checkin/out, etc.)
- `Location` (id, name, optional region)
- `PropertyType` (id, name)

**Teams dépendantes**
- API & Schemas
- Seed data
- Migration legacy

### 1.2 Amenities catégorisés
**Contrat**
- `AmenityCategory` (id, name)
- `Amenity` (id, category_id, name_en, name_fr, icon_url)
- `PropertyAmenity` (property_id, amenity_id)

**Teams dépendantes**
- API & Schemas
- Seed data
- Migration legacy

### 1.3 Booking & Negotiation
**Contrat**
- `Booking.status` inclut `NEGOTIATING`
- `Booking.negotiated_price` (Numeric)

**Teams dépendantes**
- API & Schemas
- Tests

### 1.4 Reviews V1
**Contrat**
- Ajout champs : comfort, security, accessibility, host_response
- `Review.property_id` optionnel

**Teams dépendantes**
- API & Schemas
- Tests

### 1.5 Proximity
**Contrat**
- `Proximity` (property_id, destination_name, minutes_away, travel_mode)

**Teams dépendantes**
- API & Schemas

---

## 2) Contrats d’API (Endpoints + Schemas)

### 2.1 Properties
**Contrat minimal**
- Create/Update accepte `location_id` + `property_type_id`
- Read retourne `location` et `property_type`

### 2.2 Locations & PropertyTypes
**Contrat minimal**
- Endpoints de lecture (list)
- IDs stables pour usage UI/seed

### 2.3 Amenities
**Contrat minimal**
- `GET /amenities/categories` → catégories + amenities
- `Property` read retourne amenities regroupées

### 2.4 Reviews
**Contrat minimal**
- Champs de rating V1 exposés en write/read

### 2.5 Tranzak
**Contrat minimal**
- Réponses `initiate` incluent `requestId` + `paymentAuthUrl`
- Webhook signature + idempotence

### 2.6 Uploads (R2)
**Contrat minimal**
- `upload_image` retourne URL R2/CDN
- `delete_file` accepte URL ou key

---

## 3) Contrats de migration legacy

**Référence** : [01_docs/01_v1/sprint_planning/backlog/migration_plan.md](01_docs/01_v1/sprint_planning/backlog/migration_plan.md)

Contrats stables requis pour exécuter l’ETL :
- Existence des tables `properties`, `locations`, `property_types`, `amenities`, `amenity_categories`, `property_amenities`.
- Mapping de `Service` pour propriétés **publiées** uniquement.
- `metadata` JSON conserve une whitelist (`legacy_id`, `legacy_source`, etc.).

---

## 4) Contrats de test & sécurité

**Contrat minimal**
- Tests doivent échouer si `TESTING!=true` ou DB non dédiée.
- TestClient unique (factory) utilisé par toutes les suites.

---

## 5) Livrables par flux (parallélisables)

- **DB/Migrations** : tables V1 + champs.
- **API/Schemas** : endpoints et DTOs alignés V1.
- **Seed** : locations, property types, amenities.
- **Payments** : Tranzak client + webhooks.
- **Uploads** : R2.
- **Tests** : safety + nouvelles specs.
- **Migration legacy** : script ETL post‑schema.
