# FE-UI-003 — Page Détails Propriété (PropertyDetails)

## Priorité
P0

## Délai estimé
3d

## Dépendances
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)
- [FE-CMP-002 — PropertyImageGallery](docs/00_mvp/tickets/FE-CMP-002.md)
- [FE-CMP-004 — ReviewsSection](docs/00_mvp/tickets/FE-CMP-004.md)
- [FE-CMP-005 — BookingFooter](docs/00_mvp/tickets/FE-CMP-005.md)

## Objectif
Afficher les détails complets d’une propriété avec tous les composants nécessaires pour la réservation ou négociation.

## Tâches
- Intégrer galerie d’images avec lightbox.
- Afficher informations principales (titre, localisation, hôte, prix).
- Ajouter description, équipements, règles et accessibilité.
- Intégrer avis et voisinage avec carte.
- Ajouter CTA « Réserver » et « Négocier ».

## Critères d’acceptation
- API /properties/{id} pour détails complets.
- Tous les sous-composants intégrés.
- Wishlist toggle fonctionnel.
- Redirection vers réservation ou négociation.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
