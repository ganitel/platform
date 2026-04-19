# FE-TEST-001 — Tests unitaires, d'intégration et E2E

## Priorité
P1

## Délai estimé
3d

## Dépendances
- FE-INT-001 (pages connectées — tester les vrais flux, pas les mocks)
- FE-AUTH-002 (auth flow à tester)
- FE-BOOK-001 (booking flow à tester)

## Contexte (Audit)
État des tests actuel : **127/127 passent** mais la couverture est superficielle :
- **Pages** : 16 tests smoke-only (render + assert un texte). Aucun test d'interaction, formulaire, navigation ou erreur.
- **Hooks** : `useAuth`, `useBooking`, `useNegotiation`, `useProperties` ne sont jamais exécutés avec `renderHook()`. Seuls les query keys et types sont vérifiés.
- **Components** : 24 tests smoke-only. Aucun test de click, state change, ou interaction utilisateur.
- **Services** : Bien testés avec mocks Axios (13 tests auth, 5 bookings, 5 negotiations, etc.)
- **Contextes** : `BookingContext` et `WishlistContext` ne sont pas testés directement.
- **Intercepteur Axios** : Token refresh non testé.
- **E2E** : Config Playwright existe mais aucun test écrit.
- **`test-utils.ts`** existe avec des helpers mais **aucun test ne l'importe**.

### Objectif couverture
- Services : > 80% (actuellement ~70%)
- Hooks : > 60% (actuellement ~10%)
- Pages : > 50% (actuellement ~5%)
- Contextes : > 70% (actuellement 0%)
- **Global : > 60%**

## Tâches

### 1. Tests unitaires — Hooks (Vitest + renderHook)
- [ ] `useAuth` : tester `useLogin`, `useSignup`, `useLogout` avec des mocks API ; vérifier le stockage de token, les erreurs, et l'invalidation du cache
- [ ] `useServices` (nouveau) : tester `useSearchServices`, `useServiceDetail`, `useFeaturedServices` avec des mocks ; vérifier les params de requête, les erreurs réseau
- [ ] `useBooking` : tester `useCreateBooking`, `useMyBookings`, `useCancelBooking` ; vérifier l'invalidation du cache après mutation
- [ ] `usePayment` (nouveau) : tester `useInitiatePayment`, polling statut
- [ ] Utiliser `@testing-library/react-hooks` avec un wrapper `QueryClientProvider` pour chaque test

### 2. Tests unitaires — Contextes
- [ ] `BookingContext` : tester la persistance `sessionStorage`, la conversion `guests`, les méthodes `setDates`, `setTravelerInfo`, `reset`
- [ ] `WishlistContext` : tester `toggleWishlist`, `createCollection`, `addToCollection`, persistance localStorage
- [ ] `AuthContext` (nouveau) : tester l'état `isAuthenticated`, `user`, les transitions de session

### 3. Tests d'intégration — Pages (Vitest + Testing Library)
- [ ] **Flux auth** : SignIn → saisie email → OTP → redirect profil
  - Mock `authAdapter.sendOtp` + `authAdapter.verifyOtp`
  - Vérifier les transitions d'écran, les messages d'erreur
- [ ] **Flux recherche** : Index → click recherche → SearchResults → filtres → résultats
  - Mock `servicesService.searchServices`
  - Vérifier les états loading/error/empty
- [ ] **Flux booking** :
  - PropertyDetails → Book → dates → TravelerInfo → Review → Payment → Success
  - Mock `bookingsService.createBooking` + `paymentsService.initiatePayment`
  - Vérifier chaque étape avec les données propagées
- [ ] **Flux wishlist** : PropertyCard → toggle cœur → MyWishlist affiche l'item

### 4. Tests intercepteur Axios
- [ ] Tester le refresh token automatique sur 401
- [ ] Tester la file d'attente quand plusieurs requêtes échouent simultanément
- [ ] Tester la redirect vers `/sign-in` quand le refresh échoue

### 5. Tests E2E (Playwright)
- [ ] **Smoke test** : accéder à `/`, vérifier le header, les propriétés, le footer
- [ ] **Navigation** : `/` → `/property/1` → `/booking/method` → vérifier la chaîne
- [ ] **Responsive** : vérifier le BottomNav sur mobile viewport
- [ ] Ajouter Firefox et Safari (WebKit) dans `playwright.config.ts`
- [ ] Configurer le MSW (Mock Service Worker) pour les tests E2E en local

### 6. Infrastructure de test
- [ ] Mettre à jour `client/lib/test-utils.ts` pour qu'il soit réellement importé :
  - Wrapper avec tous les providers (`QueryClient`, `BookingProvider`, `WishlistProvider`, `AuthProvider`, `BrowserRouter`)
  - Helpers : `renderWithProviders`, `createMockService`, `createMockBooking`
- [ ] Ajouter un script `pnpm test:coverage` dans `package.json` avec seuil minimal
- [ ] Ajouter un script `pnpm test:e2e` pour Playwright

## Critères d'acceptation
- [ ] Couverture globale > 60% (vérifiable via `pnpm test:coverage`)
- [ ] Tous les flux critiques ont au moins un test d'intégration : auth, recherche, booking+paiement, wishlist
- [ ] Tests E2E smoke passent sur Chromium
- [ ] `test-utils.ts` est utilisé par les nouveaux tests
- [ ] CI-compatible : tous les tests passent en mode headless
- [ ] Zéro test flaky (pas de `setTimeout` dans les tests)

## Fichiers impactés
- `client/hooks/*.spec.ts` (réécrits/complétés)
- `client/contexts/*.spec.ts` (nouveaux)
- `client/pages/*.spec.tsx` (réécrits)
- `client/lib/axios.spec.ts` (nouveau)
- `client/lib/test-utils.ts` (mis à jour)
- `playwright/tests/*.spec.ts` (nouveaux)
- `playwright.config.ts` (browsers ajoutés)
- `package.json` (scripts test)
