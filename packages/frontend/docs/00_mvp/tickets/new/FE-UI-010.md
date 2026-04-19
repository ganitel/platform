# FE-UI-010 — Corrections UI propriétés Landing + erreurs de chargement

## Priorité
P0

## Délai estimé
1.5d

## Dépendances
- [FE-UI-001 — Page Accueil (Index)](docs/00_mvp/tickets/FE-UI-001.md)
- [FE-CMP-001 — PropertyCard](docs/00_mvp/tickets/FE-CMP-001.md)
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)

## Objectif
Corriger l’UI des propriétés sur la landing page et fiabiliser l’affichage des erreurs de chargement selon le design attendu.

## Tâches
- Ajuster l’affichage des cartes propriétés (espacements, contenu, hiérarchie visuelle, overflow texte).
- Uniformiser les états skeleton/loading des sections propriétés.
- Corriger les états erreur (message, action de retry, cohérence visuelle).
- Vérifier le comportement en cas de réponse vide ou partielle.

## Critères d’acceptation
- UI des propriétés landing alignée avec la maquette Figma.
- États loading/error/empty non cassants et compréhensibles.
- Retry disponible sur erreurs réseau/API.
- Aucune régression responsive mobile/tablet/desktop.

## Références
- Figma: https://www.figma.com/design/C3uNmKF2Vr9XgrryVUKc8X/Feature-Updates---Dev?node-id=108-11873&t=6tJbulb3P20lfPBA-0
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)