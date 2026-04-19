# T06 — Contrainte DB anti‑overlap bookings

**Priorité**: P0 (T06)
**Estimation**: 2 jours
**Dépendances**: T03

## Objectif
Empêcher les réservations chevauchantes au niveau DB.

## Tâches
- Ajouter une exclusion constraint (Postgres) sur la plage de dates.
- Ajuster la migration Booking.

## Critères d’acceptation
- Une réservation overlapping échoue au niveau DB.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
