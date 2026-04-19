# BACKLOG GANITEL FRONTEND - MISE À JOUR 2026

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [État du projet](#état-du-projet)
3. [Backlog détaillé par EPIC](#backlog-détaillé-par-epic)
4. [Status des User Stories](#status-des-user-stories)
5. [Roadmap Sprint](#roadmap-sprint)

---

## 🎯 Vue d'ensemble

### Changements par rapport au backlog initial
- ✅ **Framework**: React 18 + Vite (au lieu de Next.js)
- ✅ **Routing**: React Router v6 SPA mode (au lieu de Next.js App Router)
- ✅ **Backend**: Express intégré + Netlify Functions (au lieu de déploiement Vercel uniquement)
- ✅ **UI**: Radix UI + shadcn/ui + Tailwind CSS (conforme)
- ✅ **État**: Context API + localStorage (au lieu de Zustand)
- ✅ **Architecture**: Clean Architecture adaptée à React (au lieu de Next.js structure)

### Objectifs du projet
- Application mobile-first de réservation de chambres/propriétés
- Navigation fluide inspirée d'apps mobiles modernes
- Gestion complète du parcours utilisateur (recherche → réservation → confirmation)
- Système de wishlist intégré
- Flow de négociation pour alternative de réservation

### Tech Stack actuel
- **Frontend**: React 18 + TypeScript + Vite
- **Router**: React Router v6 (SPA)
- **Styling**: Tailwind CSS 3 + shadcn/ui components
- **State**: Context API + React Hooks + localStorage
- **Backend**: Express (développement intégré)
- **Testing**: Vitest
- **Icons**: Lucide React
- **Deployment**: Netlify (production-ready avec Netlify Functions)

---

## 📊 État du projet

### Sprints complétés
- ✅ **Sprint 1 (21-27 Jan)**: EPIC 1 complet + EPIC 2 pages statiques
- ✅ **Sprint 2 (28 Jan - 3 Fév)**: EPIC 2 finalisé + UI conforme Figma
- 🔄 **Sprint 3 (4-10 Fév)**: EPIC 3 liaison API (EN COURS)
- ⏳ **Sprint 4 (11-17 Fév)**: EPIC 4 Auth avancée + EPIC 5 UX
- ⏳ **Sprint 5 (18-22 Fév)**: EPIC 6 Tests + EPIC 7 Déploiement

### Taux de complétude du projet
**Implémentation: ~65%**
- EPIC 1: 100% ✅
- EPIC 2: 95% ✅ (pages manquantes: search/filter avancé)
- EPIC 3: 40% 🔄 (services API à intégrer)
- EPIC 4: 70% 🟡 (Auth basique créée, session à persister)
- EPIC 5: 30% 🟡 (Loaders + erreurs partiels)
- EPIC 6: 0% ⏳
- EPIC 7: 0% ⏳

---

## 📦 BACKLOG DÉTAILLÉ PAR EPIC

### EPIC 1 — Initialisation & Fondations Frontend
**Status**: ✅ **COMPLÉTÉ**

#### US-1.1 — Initialiser le projet Vite + React
- ✅ Projet Vite configuré avec React + TypeScript
- ✅ ESLint + Prettier en place
- ✅ Git + .gitignore configurés
- ✅ Dev server fonctionnel sur port 8080
- ✅ Build production testée

#### US-1.2 — Mettre en place l'architecture du projet
- ✅ Structure dossiers créée:
  - `client/pages/` - Composants pages (routes)
  - `client/components/` - Composants réutilisables
  - `client/components/ui/` - Composants de base (shadcn/ui)
  - `client/contexts/` - Context API providers
  - `client/hooks/` - Custom hooks
  - `client/lib/` - Utilitaires
  - `server/` - Express backend
  - `shared/` - Types partagés client/server
- ✅ Conventions de nommage établies
- ✅ Path aliases configurés (`@/*`)

#### US-1.3 — Configurer l'environnement
- ✅ `.env` fichier créé
- ✅ Configuration Express server
- ✅ Vite config client + server
- ✅ TypeScript strict mode activé

#### US-1.4 — Intégrer la base UI depuis Figma
- ✅ Tailwind CSS 3 intégré
- ✅ Design system Ganitel configuré:
  - `ganitel-primary`: #18100C (noir)
  - `ganitel-secondary`: #D39E70 (bronze)
  - Couleurs secondaires définies
- ✅ Polices personnalisées (si Figma fourni)
- ✅ Mobile-first responsive testé
- ✅ 30+ composants shadcn/ui installés

---

### EPIC 2 — Intégration UI (sans backend)
**Status**: ✅ **95% COMPLÉTÉ** 🟢

#### US-2.1 — Page d'accueil (`/`)
- ✅ Route créée + layout mobile-first
- ✅ Header + BottomNav implémentés
- ✅ Hero section avec CTA
- ✅ Collections preview section
- ✅ Responsive design testé
- **Détails**:
  - Affiche collections populaires
  - Lien vers `/all-wishlists`
  - Navigation fluide vers PropertyDetails

#### US-2.2 — Page liste des propriétés
- ✅ Composant `PropertyCard` créé
- ✅ Grille responsive pour mobile/desktop
- ⏳ **À faire**: Filtres API complètement fonctionnels (recherche par dates/localisation)
- ⏳ **À faire**: Pagination/infinite scroll
- **Détails**:
  - PropertyCard affiche: image, titre, localisation, prix, avis
  - Layout mobile-first: 1 colonne → 3+ colonnes desktop

#### US-2.3 — Page détail propriété (`/property/:id`)
- ✅ Route dynamique créée
- ✅ `PropertyImageGallery` avec carrousel images
- ✅ Sections détail:
  - `PropertyInfo` (titre, localisation, avis)
  - `PropertyDescription` (règles, commodités, accessibilité)
  - `HostInfo` (info hôte)
  - `ReviewsSection` (avis utilisateurs)
  - `SimilarProperties` (suggestions)
- ✅ Bouton "Book/Negotiate" fonctionnel
- ⏳ **À faire**: Intégration API pour data dynamique (actuellement hardcodée)

#### US-2.4 — Page réservation
- ✅ Route `/booking/method` créée
- ✅ Écran choix: "Book instantly" vs "Negotiate"
- ✅ Route `/booking/confirm` (TravelerInformation) - formulaire client
- ✅ Route `/booking/payment` - sélection méthode paiement
- ✅ Route `/booking/review` - résumé final
- ⏳ **À faire**: Validation formulaire avancée (Zod schemas)
- ⏳ **À faire**: États d'erreur et messages métier

#### US-2.5 — Page confirmation (`/booking/payment-success`)
- ✅ Route créée
- ✅ Message de succès avec checkmark
- ✅ Détails réservation affichés
- ✅ CTA retour accueil
- ✅ Countdown timer 5 secondes

#### US-2.6 — Composants réutilisables
- ✅ **30+ composants UI**:
  - Boutons (primary/secondary/ghost)
  - Inputs (text, email, tel, date, time, select)
  - Cards, Dialogs, Modales
  - Loaders, Skeletons
  - Badges, Avatars
  - Accordions, Tabs, Dropdowns
  - Et bien d'autres...
- ✅ Tous importés depuis shadcn/ui
- ✅ Personnalisés pour design Ganitel

#### US-2.7 — Navigation & UX (Ajouté)
- ✅ `BottomNav` - navigation persistante (Home/Wishlist)
- ✅ `Header` - header global
- ✅ `Footer` - footer global
- ✅ Route 404 NotFound
- ✅ Back button navigation sur routes booking

---

### EPIC 3 — Liaison Frontend ↔ Backend
**Status**: 🟡 **40% COMPLÉTÉ** (Services créés, API calls à intégrer)

#### US-3.1 — Configurer le client HTTP
- ⏳ **À faire**: Instance Fetch/Axios centralisée
  - Configuration base URL API
  - Headers par défaut
  - Interceptors (auth, erreurs)
- ⏳ **À faire**: Gestion des erreurs réseaux

#### US-3.2 — Centraliser les services API
- ⏳ **À faire**: `services/property.service.ts`
  - `getProperties(filters)` - liste avec filtres
  - `getPropertyById(id)` - détail propriété
  - `searchProperties(query)`
- ⏳ **À faire**: `services/booking.service.ts`
  - `createBooking(data)`
  - `getMyBookings()`
  - `cancelBooking(id)`
  - `submitNegotiation(data)`
- ⏳ **À faire**: `services/auth.service.ts`
  - `signup(email|phone, password|otp)`
  - `login(email|phone, password|otp)`
  - `logout()`
  - `refreshToken()`
- ⏳ **À faire**: Typage des réponses API avec Zod schemas

#### US-3.3 — Récupérer les propriétés depuis l'API
- ⏳ Appel API `GET /api/properties`
- ⏳ Mapping données → PropertyCard
- ⏳ États loading/error UI
- ⏳ Cache/invalidation (React Query optionnel)
- **Impact**:
  - Index.tsx affichera vraies propriétés
  - PropertyCard sera dynamique
  - Filtres seront fonctionnels

#### US-3.4 — Détail propriété dynamique
- ⏳ Appel API `GET /api/properties/:id`
- ⏳ Hydratation correcte composants détail
- ⏳ Gestion 404 si propriété inexistante
- ⏳ SEO basique (metadata)

#### US-3.5 — Réserver une propriété
- ⏳ Appel API `POST /api/bookings`
- ⏳ Validation métier backend
- ⏳ Gestion erreurs métier (propriété indisponible, etc)
- ⏳ Toast notifications (succès/erreur)
- ⏳ Redirection `/booking/payment-success`

#### US-3.6 — Soumettre une négociation (Nouveau)
- ⏳ Appel API `POST /api/negotiations`
- ⏳ Envoi offer + whatsapp
- ⏳ Page de confirmation avec 5s countdown

---

### EPIC 4 — Authentification & Sessions
**Status**: 🟡 **70% COMPLÉTÉ** (Sign Up créé, persistence à ajouter)

#### US-4.1 — Inscription (`/sign-up`)
- ✅ Page d'inscription créée
- ✅ 2 options: **Email** ou **Phone**
- ✅ Écrans:
  - Method selection (Email/Phone)
  - Email/Phone input
  - OTP verification (4 digits)
  - Success confirmation
- ✅ Transition fluide entre écrans
- ✅ Back button navigation
- ⏳ **À faire**: Intégration API `POST /api/auth/signup`
- ⏳ **À faire**: Validation email/phone format (Zod)
- ⏳ **À faire**: Gestion erreurs métier (email déjà utilisé, etc)

#### US-4.2 — Connexion
- ⏳ **À faire**: Page `/login` avec écrans similaires à signup
  - Email/Phone + Password
  - OU Email + OTP
  - Récupération mot de passe
- ⏳ **À faire**: Appel API `POST /api/auth/login`
- ⏳ **À faire**: Stockage token (cookie secure / localStorage)

#### US-4.3 — Persistance de session
- ⏳ **À faire**: Context provider pour user/auth state
  - `useAuth()` hook
  - Persistence localStorage/cookie
  - Auto-login on app reload
- ⏳ **À faire**: Route protection (redirect non-auth)
- ⏳ **À faire**: Refresh token logic (si backend supporte)

#### US-4.4 — Mes réservations (`/my-bookings`)
- ⏳ **À faire**: Route créée
- ⏳ **À faire**: Appel API `GET /api/bookings/me`
- ⏳ **À faire**: Listing réservations avec statuts (confirmed, pending, cancelled)
- ⏳ **À faire**: Détail réservation modal
- ⏳ **À faire**: Options: modifier, annuler, contacter support

#### US-4.5 — Wishlist persistée (Nouveau)
- ✅ `WishlistContext` + localStorage
- ✅ Pages `/my-wishlist` et `/all-wishlists`
- ✅ Ajout/suppression items
- ⏳ **À faire**: Sync avec API `POST /api/wishlist`
- ⏳ **À faire**: Persistance côté serveur (user account)

---

### EPIC 5 — UX, États & Performance
**Status**: 🟡 **30% COMPLÉTÉ** (Base en place, à polir)

#### US-5.1 — Loaders & États vides
- ✅ Skeleton components disponibles
- ⏳ **À faire**: Implémenter partout:
  - PropertyCard loading
  - PropertyDetails skeleton
  - BookingForm validation UI
- ⏳ **À faire**: Empty states messages clairs

#### US-5.2 — Gestion des erreurs
- ✅ Sonner toast notifications intégrées
- ⏳ **À faire**: Toast pour chaque action:
  - Succès réservation/négociation
  - Erreur API
  - Validation formulaire
- ⏳ **À faire**: Pages d'erreur personnalisées (404, 500)
- ⏳ **À faire**: Retry buttons sur erreurs réseau

#### US-5.3 — Feedback utilisateur
- ✅ Boutons désactivés pendant loading
- ✅ États succès/échec basiques
- ⏳ **À faire**: Confirmation dialogs avant actions destructives (annuler réservation)
- ⏳ **À faire**: Animés transitions entre étapes
- ⏳ **À faire**: Indicateurs de progression (X/3 steps)

#### US-5.4 — Performance
- ✅ Vite build optimisé
- ✅ Mobile-first responsive
- ⏳ **À faire**: Image optimization (Next.js Image ou sharp)
- ⏳ **À faire**: Code splitting par route
- ⏳ **À faire**: Lazy loading composants lourds
- ⏳ **À faire**: Cache API responses

#### US-5.5 — Accessibilité
- ✅ Radix UI pour primitives accessibles
- ✅ Semantic HTML
- ⏳ **À faire**: ARIA labels sur inputs
- ⏳ **À faire**: Keyboard navigation
- ⏳ **À faire**: Focus management

---

### EPIC 6 — Tests & Stabilisation
**Status**: ⏳ **0% - À DÉMARRER**

#### US-6.1 — Tests unitaires
- ⏳ **À faire**: Tests Vitest pour:
  - Hooks personnalisés (useWishlist, useAuth, etc)
  - Services API
  - Utilitaires (formatters, validators)
- ⏳ **À faire**: Couverture minimale: 70%

#### US-6.2 — Tests d'intégration
- ⏳ **À faire**: Testing Library pour:
  - Flux réservation complet
  - Flux authentification
  - Navigation routes
- ⏳ **À faire**: Mocking API responses

#### US-6.3 — Tests manuels
- ⏳ **À faire**: Checklist réservation end-to-end
- ⏳ **À faire**: Checklist authentification
- ⏳ **À faire**: Testing mobile (devices réels / emulateur)
- ⏳ **À faire**: Testing cross-browser (Chrome, Safari, Firefox)

#### US-6.4 — Vérifications qualité
- ⏳ **À faire**: TypeScript strict: zero errors
- ⏳ **À faire**: ESLint: zero warnings
- ⏳ **À faire**: Lighthouse score > 80
- ⏳ **À faire**: Accessibilité audit (axe)

---

### EPIC 7 — Déploiement & Production
**Status**: ⏳ **0% - À DÉMARRER**

#### US-7.1 — Préparation production
- ⏳ **À faire**: Vérifier variables d'environnement
  - API_URL prod
  - Auth tokens
  - Tracking (Sentry, etc)
- ⏳ **À faire**: Optimiser Vite bundle
- ⏳ **À faire**: Tester build production localement

#### US-7.2 — Déploiement Netlify
- ⏳ **À faire**: Configurer Netlify déploiement
  - Build command: `pnpm build`
  - Publish directory: `dist/spa`
- ⏳ **À faire**: Netlify Functions pour backend `/api`
- ⏳ **À faire**: Redirects `_redirects` pour SPA routing
- ⏳ **À faire**: Environment variables Netlify

#### US-7.3 — Post-déploiement
- ⏳ **À faire**: Tests smoke production
- ⏳ **À faire**: Monitoring erreurs (Sentry)
- ⏳ **À faire**: Analytics setup
- ⏳ **À faire**: Documentation pour team

---

## 📋 STATUS DES USER STORIES

### Par EPIC

| EPIC | Total US | Complétées ✅ | En Cours 🔄 | À Faire ⏳ | %Complete |
|------|----------|---------------|-----------|----------|-----------|
| EPIC 1 | 4 | 4 | 0 | 0 | 100% |
| EPIC 2 | 7 | 6 | 1 | 0 | 95% |
| EPIC 3 | 6 | 0 | 0 | 6 | 0% |
| EPIC 4 | 5 | 1 | 0 | 4 | 20% |
| EPIC 5 | 5 | 1 | 0 | 4 | 20% |
| EPIC 6 | 4 | 0 | 0 | 4 | 0% |
| EPIC 7 | 3 | 0 | 0 | 3 | 0% |
| **TOTAL** | **34** | **12** | **1** | **21** | **35%** |

### Détail par User Story

#### US Complétées ✅
- ✅ US-1.1: Initialiser Vite + React
- ✅ US-1.2: Architecture dossiers
- ✅ US-1.3: Configuration env
- ✅ US-1.4: Tailwind + design system
- ✅ US-2.1: Home page
- ✅ US-2.2: PropertyCard (UI complète)
- ✅ US-2.3: PropertyDetails page
- ✅ US-2.4: Booking flow (routes)
- ✅ US-2.5: Confirmation page
- ✅ US-2.6: Composants UI
- ✅ US-4.1: Sign Up page (UI)

#### US En Cours 🔄
- 🔄 US-2.2: Filtres/recherche (UI créée, API à brancher)

#### US À Faire ⏳
- ⏳ US-3.*: Tout l'EPIC 3 (services API)
- ⏳ US-4.2-4.5: Auth persistance + booking list
- ⏳ US-5.*: Loaders/erreurs/perf
- ⏳ US-6.*: Tests
- ⏳ US-7.*: Déploiement

---

## 🎯 Priorités Immédiate (Prochaines 2 semaines)

### Semaine 1 (Sprint 3 - actuel)
**Objectif**: Brancher l'API backend

1. **Créer les services API** (3-4h)
   - `services/property.service.ts`
   - `services/booking.service.ts`
   - `services/auth.service.ts`
   - Typage Zod schemas

2. **Intégrer property listing** (2-3h)
   - Index.tsx appelle API
   - PropertyCard affiche vraies données
   - Loading states

3. **Intégrer property detail** (2h)
   - PropertyDetails page connectée API
   - Dynamic routing par ID

### Semaine 2 (fin Sprint 3 / début Sprint 4)
**Objectif**: Booking flow fonctionnel

1. **Booking API integration** (3h)
   - createBooking endpoint
   - Formulaire TravelerInformation validation
   - Payment flow connecté

2. **Négociation API** (2h)
   - POST /api/negotiations
   - Toast notifications

3. **Auth persistence** (3h)
   - Context provider useAuth
   - Token management
   - Session persistence

---

## 📁 Arborescence actuelle du projet

```
ganitel-frontend/
├── client/                         # React app
│   ├── pages/                      # Route components
│   │   ├── Index.tsx              # Home
│   │   ├── PropertyDetails.tsx     # /property/:id
│   │   ├── SignUp.tsx             # /sign-up
│   │   ├── BookOrNegotiate.tsx    # /booking/method
│   │   ├── Negotiation.tsx        # /booking/negotiate
│   │   ├── TravelerInformation.tsx # /booking/confirm
│   │   ├── ReviewInformation.tsx   # /booking/review
│   │   ├── PaymentMethod.tsx       # /booking/payment
│   │   ├── PaymentProgress.tsx     # /booking/payment-progress
│   │   ├── PaymentSuccess.tsx      # /booking/payment-success
│   │   ├── RequestSent.tsx         # /booking/request-sent
│   │   ├── MyWishlist.tsx          # /my-wishlist
│   │   ├── AllWishlists.tsx        # /all-wishlists
│   │   └── NotFound.tsx            # 404
│   ├── components/                 # Composants réutilisables
│   │   ├── ui/                     # shadcn/ui components (30+)
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── BottomNav.tsx
│   │   ├── PropertyCard.tsx
│   │   ├── PropertyImageGallery.tsx
│   │   ├── PropertyInfo.tsx
│   │   ├── PropertyDescription.tsx
│   │   ├── PropertyAmenities.tsx
│   │   ├── PropertyAccessibility.tsx
│   │   ├── HostInfo.tsx
│   │   ├── ReviewsSection.tsx
│   │   ├── SimilarProperties.tsx
│   │   ├── BookingFooter.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Neighborhood.tsx
│   │   ├── HouseRules.tsx
│   │   ├── ListingRules.tsx
│   │   ├── AmenitiesList.tsx
│   │   ├── AccompaniedServices.tsx
│   │   └── PromotionBanner.tsx
│   ├── contexts/
│   │   └── WishlistContext.tsx    # Wishlist state + localStorage
│   ├── hooks/
│   │   ├── use-mobile.tsx         # Mobile detection
│   │   └── use-toast.ts           # Toast notifications
│   ├── lib/
│   │   └── utils.ts               # Utility functions
│   ├── App.tsx                    # Routes config
│   ├── global.css                 # Tailwind + custom styles
│   └── vite-env.d.ts
├── server/                         # Express backend
│   ├── index.ts                   # Main server
│   ├── routes/
│   │   └── demo.ts                # Example routes
│   └── node-build.ts              # Build script
├── shared/                         # Types partagés
│   └── api.ts                      # API interfaces
├── public/                         # Assets statiques
├── netlify/
│   └── functions/                  # Netlify Functions
│       └── api.ts                  # API handler
├── App.tsx                         # React entry
├── tailwind.config.ts              # Tailwind config (design tokens)
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite config
├── package.json                    # Dependencies
└── README.md                       # Documentation

```

---

## 🔄 Prochaines Actions

### Immédiat (cette semaine)
1. **Créer `services/` folder** avec API client
2. **Intégrer property.service.ts**
3. **Brancher Index.tsx à l'API**
4. **Ajouter loading states**

### Court terme (2-3 semaines)
1. Compléter EPIC 3 (all services)
2. Auth API integration
3. Session persistence
4. Error handling globale

### Moyen terme (Sprint 4-5)
1. Tests (Vitest + Testing Library)
2. Performance optimization
3. Accessibilité audit
4. Production deployment

---

## 📞 Notes Techniques

### Contraintes actuelles
- API backend à intégrer (endpoints manquants côté services)
- Tests non couverts (Vitest setup prêt)
- Déploiement Netlify à finaliser
- Auth token persistence à mettre en place

### Décisions d'architecture
- **React Router SPA** au lieu de SSR (plus simple, suffisant pour app mobile)
- **Context API + localStorage** au lieu de Zustand (simplicity first)
- **Fetch API** (plutôt qu'Axios) pour réduire dépendances
- **Tailwind utilities** au lieu de CSS Modules (productivité Figma)

### Points d'amélioration future
- Migration Zustand si état global complexe
- Implementation React Query pour cache API
- Cypress pour E2E tests
- Sentry pour error tracking production
- Analytics (Mixpanel / Segment)

---

## 📚 Références

- **Maquettes Figma**: [À compléter]
- **API Backend Docs**: [À compléter]
- **AGENTS.md**: Architecture patterns du starter Fusion
- **README.md**: Documentation technique actuelle

---

**Dernière mise à jour**: 31 Janvier 2026
**Status global**: 35% implémentation (12/34 US complétées)
**Prochaine release**: Sprint 3 - API integration (4-10 Février)
