# FE-NEG-001 — Page Négociation (Negotiation)

## Priorité
P1

## Délai estimé
2d

## Dépendances
- [FE-BOOK-001 — Page "Réserver ou Négocier" (BookOrNegotiate)](docs/00_mvp/tickets/FE-BOOK-001.md)
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)

## Objectif
Permettre à l’utilisateur d’envoyer une demande de négociation.

## Tâches
- Construire formulaire (dates, budget, message).
- Valider les champs (Zod).
- Soumettre la demande à l’API.
- Gérer les erreurs (indisponible, budget irréaliste).

## Critères d’acceptation
- API /negotiations/requests intégrée.
- Validation des données.
- Gestion des erreurs claire.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
