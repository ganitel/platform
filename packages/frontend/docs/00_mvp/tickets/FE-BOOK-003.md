# FE-BOOK-003 — Page Révision Informations (ReviewInformation)

## Priorité
P0

## Délai estimé
1.5d

## Dépendances
- [FE-BOOK-002 — Page Informations Voyageur (TravelerInformation)](docs/00_mvp/tickets/FE-BOOK-002.md)
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)

## Objectif
Afficher le récapitulatif de réservation avant paiement, avec possibilité de modifier.

## Tâches
- Afficher résumé (dates, voyageurs, prix total).
- Permettre retour vers les étapes précédentes.
- Calculer le prix total (nuits × prix + frais).
- Bouton « Continuer vers le paiement ».

## Critères d’acceptation
- Toutes les informations affichées correctement.
- Navigation retour vers étapes précédentes.
- Calcul du prix total correct.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
