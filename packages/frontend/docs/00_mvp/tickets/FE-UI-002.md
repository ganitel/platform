# FE-UI-002 — Page Recherche & Résultats

## Priorité
P0

## Délai estimé
2.5d

## Dépendances
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)
- [FE-CMP-003 — SearchBar](docs/00_mvp/tickets/FE-CMP-003.md)
- [FE-CMP-001 — PropertyCard](docs/00_mvp/tickets/FE-CMP-001.md)

## Objectif
Fournir une page de recherche avec filtres avancés, tri et pagination.

## Tâches
- Construire la grille de résultats avec pagination.
- Ajouter filtres (dates, voyageurs, prix, équipements).
- Ajouter tri (popularité, prix, note).
- Synchroniser l’URL avec les paramètres de recherche.

## Critères d’acceptation
- API /properties/search avec paramètres de filtrage.
- Pagination fonctionnelle.
- Filtres appliqués dynamiquement.
- URL sync avec paramètres de recherche.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
