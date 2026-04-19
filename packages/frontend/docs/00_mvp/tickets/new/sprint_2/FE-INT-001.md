# FE-INT-001 — Connecter les pages aux données réelles (supprimer les mocks)

## Priorité
P0

## Délai estimé
2.5d

## Dépendances
- FE-SVC-001 (hooks useServices alignés sur le backend)
- FE-AUTH-002 (session auth pour les appels authentifiés)
- FE-GUARD-001 (routes protégées)

## Contexte (Audit)
Actuellement **toutes les pages consomment `mockData.ts`** directement :
- `Index.tsx` → `MOCK_PROPERTIES.slice(0, 3)` avec faux timer 1200ms
- `SearchResults.tsx` → `MOCK_PROPERTIES.filter(...)` avec filtres locaux
- `PropertyDetails.tsx` → `getMockPropertyDetail(id)` avec faux timer 800ms
- `SearchModal.tsx` → `MOCK_PROPERTIES.map(...)` pour suggestions
- `SimilarProperties.tsx` → `MOCK_PROPERTIES.slice(0, 4)`

Les hooks React Query existent mais ne sont jamais utilisés. Le service layer correct (`servicesService`) est orphelin.

## Tâches

### 1. Page d'accueil (`Index.tsx`)
- [ ] Remplacer `MOCK_PROPERTIES` par `useFeaturedServices()` et `useSearchServices({ sort: 'popular' })`
- [ ] Utiliser le mapper `mapServiceToCard()` pour alimenter `PropertyCard`
- [ ] Implémenter les vrais états : loading (skeleton), error (retry button), empty (message)
- [ ] Supprimer le faux `setTimeout` de 1200ms

### 2. Page recherche (`SearchResults.tsx`)
- [ ] Remplacer les filtres locaux par `useSearchServices(filters)` avec query params
- [ ] Synchroniser les filtres avec l'URL (`useSearchParams`) : `?q=...&city=...&min_price=...&max_price=...&guests=...&check_in=...&check_out=...`
- [ ] Implémenter la pagination (backend retourne `{ total, page, per_page, pages }`)
- [ ] Supprimer les dates hardcodées `"2025-07-23"` / `"2025-07-30"`
- [ ] Corriger `handleApplyFilters` (actuellement ne fait rien)

### 3. Page détail propriété (`PropertyDetails.tsx`)
- [ ] Remplacer `getMockPropertyDetail(id)` par `useServiceDetail(id)`
- [ ] Mapper les données imbriquées du backend vers les composants :
  - `service.pricing.base_price` → prix affiché
  - `service.capacity.max_guests` → capacité
  - `service.rating.average` → notation
  - `service.location.city` → localisation
- [ ] Utiliser `useServiceReviews(id)` pour la section avis
- [ ] Gérer le 404 si la propriété n'existe pas
- [ ] Supprimer `property` typé `any` → typer correctement

### 4. Composants alimentés par les données
- [ ] `SearchModal.tsx` : utiliser une recherche live `useSearchServices({ q: inputValue })` au lieu de mock
- [ ] `SimilarProperties.tsx` : utiliser `useSearchServices({ city: currentService.location.city, per_page: 4 })` ou service dédié
- [ ] `PropertyCard.tsx` : vérifier la compatibilité des props avec les données `ServiceListItem` mappées

### 5. Wishlist
- [ ] Connecter `WishlistContext` aux endpoints backend :
  - `POST /wishlists/services/{service_id}/toggle` pour ajouter/retirer
  - `GET /wishlists/me` pour charger les wishlists au login
- [ ] Garder le localStorage comme cache optimiste (mise à jour immédiate + sync backend)
- [ ] Migrer les types `PropertyListItem` → `ServiceListItem` dans le contexte

### 6. Nettoyage
- [ ] Supprimer `client/mockData.ts` une fois toutes les intégrations faites
- [ ] Supprimer toutes les références à `MOCK_PROPERTIES` et `getMockPropertyDetail`
- [ ] Supprimer les `property as any` dans les pages

## Critères d'acceptation
- [ ] Aucune page n'importe `mockData.ts`
- [ ] Les données affichées proviennent de l'API backend (ou d'un stub configurable)
- [ ] États loading, error, et empty correctement affichés sur chaque page
- [ ] Filtres de recherche synchronisés avec l'URL
- [ ] Wishlist toggle appelle le backend + cache local optimiste
- [ ] `pnpm typecheck` passe sans erreur
- [ ] Aucune régression visuelle (layout mobile/desktop intact)

## Fichiers impactés
- `client/pages/Index.tsx`
- `client/pages/SearchResults.tsx`
- `client/pages/PropertyDetails.tsx`
- `client/components/SearchModal.tsx`
- `client/components/SimilarProperties.tsx`
- `client/contexts/WishlistContext.tsx`
- `client/mockData.ts` (supprimé)
