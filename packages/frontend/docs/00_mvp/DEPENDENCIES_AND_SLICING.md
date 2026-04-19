# Dépendances & Slicing Prioritaire — Ganitel Frontend MVP (API v1)

## 1) Dépendances techniques (codebase actuelle)

### Architecture existante
```
client/
├── App.tsx                 # React Router (SPA mode)
├── global.css              # TailwindCSS + theming
├── components/             # Composants UI
│   ├── ui/                 # Radix UI components (shadcn/ui)
│   └── [business components]
├── contexts/               # React contexts
│   └── WishlistContext.tsx
├── hooks/                  # Custom hooks
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── pages/                  # Route components
│   ├── Index.tsx
│   ├── PropertyDetails.tsx
│   ├── BookOrNegotiate.tsx
│   ├── TravelerInformation.tsx
│   ├── ReviewInformation.tsx
│   ├── PaymentMethod.tsx
│   ├── PaymentProgress.tsx
│   ├── PaymentSuccess.tsx
│   ├── Negotiation.tsx
│   ├── RequestSent.tsx
│   ├── MyWishlist.tsx
│   ├── AllWishlists.tsx
│   └── SignUp.tsx
└── lib/                    # Utilities
    └── utils.ts

server/
├── index.ts                # Express server
└── routes/
    └── demo.ts

shared/
└── api.ts                  # Types partagés client/server
```

### Stack technique actuel
- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router 6 (SPA mode)
- **Styling**: TailwindCSS 3 + Radix UI
- **Icons**: Lucide React
- **Build**: Vite + pnpm
- **Backend**: Express (intégré Vite dev)

### Dépendances à ajouter
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",      // État serveur & cache
    "axios": "^1.x",                       // HTTP client
    "zod": "^3.x",                         // Validation schemas
    "react-hook-form": "^7.x",             // Gestion formulaires
    "@hookform/resolvers": "^3.x",         // Zod resolver pour RHF
    "date-fns": "^3.x",                    // Manipulation dates
    "react-day-picker": "^8.x",            // Date picker
    "leaflet": "^1.x",                     // Cartes (alternative à Google Maps)
    "react-leaflet": "^4.x",
    "@stripe/stripe-js": "^2.x",           // Stripe (si utilisé)
    "@stripe/react-stripe-js": "^2.x",
    "embla-carousel-react": "^8.x",        // Carousel (déjà présent via shadcn?)
    "sonner": "^1.x",                      // Notifications toast (déjà présent)
    "vaul": "^0.x"                         // Drawer mobile (déjà présent)
  },
  "devDependencies": {
    "vitest": "^1.x",                      // Tests unitaires
    "@testing-library/react": "^14.x",     // Testing utilities
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/user-event": "^14.x"
  }
}
```

---

## 2) État actuel vs MVP cible

### ✅ Déjà présent (à adapter)
- **Pages** : PropertyDetails, BookOrNegotiate, TravelerInformation, ReviewInformation, PaymentMethod, PaymentProgress, PaymentSuccess, Negotiation, RequestSent, MyWishlist, AllWishlists, SignUp, Index
- **Composants** : PropertyCard, PropertyImageGallery, PropertyInfo, PropertyDescription, PropertyAmenities, ReviewsSection, HostInfo, HouseRules, Neighborhood, BookingFooter, SimilarProperties, SearchBar, Header, Footer, BottomNav
- **Context** : WishlistContext
- **UI Components** : shadcn/ui library complète

### ❌ À créer
- **Services API** : properties.service, auth.service, bookings.service, negotiations.service, payments.service, wishlists.service
- **Hooks React Query** : useProperties, useAuth, useBooking, useNegotiation, usePayment, useWishlist
- **Types partagés** : tous les types dans `shared/types.ts`
- **Pages manquantes** : SearchResults, Login, Profile, MyBookings, MyNegotiations
- **Configuration** : Axios instance, React Query client, env variables
- **Validation** : Zod schemas pour formulaires
- **Tests** : tests unitaires et E2E

### 🔄 À modifier/adapter
- **Index.tsx** : intégrer appels API réels (actuellement mock ou vide)
- **PropertyDetails.tsx** : connecter aux hooks/API
- **SearchBar.tsx** : ajouter logique de recherche avec filtres
- **WishlistContext.tsx** : sync avec backend API
- **App.tsx** : ajouter routes manquantes, AuthProvider, QueryClientProvider
- **Composants business** : connecter aux données API via hooks

---

## 3) Dépendances fonctionnelles (API v1)

### Endpoints critiques MVP
```
Auth (P0)
├── POST /auth/signup
├── POST /auth/login
├── POST /auth/logout
├── POST /auth/refresh
└── GET /auth/me

