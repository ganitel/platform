# FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)

## Priorité
P0

## Délai estimé
1.5d

## Dépendances
- [FE-API-002 — Créer services API (properties, bookings, negotiations, payments, auth)](docs/00_mvp/tickets/FE-API-002.md)

## Objectif
Créer des hooks React Query standardisés pour l’accès aux données et la gestion du cache.

## Tâches
- Implémenter hooks pour propriétés (search, details, filters).
- Implémenter hooks pour réservations (create, get, cancel).
- Implémenter hooks pour négociations (create, get, status).
- Implémenter hooks d’authentification et user state.
- Définir staleTime/cacheTime par feature.

## Critères d’acceptation
- Hooks fonctionnels avec cache React Query.
- Configuration optimale du staleTime/cacheTime.
- Invalidation de cache appropriée.
- Loading et error states gérés.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
