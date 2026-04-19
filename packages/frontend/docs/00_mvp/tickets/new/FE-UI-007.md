# FE-UI-007 — Page Wishlist + comportements utilisateur

## Priorité
P0

## Délai estimé
1.5d

## Dépendances
- [FE-WISH-001 — Contexte Wishlist (WishlistContext)](docs/00_mvp/tickets/FE-WISH-001.md)
- [FE-WISH-002 — Page Ma Wishlist (MyWishlist)](docs/00_mvp/tickets/FE-WISH-002.md)
- [FE-CMP-001 — PropertyCard](docs/00_mvp/tickets/FE-CMP-001.md)

## Objectif
Revoir l’UI de la wishlist selon Figma et valider les comportements clés (ajout, suppression, état vide, navigation).

## Tâches
- Mettre à jour le layout de la page wishlist (header, liste, actions) selon maquette.
- Afficher correctement les cartes propriétés sauvegardées.
- Gérer les interactions wishlist (remove/toggle) avec feedback visuel.
- Gérer les états empty/loading/error de manière explicite.

## Critères d’acceptation
- Wishlist conforme au Figma en mobile et desktop.
- Actions d’ajout/suppression visibles immédiatement côté UI.
- État vide clair avec CTA de retour vers la recherche/landing.
- Erreurs de chargement affichées avec message utilisateur.

## Références
- Figma: https://www.figma.com/design/C3uNmKF2Vr9XgrryVUKc8X/Feature-Updates---Dev?node-id=108-11873&t=6tJbulb3P20lfPBA-0
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)