Properties (P0)
├── GET /properties/search
├── GET /properties/{id}
├── GET /properties/{id}/availability
├── GET /properties/{id}/reviews
├── GET /properties/popular
└── GET /properties/featured

Bookings (P0)
├── POST /bookings
├── GET /bookings/{id}
├── GET /bookings/my
├── PUT /bookings/{id}/cancel
└── POST /bookings/pricing (calculate)

Negotiations (P1)
├── POST /negotiations
├── GET /negotiations/{id}
├── GET /negotiations/my
├── PUT /negotiations/{id}/accept
└── PUT /negotiations/{id}/reject

Payments (P0)
├── POST /payments/intent
├── POST /payments/confirm
├── GET /payments/methods
├── POST /payments/methods
└── DELETE /payments/methods/{id}

Wishlists (P1)
├── GET /wishlists
├── POST /wishlists
├── GET /wishlists/{id}
├── PUT /wishlists/{id}
├── DELETE /wishlists/{id}
├── POST /wishlists/{id}/properties/{propertyId}
├── DELETE /wishlists/{id}/properties/{propertyId}
├── GET /wishlists/default
└── POST /wishlists/toggle/{propertyId}
```

### Dépendances entre features
```
Recherche → Catalogue → Détails → Réservation → Paiement
                     ↓
                  Wishlist
                     ↓
                Négociation
