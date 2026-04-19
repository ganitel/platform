# FE-WISH-001 — Contexte Wishlist (WishlistContext)

## Priorité
P1

## Délai estimé
1d

## Dépendances
- [FE-API-002 — Créer services API (properties, bookings, negotiations, payments, auth)](docs/00_mvp/tickets/FE-API-002.md)

## Objectif
Mettre en place un contexte global pour gérer les favoris (wishlist).

## Tâches
- Implémenter le contexte React (add/remove/toggle).
- Ajouter persistance en localStorage.
- Synchroniser avec le backend si connecté.
- Gérer l’état optimiste.

## Critères d’acceptation
- Context accessible dans toute l’app.
- Sync avec API /users/wishlist.
- Persistance locale même déconnecté.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
