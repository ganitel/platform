# FE-UI-009 — Barre de navigation principale (Home/Wishlist/Négociations/Notifications)

## Priorité
P0

## Délai estimé
1d

## Dépendances
- [FE-NAV-003 — BottomNav (mobile)](docs/00_mvp/tickets/FE-NAV-003.md)
- [FE-NEG-002 — Page Négociation](docs/00_mvp/tickets/FE-NEG-002.md)
- [FE-WISH-002 — Page Ma Wishlist (MyWishlist)](docs/00_mvp/tickets/FE-WISH-002.md)

## Objectif
Mettre à jour la barre de navigation pour exposer exactement les entrées Home, Wishlist, Négociations et Notifications.

## Tâches
- Mettre à jour les items de navigation et leurs icônes/labels selon Figma.
- Connecter chaque item à sa route cible.
- Gérer l’état actif selon la route courante.
- Vérifier le comportement mobile (bottom nav) et desktop (si variante prévue).

## Critères d’acceptation
- Les 4 entrées sont visibles et fonctionnelles.
- L’état actif est cohérent pendant la navigation.
- La navigation reste persistante et ne masque pas le contenu critique.
- Responsive conforme à la maquette.

## Références
- Figma: https://www.figma.com/design/C3uNmKF2Vr9XgrryVUKc8X/Feature-Updates---Dev?node-id=108-11873&t=6tJbulb3P20lfPBA-0
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)