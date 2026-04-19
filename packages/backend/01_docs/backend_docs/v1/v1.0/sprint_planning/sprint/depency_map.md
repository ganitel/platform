# Dependency Map — V1 Sprint

Ce document précise les dépendances **entre epics/tâches** pour éviter les blocages et sécuriser les flux parallèles.

Référence backlog : [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)

---

## 1) Vue d’ensemble (ordre critique)

1. **DB/Migrations V1** (Property/Location/Type/Amenities/Proximity/Reviews/Booking changes)
2. **API/Schemas V1** (endpoints + DTO alignés)
3. **Seed Data V1** (locations, property types, amenities)
4. **Legacy Migration (ETL)** (post‑schema + post‑seed)

---

## 2) Dépendances détaillées

### Epic 2 — Core Property & Localization
**Dépend de** : aucune (base)
**Bloque** : API/Schemas, Seed, Migration legacy

### Epic 3 — Dynamic Amenity System
**Dépend de** : Epic 2 (Property)
**Bloque** : API/Schemas, Seed, Migration legacy

### Epic 4 — Reviews & Ratings
**Dépend de** : Epic 2 (Property) si property‑scoped
**Bloque** : API/Schemas, Tests

### Epic 5 — Booking Negotiation
**Dépend de** : DB migration Booking
**Bloque** : API/Schemas, Tests

### Epic 6 — Proximity
**Dépend de** : Epic 2 (Property)
**Bloque** : API/Schemas

### Epic 7 — API, Schemas, and Migrations
**Dépend de** : Epics 2–6 (tables/champs)
**Bloque** : Seed, Tests, Legacy Migration

### Epic 8 — Tests, Safety, and Coverage
**Dépend de** : API/Schemas, DB migrations
**Bloque** : CI validation

### Epic 9 — Availability Overlap Enforcement
**Dépend de** : Booking schema
**Bloque** : Tests

### Epic 10 — Auth Abuse Protection
**Dépend de** : Redis config (infra)
**Bloque** : Tests de sécurité

### Epic 11 — Upload Validation + R2
**Dépend de** : Config R2
**Bloque** : Tests upload

### Epic 12 — Admin Bootstrap Safety
**Dépend de** : App lifecycle
**Bloque** : Tests (si default admin touché)

### Epic 13 — Makefile Updates
**Dépend de** : aucune
**Bloque** : N/A

### Epic 16 — Legacy Data Migration
**Dépend de** :
- Epics 2–7 (schema + API + seed)
- Migration plan validé : [01_docs/01_v1/sprint_planning/backlog/migration_plan.md](01_docs/01_v1/sprint_planning/backlog/migration_plan.md)
**Bloque** : validation produit sur données legacy

---

## 3) Parallélisation recommandée

**Flux A — Schéma/DB**
- Epics 2, 3, 4, 5, 6, 9

**Flux B — API/Schemas**
- Epic 7 (démarre dès que modèles DB finalisés)

**Flux C — Payments**
- Epic 1 (indépendant du modèle Property)

**Flux D — Uploads & Auth**
- Epics 10, 11 (infra/redis/R2)

**Flux E — Tests & Safety**
- Epic 8 (après DB + API minimal)

**Flux F — Migration legacy**
- Epic 16 (après DB + API + Seed)

---

## 4) Pré‑sprint à figer

- Schémas DB finalisés (tables + champs critiques)
- Contrats d’API minimaux (Properties, Locations, Amenities)
- Règles de mapping legacy confirmées
