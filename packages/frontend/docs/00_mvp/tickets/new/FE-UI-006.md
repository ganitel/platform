# FE-UI-006 — Page Profil + accès via icône Header

## Priorité
P0

## Délai estimé
1.5d

## Dépendances
- [FE-NAV-001 — Header](docs/00_mvp/tickets/FE-NAV-001.md)
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)

## Objectif
Implémenter la page Profil selon Figma et définir le comportement d’accès depuis l’icône en haut à droite du header.

## Tâches
- Connecter l’icône profil du header à la route profil.
- Si utilisateur authentifié: afficher la page profil (sections infos utilisateur + actions prévues par la maquette).
- Si utilisateur non authentifié: afficher les options d’inscription et de connexion (entry points explicites).
- Gérer les états loading et erreur du profil sans blocage de navigation.

## Critères d’acceptation
- Clic sur l’icône top-right ouvre le bon écran.
- Utilisateur non connecté voit clairement « S’inscrire » et « Se connecter ».
- Utilisateur connecté voit ses informations de profil.
- Responsive mobile/tablet/desktop conforme au Figma.

## Références
- Figma: https://www.figma.com/design/C3uNmKF2Vr9XgrryVUKc8X/Feature-Updates---Dev?node-id=108-11873&t=6tJbulb3P20lfPBA-0
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)