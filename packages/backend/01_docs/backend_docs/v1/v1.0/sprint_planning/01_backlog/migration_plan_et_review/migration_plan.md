# Migration Strategy (Old Platform → Ganitel V1)

This document defines the detailed migration strategy assuming the **new schema from the backlog is already applied** (Properties, Locations, PropertyTypes, AmenityCategories, Amenities, PropertyAmenities, Proximity, Reviews, etc.).

---

## 1) Objectives
- Migrate the legacy MySQL data (`residencemg_backup.sql`) into the new V1 schema.
- Preserve data integrity with deterministic ID mapping (idempotent runs).
- Populate only the **accommodation/property** domain (per choices: cars/food modules are excluded).
- Keep legacy media URLs as-is (R2 migration done later).

---

## 2) Scope (Included vs Excluded)

### Included (P0)
- `houses` → `properties`
- `house_type` → `property_types`
- `city` (+ `region` if present) → `locations`
- `facilities` → `amenities`
- property ↔ facility links → `property_amenities`
- `user` (legacy table) → `users`

### Excluded (by decision)
- `cars`, `car_orders`
- `foods`, `food_drinks`, `restaurants`, `orders`
- blog / comments / contact_messages

---

## 3) High‑Level Flow (ETL)

1. **Extract** legacy tables from MySQL into a staging schema.
2. **Transform** records to V1 format (normalization, defaults, mapping tables).
3. **Load** into Postgres using idempotent inserts.
4. **Validate** counts, FK integrity, and anomaly report.

---

## 4) Mapping Strategy

### 4.1 Users
**Source:** legacy `user`
- Normalize phone/email, deduplicate by email or phone.
- Generate UUID for each unique user.
- Assign default roles: traveler/provider based on legacy usage (if ambiguous, default to traveler).

**Target:** `users`
- Minimal required fields + default values (language, currency, status, is_verified).
- Add `legacy_user_id` in a mapping table (not in users table).

### 4.2 Locations
**Source:** `city` (+ `region` if present)
- Create `locations` with `name`, `region` (if available).
- Deduplicate by name.

**Target:** `locations`
- Map old `city.id` → `locations.id` in mapping table.

### 4.3 PropertyTypes
**Source:** `house_type`
- Normalize to V1 types (Apartment, Duplex, Villa, Studio, Room).
- If legacy value is “Duplex/Villa” map to “Duplex” (or “Villa” if rules decide).

**Target:** `property_types`

### 4.4 Properties
**Source:** `houses`
- Create `properties` with:
  - title/description
  - location_id (from city mapping)
  - property_type_id (from house_type mapping)
  - room/bath/bed counts (if present)
  - price fields (normalized numeric)
  - check‑in/out times (defaults if missing)
- Create a related `service` (accommodation) entry if needed by API.

**Target:** `properties` + `services` (linked)

### 4.5 Amenities
**Source:** `facilities`
- Create default categories (General, Living Room, Main Bedroom, Kitchen, Security).
- Assign facility to a category using a mapping dictionary.

**Target:** `amenities` + `amenity_categories` + `property_amenities`

### 4.6 Proximity
**Source:** legacy may not contain explicit proximity data.
- Skip unless a relevant table exists.

---

## 5) Idempotence and Mapping Tables

For each legacy table, store an `old_id → new_uuid` mapping in **migration mapping tables**, e.g.:
- `migration_map_users`
- `migration_map_locations`
- `migration_map_property_types`
- `migration_map_properties`
- `migration_map_amenities`

These tables allow:
- Safe re-runs without duplication
- Traceability for validation

---

## 6) Default Values & Data Hygiene

When legacy data is missing required fields:
- Use defaults (e.g., status = ACTIVE, currency = XAF)
- Add tags like `legacy_imported = true` (if field exists) or keep a migration report

Dedup rules:
- Prefer email, then phone
- If both missing, create placeholder unique email

---

## 7) Validation & Reporting

After load:
- Count comparisons (source vs target)
- Foreign key integrity checks
- Duplicates report
- Null-required fields report

Deliverable:
- `migration_report.json` + `migration_report.md`

---

## 8) Execution Order

1. Load mapping tables (users, locations, property_types)
2. Load properties + services
3. Load amenities + categories
4. Link property_amenities
5. Run validation

---

## 9) Rollback Strategy

- All migration runs are wrapped in transactions per table group.
- If a step fails, rollback that group, log error, continue to next (optional).

---

## 10) Deliverables

- Python ETL script
- Mapping tables + migration reports
- Re-runnable migration with idempotence

---

## 11) Decisions (validated)

- **Service creation:** only for properties that were **published/active** in legacy (choice 1B).
- **Duplex/Villa mapping:** map based on **keywords in title/description** (if “villa” → Villa, else Duplex) (choice 2C).
- **Legacy metadata:** preserve a **whitelisted subset** in `metadata` (choice 3B), e.g. `legacy_id`, `legacy_source`, `legacy_status`, `legacy_type_label`, `legacy_media_paths`.