```

- **Recherche** nécessite : properties.service, useSearchProperties
- **Détails** nécessite : properties.service, reviews.service, usePropertyDetail
- **Réservation** nécessite : auth (connecté), bookings.service, useCreateBooking
- **Paiement** nécessite : bookings (créée), payments.service, usePaymentIntent
- **Wishlist** nécessite : auth (optionnel), wishlists.service, useWishlist
- **Négociation** nécessite : auth (connecté), negotiations.service, useNegotiation

---

## 4) Slicing prioritaire (ordre recommandé)

### 🚀 Slice 0 — Fondations Infrastructure (P0)
**Durée estimée :** 2 jours  
**Bloquant pour :** tout le reste

#### Tasks
1. **Configuration de base**
   - Installer dépendances (@tanstack/react-query, axios, zod, react-hook-form, etc.)
   - Créer instance Axios avec intercepteurs (auth, errors)
   - Configurer React Query client
   - Setup variables d'environnement (.env)

2. **Types partagés**
   - Créer `shared/types.ts` avec tous les types du contrat
   - Exporter types vers client et server

3. **Utilities & Helpers**
   - Format date (date-fns utilities)
   - Format currency (XOF, EUR, USD)
   - Validation utilities
   - API error handler

#### Acceptance Criteria
- ✅ Axios configuré avec base URL et intercepteurs
- ✅ React Query client configuré dans App.tsx
- ✅ Types compilent sans erreurs
- ✅ .env.example créé avec toutes les variables

#### Dépendances
Aucune

---

### 🔐 Slice 1 — Authentification (P0)
**Durée estimée :** 2 jours  
**Bloquant pour :** réservation, wishlist, négociation

#### Tasks
1. **Service & Hooks Auth**
   - `auth.service.ts` : login, signup, logout, refresh, getCurrentUser
   - `useAuth` hook avec context
   - `useLogin`, `useSignup`, `useLogout` mutations

2. **Pages Auth**
   - Login page (nouvelle)
   - Adapter SignUp page existante
   - Forgot/Reset password pages (optionnel v2)

3. **Auth Flow**
   - Protected routes (HOC ou wrapper)
   - Token storage (localStorage + state)
   - Auto-refresh token logic
   - Redirect après login

#### Acceptance Criteria
- ✅ Login et Signup fonctionnels
- ✅ Token persisté et auto-refresh
- ✅ Protected routes redirect to login
- ✅ User state global accessible

#### Dépendances
- Slice 0 (fondations)

---

### 🏠 Slice 2 — Catalogue & Recherche (P0)
**Durée estimée :** 3 jours  
**Bloquant pour :** tous les parcours utilisateur

#### Tasks
1. **Services & Hooks Properties**
   - `properties.service.ts`
   - `useSearchProperties`, `usePropertyDetail`, `usePopularProperties`

2. **Page Accueil (Index.tsx)**
   - Adapter avec vrais appels API
   - Popular properties
   - Featured properties
   - Hero avec SearchBar

3. **Page Résultats Recherche**
   - Créer SearchResults.tsx
   - Intégrer filtres (prix, type, amenities, etc.)
   - Pagination
   - Tri

4. **SearchBar Component**
   - Formulaire avec validation
   - Date picker (check-in/out)
   - Guests selector
   - Submit vers /search

#### Acceptance Criteria
- ✅ Accueil affiche propriétés populaires
- ✅ SearchBar redirige vers résultats
- ✅ Filtres appliqués dynamiquement
- ✅ Pagination fonctionnelle

#### Dépendances
- Slice 0 (fondations)

---

### 🏡 Slice 3 — Détails Propriété (P0)
**Durée estimée :** 3 jours  
**Bloquant pour :** réservation, négociation

#### Tasks
1. **Adapter PropertyDetails.tsx**
   - Connecter à usePropertyDetail
   - Intégrer tous les sous-composants existants
   - Reviews avec usePropertyReviews

2. **Availability Calendar**
   - Component calendar avec dates disponibles
   - Intégration react-day-picker
   - Désactivation dates non disponibles

3. **Similar Properties**
   - Appel API ou algorithme côté client
   - Affichage carousel

#### Acceptance Criteria
- ✅ Détails complets affichés
- ✅ Calendar avec disponibilité
- ✅ Reviews paginées
- ✅ CTA Réserver et Négocier fonctionnels

#### Dépendances
- Slice 2 (catalogue)

---

### 💳 Slice 4 — Réservation & Paiement (P0)
**Durée estimée :** 4 jours  
**Bloquant pour :** monetization

#### Tasks
1. **Services & Hooks Bookings**
   - `bookings.service.ts`
   - `useCreateBooking`, `useBooking`, `useCancelBooking`, `useCalculatePricing`

2. **Services & Hooks Payments**
   - `payments.service.ts`
   - `useCreatePaymentIntent`, `useConfirmPayment`, `usePaymentMethods`

3. **Adapter pages booking flow**
   - BookOrNegotiate.tsx (déjà existe)
   - TravelerInformation.tsx (ajouter validation Zod)
   - ReviewInformation.tsx (intégrer useCalculatePricing)
   - PaymentMethod.tsx (intégration Stripe ou autre)
   - PaymentProgress.tsx
   - PaymentSuccess.tsx (afficher booking confirmé)

4. **State management booking**
   - Context ou Zustand pour données booking entre pages
   - Persist en sessionStorage

#### Acceptance Criteria
- ✅ Parcours complet fonctionnel
- ✅ Calcul prix dynamique
- ✅ Paiement intégré (Stripe test mode)
- ✅ Confirmation email (backend)
- ✅ Redirection après succès

#### Dépendances
- Slice 1 (auth - connecté requis)
- Slice 3 (détails propriété)

---

### 💬 Slice 5 — Négociation (P1)
**Durée estimée :** 2 jours  
**Non-bloquant**

#### Tasks
1. **Services & Hooks Negotiations**
   - `negotiations.service.ts`
   - `useCreateNegotiation`, `useNegotiation`, `useMyNegotiations`

2. **Adapter pages négociation**
   - Negotiation.tsx (formulaire avec validation)
   - RequestSent.tsx (confirmation)

3. **Page My Negotiations**
   - Créer MyNegotiations.tsx
   - Liste des négociations en cours
   - Statuts (pending, accepted, rejected, countered)

#### Acceptance Criteria
- ✅ Formulaire négociation fonctionnel
- ✅ Demande envoyée et trackable
- ✅ Notifications statut (optionnel)

#### Dépendances
- Slice 1 (auth)
- Slice 3 (détails propriété)

---

### ❤️ Slice 6 — Wishlist (P1)
**Durée estimée :** 2 jours  
**Non-bloquant**

#### Tasks
1. **Services & Hooks Wishlists**
   - `wishlists.service.ts`
   - `useWishlists`, `useToggleWishlist`, `useCreateWishlist`, etc.

2. **Adapter WishlistContext**
   - Sync avec backend API
   - Optimistic updates
   - Persistence

3. **Adapter pages wishlist**
   - MyWishlist.tsx (connecter API)
   - AllWishlists.tsx (CRUD wishlists)

4. **Toggle wishlist dans PropertyCard**
   - Icon heart
   - Optimistic UI

#### Acceptance Criteria
- ✅ Toggle wishlist fonctionne
- ✅ Sync avec backend
- ✅ Offline first (cache local)

#### Dépendances
- Slice 2 (catalogue)
- Slice 1 (auth - optionnel)

---

### 📱 Slice 7 — Pages Secondaires & Navigation (P1)
**Durée estimée :** 2 jours  
**Non-bloquant**

#### Tasks
1. **Page My Bookings**
   - Créer MyBookings.tsx
   - Liste réservations (upcoming, past, cancelled)
   - Détails réservation
   - Action: Cancel booking

2. **Page Profile**
   - Créer Profile.tsx
   - Informations utilisateur
   - Edit profile
   - Change password

3. **Navigation**
   - Adapter Header avec user menu
   - BottomNav avec routes correctes
   - Breadcrumbs (optionnel)

#### Acceptance Criteria
- ✅ Toutes les pages accessibles
- ✅ Navigation cohérente
- ✅ User menu fonctionnel

#### Dépendances
- Slice 1 (auth)
- Slice 4 (bookings)

---

### 🧪 Slice 8 — Tests & QA (P1)
**Durée estimée :** 3 jours  
**Non-bloquant**

#### Tasks
1. **Tests unitaires**
   - Services API (mocks axios)
   - Hooks React Query (mocks API)
   - Composants UI (testing-library)
   - Utilities (format, validation)

2. **Tests intégration**
   - Formulaires avec validation
   - Flows complets (mock API)

3. **Tests E2E (optionnel MVP)**
   - Playwright ou Cypress
   - Parcours: Recherche → Détails → Réservation
   - Parcours: Wishlist
   - Parcours: Négociation

#### Acceptance Criteria
- ✅ Couverture > 60%
- ✅ CI/CD avec tests automatiques
- ✅ E2E smoke tests passent

#### Dépendances
- Toutes les slices précédentes

---

### 🎨 Slice 9 — Polish & Optimisation (P2)
**Durée estimée :** 2 jours  
**Non-bloquant**

#### Tasks
1. **Performance**
   - Lazy loading images
   - Code splitting routes
   - React Query cache optimization
   - Lighthouse audit

2. **UX Polish**
   - Loading skeletons
   - Error boundaries
   - Empty states
   - Animations (Framer Motion - optionnel)

3. **Accessibilité**
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing
   - Color contrast

4. **SEO**
   - Meta tags dynamiques
   - Open Graph
   - Sitemap
   - robots.txt

#### Acceptance Criteria
- ✅ Lighthouse score > 85
- ✅ WAVE scan sans erreurs critiques
- ✅ All routes have proper meta

#### Dépendances
- Toutes les slices fonctionnelles

---

## 5) Roadmap visuelle

```
Semaine 1
[===== Slice 0 =====][===== Slice 1 =====]
  Fondations           Authentification

