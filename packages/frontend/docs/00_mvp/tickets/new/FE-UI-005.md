# FE-UI-005 — UI Inscription & Connexion (Figma update)

## Priorité
P0

## Délai estimé
1.5d

## Dépendances
- [FE-UI-004 — Page Inscription/Connexion (SignUp)](docs/00_mvp/tickets/FE-UI-004.md)
- [FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)](docs/00_mvp/tickets/FE-API-003.md)

## Objectif
Aligner l’UI des pages d’inscription et de connexion avec la maquette Figma Feature Updates, en conservant les flows d’auth existants.

## Tâches
- Revoir la structure visuelle des pages `SignUp` / `Login` (espacements, hiérarchie, CTA primaire/secondaire).
- Harmoniser les champs formulaire, labels, placeholders et états (focus, erreur, disabled).
- Intégrer les messages d’erreur et d’aide dans le layout défini par la maquette.
- Vérifier l’expérience mobile-first et desktop.

## Critères d’acceptation
- UI conforme au Figma sur mobile et desktop.
- Les formulaires restent fonctionnels (inscription/connexion).
- États loading, erreur API et validation visibles sans rupture de layout.
- Navigation entre inscription et connexion claire et accessible.

## Références
- Figma: https://www.figma.com/design/C3uNmKF2Vr9XgrryVUKc8X/Feature-Updates---Dev?node-id=108-11873&t=6tJbulb3P20lfPBA-0
- Backlog: [docs/00_mvp/BACKLOG.md](docs/00_mvp/BACKLOG.md)
- Contrats: [docs/00_mvp/CONTRACTS_AND_INTERFACES.md](docs/00_mvp/CONTRACTS_AND_INTERFACES.md)
