# FE-TST-002 — Tests E2E critiques

## Priorité
P1

## Délai estimé
2d

## Dépendances
- [FE-BOOK-006 — Page Succès Paiement (PaymentSuccess)](docs/00_mvp/tickets/FE-BOOK-006.md)
- [FE-WISH-002 — Page Ma Wishlist (MyWishlist)](docs/00_mvp/tickets/FE-WISH-002.md)
- [FE-NEG-001 — Page Négociation (Negotiation)](docs/00_mvp/tickets/FE-NEG-001.md)

## Objectif
Valider les parcours critiques via tests end-to-end.

## Tâches
- Mettre en place Playwright/Cypress.
- Parcours: Recherche → Détails → Réservation → Paiement.
- Parcours: Wishlist add/remove.
- Parcours: Négociation.

## Critères d’acceptation
- 3 parcours principaux couverts.
- Tests passent en CI/CD.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