Semaine 2
[========== Slice 2 ==========][====== Slice 3 ======]
  Catalogue & Recherche          Détails Propriété

Semaine 3-4
[=================== Slice 4 ===================]
       Réservation & Paiement (critique)

Semaine 5
[=== Slice 5 ===][=== Slice 6 ===]
   Négociation        Wishlist

Semaine 6
[=== Slice 7 ===][===== Slice 8 =====]
  Pages Sec.         Tests & QA

Semaine 7
[=== Slice 9 ===]
  Polish & Optim
```

---

## 6) Ordre des tickets P0 (High Priority First)

1. **Slice 0** : Fondations (axios, react-query, types)
2. **Slice 1** : Auth (login, signup, protected routes)
3. **Slice 2** : Catalogue (search, filters, pagination)
4. **Slice 3** : PropertyDetails (full details, reviews, calendar)
5. **Slice 4** : Booking flow (traveler info → payment → success)
6. **Slice 4** : Payment integration (Stripe ou autre)

---

## 7) Parallelisation recommandée

### Phase 1 (Semaine 1-2) : Fondations + Auth + Catalogue
- **Dev A** : Slice 0 (fondations) → Slice 1 (auth service/hooks)
- **Dev B** : Slice 2 (properties service/hooks) → SearchResults page
- **Dev C** : Slice 2 (Index.tsx refactor) → SearchBar improvements

### Phase 2 (Semaine 3-4) : Détails + Réservation
- **Dev A** : Slice 3 (PropertyDetails refactor + hooks)
- **Dev B** : Slice 4 (bookings service/hooks)
- **Dev C** : Slice 4 (booking pages refactor + validation)

### Phase 3 (Semaine 5-6) : Features secondaires
- **Dev A** : Slice 5 (negotiations)
- **Dev B** : Slice 6 (wishlists)
- **Dev C** : Slice 7 (my bookings, profile)

### Phase 4 (Semaine 7) : QA + Polish
- **All devs** : Slice 8 (tests) + Slice 9 (optimisations)

---

## 8) Risques & Mitigation

### Risques techniques
| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| API non stable/documentée | High | Medium | Mocks API + contrats figés |
| Intégration paiement complexe | High | High | Provider sandbox + docs |
| Performance (images) | Medium | Medium | CDN + lazy loading + optimization |
| Auth token management | Medium | Medium | Library éprouvée (axios interceptors) |
| React Query cache invalidation | Low | Medium | Documentation + tests |

### Risques fonctionnels
| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Calcul prix incorrect | High | Low | Tests unitaires + validation backend |
| Double booking | High | Low | Pessimistic locking backend |
| Dates timezone issues | Medium | High | date-fns + ISO 8601 strict |
| Filtres recherche complexes | Medium | Medium | Incremental implementation |
| Wishlist sync issues | Low | Medium | Optimistic updates + retry |

### Dépendances externes critiques
- **Backend API** : disponibilité et performance
- **Payment provider** : Stripe/PayPal/Mobile Money intégration
- **Email service** : confirmations et notifications
- **CDN** : performance images
- **Maps API** : Google Maps ou Leaflet (Leaflet = gratuit)

### Stratégies de mitigation
1. **Mocks API** : développement sans bloquer sur backend
2. **Feature flags** : activer/désactiver features en production
3. **Staging environment** : tests d'intégration
4. **Monitoring** : Sentry pour erreurs frontend
5. **Rollback plan** : versions déployables à chaque milestone

---

## 9) Critères de succès MVP

### Fonctionnels
- ✅ Utilisateur peut rechercher propriétés avec filtres
- ✅ Utilisateur peut voir détails complets d'une propriété
- ✅ Utilisateur peut réserver et payer
- ✅ Utilisateur peut créer un compte et se connecter
- ✅ Utilisateur peut ajouter propriétés en wishlist
- ✅ Utilisateur peut négocier prix (bonus)

### Techniques
- ✅ Lighthouse score > 80
- ✅ API response time < 500ms (P95)
- ✅ Zero critical bugs
- ✅ Tests coverage > 60%
- ✅ Mobile responsive (100%)

### Business
- ✅ Parcours réservation fonctionnel bout en bout
- ✅ Paiement sécurisé intégré
- ✅ Email confirmations envoyés
- ✅ Support multi-devises (XOF minimum)

---

## 10) Checklist pré-lancement

### Code
- [ ] Tous les types TypeScript définis
- [ ] Tous les services API implémentés
- [ ] Tous les hooks React Query créés
- [ ] Toutes les pages principales fonctionnelles
- [ ] Validation Zod sur tous les formulaires
- [ ] Gestion erreurs API complète
- [ ] Loading states partout
- [ ] Empty states gérés

### Tests
- [ ] Tests unitaires services (> 70%)
- [ ] Tests unitaires hooks (> 60%)
- [ ] Tests composants UI (> 50%)
- [ ] Tests E2E parcours critiques
- [ ] Manual QA sur tous les flows

### Configuration
- [ ] Variables d'environnement documentées
- [ ] .env.example à jour
- [ ] API base URL configurable
- [ ] Stripe keys configurées
- [ ] CDN URLs configurées
- [ ] Sentry configuré (prod)

### Performance
- [ ] Images optimisées (WebP, lazy loading)
- [ ] Code splitting activé
- [ ] Bundle size < 500kb (initial)
- [ ] First Contentful Paint < 2s
- [ ] Lighthouse score > 85

### Sécurité
- [ ] Tokens JWT sécurisés
- [ ] HTTPS obligatoire (prod)
- [ ] Validation inputs (XSS prevention)
- [ ] CORS configuré
- [ ] Rate limiting (backend)
- [ ] No API keys exposed

### UX
- [ ] Mobile responsive (100%)
- [ ] Navigation intuitive
- [ ] Messages d'erreur clairs
- [ ] Success feedbacks visibles
- [ ] Loading feedbacks appropriés

### Documentation
- [ ] README.md à jour
- [ ] BACKLOG.md finalisé
- [ ] CONTRACTS_AND_INTERFACES.md validé
- [ ] DEPENDENCIES_AND_SLICING.md (ce fichier)
- [ ] Postman collection (ou équivalent)

---

## 11) Post-MVP (v2 roadmap)

### Features v2
- Admin panel (hôtes)
- Messagerie intégrée
- Multi-langue (i18n)
- OAuth (Google, Facebook)
- Reviews bidirectionnels
- Notifications push
- Mobile app (React Native)
- Advanced search (AI-powered)
- Dynamic pricing
- Promotions & coupons

### Optimisations v2
- SSR/SSG (Next.js migration ?)
- PWA (offline mode)
- Image CDN advanced (transformations)
- GraphQL API (alternative REST)
- Micro-frontends (si scale)

---

## 12) Contacts & Resources

### Équipe
- **Product Owner** : [Nom]
- **Lead Dev Frontend** : [Nom]
- **Backend API Team** : [Contact]
- **UI/UX Designer** : [Nom]
- **QA** : [Nom]

### Documentation externe
- Backend API docs : [URL Swagger/Postman]
- Figma designs : [URL]
- Confluence/Notion : [URL]
- Slack channel : #ganitel-frontend
- Jira board : [URL]

### Outils
- **Repo** : GitHub/GitLab
- **CI/CD** : GitHub Actions / Netlify / Vercel
- **Monitoring** : Sentry
- **Analytics** : Google Analytics / Mixpanel
- **Project Management** : Jira / Linear / GitHub Projects

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-03  
**Next Review:** Après M1 (fin Semaine 2)
