# FE-BOOK-004 — Page Méthode de Paiement (PaymentMethod)

## Priorité
P0

## Délai estimé
2d

## Dépendances
- [FE-BOOK-003 — Page Révision Informations (ReviewInformation)](docs/00_mvp/tickets/FE-BOOK-003.md)
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)

## Objectif
Permettre la sélection et l’exécution d’un paiement sécurisé.

## Tâches
- Afficher les méthodes de paiement disponibles.
- Intégrer le provider (Stripe/PayPal/Mobile Money).
- Valider les informations de paiement.
- Créer la réservation côté backend.

## Critères d’acceptation
- API /bookings avec création de transaction.
- Intégration provider de paiement sécurisée.
- Gestion des erreurs de paiement.

## Références
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
