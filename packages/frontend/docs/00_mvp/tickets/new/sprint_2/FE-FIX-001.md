# FE-FIX-001 — Corriger les bugs critiques de la couche services/hooks

## Priorité
P0 (bloquant)

## Délai estimé
1d

## Dépendances
Aucune

## Contexte (Audit)
L'audit a révélé plusieurs bugs cassants (runtime errors) dans la couche services/hooks qui empêchent toute intégration API réelle :
- `useSignup` appelle `authService.signup()` → méthode inexistante (devrait être `register`)
- `useCalculatePricing` appelle `bookingsService.calculatePricing()` → méthode inexistante
- `Availability` importé depuis `@shared/api` → type non défini
- `useCancelBooking` passe un paramètre `reason` ignoré silencieusement par le service
- `useSignup` envoie `{ email, password, first_name, last_name, phone? }` mais `register()` attend aussi `user_type`, `country`, `city`

## Tâches

### 1. Corriger useAuth.ts
- [x] Renommer l'appel `authService.signup(data)` → `authService.register(data)` dans `useSignup`
- [x] Aligner le type de mutation `useSignup` avec la signature `register()` (ajouter `user_type`, `country`, `city` ou rendre ces champs optionnels dans le service)
- [x] `useLogin` : aligner le type `{ email, password }` avec la signature `login(identifier, password)`

### 2. Corriger useBooking.ts
- [x] Supprimer ou stubber `useCalculatePricing` (aucun endpoint backend correspondant)
- [x] Corriger `useCancelBooking` pour envoyer le paramètre `reason` au service
- [x] Mettre à jour `bookingsService.cancelBooking()` pour accepter `(bookingId, reason?)`

### 3. Corriger les types partagés
- [x] Ajouter le type `Availability` dans `shared/api.ts` (ou supprimer son import si non nécessaire)
- [x] Supprimer les types legacy dupliqués inutilisés (`Wishlist`, `PropertyListItem` legacy vs `ServiceListItem`)
- [x] Aligner `BookingContext.guests` (`{ adults, children, infants }`) avec le format backend (`guests: number`) — ajouter un helper de conversion

### 4. Corriger axios.ts
- [x] Changer la redirection `/login` → `/sign-in` dans l'intercepteur 401
- [x] Ajouter un mécanisme de file d'attente pour éviter les appels refresh multiples simultanés

### 5. Nettoyer constants.ts
- [x] Supprimer ou mettre à jour `API_ENDPOINTS` (actuellement stale et jamais utilisé) :
  - `AUTH_SIGNUP` → corrigé ou supprimé
  - `AUTH_REFRESH` → `/auth/refresh-token`
  - `AUTH_ME` → `/users/me`
  - `PAYMENTS_INTENT` → `/payments/initiate`
  - `WISHLISTS_TOGGLE` → `/wishlists/services/{service_id}/toggle`

## Critères d'acceptation
- [x] Zéro erreur runtime dans les hooks (vérifié avec `pnpm typecheck` + tests)
- [x] Les types dans `shared/api.ts` sont cohérents et sans import cassé
- [x] Les tests existants passent toujours (127/127)
- [x] Intercepteur axios redirige correctement vers `/sign-in`

## Fichiers impactés
- `client/hooks/useAuth.ts`
- `client/hooks/useBooking.ts`
- `client/services/auth.service.ts`
- `client/services/bookings.service.ts`
- `client/lib/axios.ts`
- `client/lib/constants.ts`
- `shared/api.ts`
- `client/contexts/BookingContext.tsx`
