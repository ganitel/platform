# Ganited Frontend
Application mobile-first de reservation d'hotel
# Architecture & Stratégie de Développement
Ce document détaille l'organisation du code et la vision technique pour assurer la maintenabilité et la scalabilité de l'application Ganitel

## 1. Clean Architecture (Adaptée Frontend)
L'architecture vise à isoler la logique métier des détails d'implémentation (UI et API)
### 1.1. Structure du projet

src/
├── app/                  # (Routing) Pages, Layouts et Server Components
├── components/           # (Présentation)
│   ├── ui/               # Composants atomiques (shadcn/ui)
│   ├── shared/           # Composants globaux (Navbar, Footer)
│   └── rooms/            # Composants spécifiques au domaine "Chambres"
├── services/             # (Infrastructure) Appels API, Axios instances
├── hooks/                # (Application) Logique de gestion d'état et orchestration
├── types/                # (Domaine) Interfaces TypeScript et schémas Zod
├── lib/                  # Utilitaires (utils.ts, lib/api-client.ts)
└── store/                # (Etat Global) Si nécessaire (Zustand)

### 1.2. Règles de l'architecture
#### Dépendances et fluxFlux unidirectionnel : 
Les données circulent de l'Infrastructure vers la Présentation
#### Interdiction : 
Un composant UI ne doit jamais appeler directement l'API (Axios). Il doit passer par un service ou un hook.
#### Isolation : 
Les composants de la couche ui/ ne doivent avoir aucune connaissance de la logique métier.Responsabilités par CoucheCoucheResponsabilitéContenuPrésentationAffichage et interaction utilisateur.React Components, Tailwind, Lucide Icons.ApplicationGestion des états, validation des formulaires.Custom Hooks (useBooking), Contexts.InfrastructureCommunication avec le monde extérieur.Axios, localStorage, Fetch.DomaineDéfinition des règles et contrats de données.Types TS, Schémas de validation (Zod)
### 1.3. Conventions UI avec shadcn/ui
#### Pour garantir une fidélité aux maquettes Figma tout en restant productif :
#### Installation : Tous les composants de base sont installés dans components/ui/ via la CLI.
#### Personnalisation : On ne modifie pas les fichiers node_modules. On surcharge directement les fichiers dans components/ui/ pour correspondre au design system (couleurs primary, secondary, radius).
#### Composition : Privilégier la composition de composants (ex: un Dialog contenant un BookingForm) plutôt que de créer des composants monolithiques.
#### Accessibilité : Utiliser systématiquement les primitives Radix UI fournies par shadcn pour garantir la conformité WCAG.