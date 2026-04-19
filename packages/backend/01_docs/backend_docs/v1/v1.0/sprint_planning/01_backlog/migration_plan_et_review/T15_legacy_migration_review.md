# T15 — Legacy Migration Review

Date: 2026-02-24  
Source: `residencemg_backup.sql`

## Summary
- Migration executed successfully.
- Scope loaded: users, locations, property_types, properties, amenities, property_amenities, services.
- Anomalies reported: 0 on both runs.

## Run 1 (apply)
- users: created 179, updated 3, mapped 182
- locations: created 0, updated 3
- property_types: mapped 4
- properties: created 326, updated 0
- services: created 326, updated 0
- amenities: created 17, updated 0
- property_amenities linked: 2977
- anomalies_count: 0

## Run 2 (apply re-execution)
- users: created 0, updated 6, mapped 182
- locations: created 0, updated 0
- property_types: mapped 4
- properties: created 0, updated 0
- services: created 0, updated 0
- amenities: created 0, updated 0
- property_amenities linked: 0
- anomalies_count: 0

## Acceptance Check
- ✅ Report generated (JSON + MD)
- ✅ No duplicate inserts for migrated entities on second run
- ✅ No duplicate property-amenity links on second run
- ⚠️ Strict idempotence (zero updates on second run) is not fully met due to `users_updated = 6`

## Interpretation
The ETL is idempotent for inserts and linking behavior, which is the primary safety objective for re-runs. However, 6 user rows still receive updates on re-run, indicating non-stable user field normalization or comparison logic.

## Recommended Follow-up
1. Log user-level field diffs for the 6 updated rows during a re-run.
2. Stabilize normalization/update logic so unchanged user records are not rewritten.
3. Re-run apply again and expect:
   - `users_created = 0`
   - `users_updated = 0`
   - all other `*_created = 0` and `property_amenities_linked = 0`

## Rollback / Recovery Notes
- Use `make local-db-backup` before apply in non-ephemeral environments.
- In local environments, reset with `make local-db-reset` then rerun:
  - `make local-migrate`
  - `make local-legacy-migrate-apply`
