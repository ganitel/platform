# FE-UI-004 — Page Inscription/Connexion (SignUp)

## Priorité
P0

## Délai estimé
1.5d

## Dépendances
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)

## Objectif
Fournir les écrans d’inscription et de connexion avec validation et gestion des erreurs.

## Tâches
- Implémenter formulaires signup/login.
- Ajouter validation Zod des champs.
- Gérer les erreurs serveur et afficher des messages.
- Mettre en place la redirection post-connexion.

## Critères d’acceptation
- API /auth/signup et /auth/login intégrées.
- Validation côté client avec messages clairs.
- Stockage sécurisé du token.
- Redirection intelligente après login.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
