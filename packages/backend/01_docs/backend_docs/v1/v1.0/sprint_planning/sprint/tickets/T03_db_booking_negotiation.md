# T03 — Schéma DB: Booking NEGOTIATING + negotiated_price

**Priorité**: P0 (T03)
**Estimation**: 2 jours
**Dépendances**: T01

## Objectif
Aligner `Booking` avec la négociation (statut + prix négocié).

## Portée
- Ajouter `NEGOTIATING` à `BookingStatus`.
- Ajouter `negotiated_price` (Numeric).

## Tâches
- Mise à jour entité Booking.
- Migration Alembic.
- Ajuster validations associées.

## Critères d’acceptation
- Migrations appliquées.
- `Booking` accepte `NEGOTIATING` + `negotiated_price`.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
