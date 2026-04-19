# FE-GUARD-001 — Routes protégées et navigation sécurisée

## Priorité
P0

## Délai estimé
1d

## Dépendances
- FE-AUTH-002 (AuthContext et useAuth nécessaires)

## Contexte (Audit)
L'audit révèle que **zéro route sur 16 n'est protégée**. Les pages suivantes sont accessibles sans authentification :
- `/profile` — affiche un placeholder, devrait montrer les infos utilisateur
- `/my-wishlist` — données localStorage, devrait synchroniser avec le backend
- `/booking/*` (6 routes) — tout le flux réservation/paiement est accessible sans login
- Les pages booking dépendent de `location.state` pour les données de propriété : un accès direct (URL, refresh) casse la page

## Tâches

### 1. Créer le composant `ProtectedRoute`
- [ ] Créer `client/components/ProtectedRoute.tsx` :
  ```typescript
  // Si non authentifié → redirect vers /sign-in avec returnUrl
  // Si authentifié → rendre les enfants
  // Pendant le chargement auth → afficher un skeleton/loader
  ```
- [ ] Stocker l'URL de retour dans les query params : `/sign-in?returnUrl=/booking/payment`
- [ ] Après login réussi, rediriger vers `returnUrl`

### 2. Appliquer les guards dans App.tsx
- [ ] Protéger les routes :
  - `/profile` → `<ProtectedRoute>`
  - `/my-wishlist` → `<ProtectedRoute>`
  - `/booking/method` → `<ProtectedRoute>`
  - `/booking/negotiate` → `<ProtectedRoute>`
  - `/booking/request-sent` → `<ProtectedRoute>`
  - `/booking/confirm` → `<ProtectedRoute>`
  - `/booking/review` → `<ProtectedRoute>`
  - `/booking/payment` → `<ProtectedRoute>`
  - `/booking/payment-progress` → `<ProtectedRoute>`
  - `/booking/payment-success` → `<ProtectedRoute>`
- [ ] Laisser publiques : `/`, `/search`, `/sign-in`, `/sign-up`, `/property/:id`, `*`

### 3. Sécuriser la navigation booking
- [ ] Ajouter un guard de contexte booking : si `BookingContext` ne contient pas de propriété sélectionnée, rediriger vers `/` avec un toast d'erreur
- [ ] Appliquer ce guard sur toutes les routes `/booking/*` (sauf `/booking/method` qui peut recevoir depuis `location.state`)
- [ ] Persister le `BookingContext` dans `sessionStorage` (au lieu de `localStorage`) pour survivre aux refreshs mais pas aux sessions

### 4. Corriger NotFound.tsx
- [ ] Remplacer `<a href="/">` par `<Link to="/">` (éviter le full reload)
- [ ] Supprimer le `console.error` sur chaque render

### 5. Corriger les React Router warnings
- [ ] Ajouter les future flags dans `<BrowserRouter>` :
  ```typescript
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  ```

## Critères d'acceptation
- [ ] Accès à `/profile` sans auth → redirect `/sign-in?returnUrl=/profile`
- [ ] Accès à `/booking/payment` sans auth → redirect `/sign-in`
- [ ] Accès à `/booking/payment` sans booking actif → redirect `/` avec toast
- [ ] Après login, retour automatique à l'URL d'origine
- [ ] Refresh sur une page booking → données de contexte préservées
- [ ] Zéro warning React Router dans la console
- [ ] NotFound utilise React Router `<Link>`

## Fichiers impactés
- `client/components/ProtectedRoute.tsx` (nouveau)
- `client/App.tsx` (guards + future flags)
- `client/pages/NotFound.tsx` (fix Link)
- `client/contexts/BookingContext.tsx` (sessionStorage)
