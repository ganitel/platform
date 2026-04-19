# FE-API-002 — Créer services API (properties, bookings, negotiations, payments, auth)

## Priorité
P0

## Délai estimé
2d

## Dépendances
- [FE-API-001 — Créer types base (Property, Booking, Negotiation, Payment, User)](docs/00_mvp/tickets/FE-API-001.md)

## Objectif
Mettre en place les services HTTP pour interagir avec l’API Ganitel v1, avec une gestion centralisée des erreurs et des tokens.

## Tâches
- Implémenter les services `properties`, `bookings`, `negotiations`, `payments`.
- Créer le service `auth` (login, signup, logout, refresh).
- Configurer axios avec base URL et intercepteurs.
- Centraliser la gestion des erreurs (400/401/404/500).

## Critères d’acceptation
- Tous les endpoints principaux sont implémentés.
- Erreurs API gérées de manière centralisée.
- Retry logic pour erreurs réseau.
- Tests unitaires des services.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
