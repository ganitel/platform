# FE-UI-008 — Page Notifications

## Priorité
P1

## Délai estimé
1d

## Dépendances
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)

## Objectif
Créer la page Notifications conforme à la maquette, avec états de liste et gestion de lecture non-lue/lue.

## Tâches
- Implémenter la page notifications (liste, timestamp, statut lu/non lu).
- Ajouter les états visuels des items (non lus prioritaires).
- Prévoir l’action de marquage en lu côté UI (si API déjà disponible, connecter).
- Gérer états empty/loading/error.

## Critères d’acceptation
- Page notifications accessible et conforme au Figma.
- Distinction visuelle lu/non lu claire.
- Empty state présent quand aucune notification.
- Erreurs de chargement affichées proprement.

## Références
- Figma: https://www.figma.com/design/C3uNmKF2Vr9XgrryVUKc8X/Feature-Updates---Dev?node-id=108-11873&t=6tJbulb3P20lfPBA-0
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)