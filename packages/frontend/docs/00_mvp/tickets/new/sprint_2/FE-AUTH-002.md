# FE-AUTH-002 — Implémenter l'authentification OTP email + Google OAuth

## Priorité
P0

## Délai estimé
2.5d

## Dépendances
- FE-FIX-001
- FE-AUTH-001 (spécification OTP + Google)

## Contexte (Audit)
L'authentification actuelle est **entièrement factice** :
- SignIn et SignUp utilisent un OTP hardcodé `"123456"`, aucun appel API
- Aucun token n'est stocké, aucune session n'est créée
- `authService` ne supporte que le login par mot de passe (pas d'OTP)
- Google/Facebook OAuth n'est pas implémenté côté frontend (mais le backend le supporte)
- Le ticket FE-AUTH-001 exige OTP + email (sans mot de passe) + Google OAuth

**Note**: Le backend actuel supporte `POST /auth/register` (email+password) et `POST /auth/login` (identifier+password). L'OTP n'est pas encore implémenté côté backend. Le frontend doit être prêt avec un adapter qui pourra basculer entre les modes.

## Tâches

### 1. Créer l'adapter auth (`client/services/auth.adapter.ts`)
- [x] Définir l'interface `AuthAdapter` :
  ```typescript
  interface AuthAdapter {
    sendOtp(email: string): Promise<void>;
    verifyOtp(email: string, token: string): Promise<AuthResponse>;
    signInWithGoogle(): Promise<void>; // redirect vers OAuth URL
    handleGoogleCallback(code: string): Promise<AuthResponse>;
    signOut(): Promise<void>;
    getSession(): Promise<User | null>;
    refreshToken(): Promise<AuthResponse>;
  }
  ```
- [x] Implémenter `BackendAuthAdapter` qui utilise les endpoints existants :
  - `sendOtp` → `POST /auth/forgot-password` (temporaire) ou stub
  - `verifyOtp` → `POST /auth/login` (avec email+otp ou stub)
  - `signInWithGoogle` → `GET /auth/oauth/google/url` puis redirect
  - `handleGoogleCallback` → `GET /auth/oauth/google/callback?code=...`
  - `signOut` → `POST /auth/logout`
  - `getSession` → `GET /users/me`
  - `refreshToken` → `POST /auth/refresh-token`
- [x] Implémenter `MockAuthAdapter` pour le développement offline

### 2. Refondre SignIn.tsx
- [x] Supprimer le OTP hardcodé `"123456"`
- [x] Écrans :
  1. Choix méthode : bouton Google + champ email
  2. Saisie email → appel `adapter.sendOtp(email)`
  3. Saisie OTP (6 digits) → appel `adapter.verifyOtp(email, token)`
  4. Succès → stocker token + redirect
- [x] Gestion d'erreurs : email invalide, OTP expiré, trop de tentatives, réseau
- [x] Désactiver les boutons pendant le loading
- [x] Gérer le flux Google OAuth (redirect + callback)

### 3. Refondre SignUp.tsx
- [x] Flux similaire à SignIn (Google + email OTP)
- [x] Après vérification OTP, collecter les infos complémentaires si nécessaire (nom, téléphone)
- [x] Appeler `POST /auth/register` avec les données collectées
- [x] Transition fluide vers la session authentifiée

### 4. Gestion de session
- [x] Stocker `access_token` de manière sécurisée (HTTP-only cookie via backend, fallback localStorage)
- [x] Créer `AuthContext` avec état : `user`, `isLoading`, `isAuthenticated`, `error`
- [x] Hook `useAuth()` retournant l'état + méthodes (`signIn`, `signOut`, etc.)
- [x] Auto-refresh du token via l'intercepteur axios existant
- [x] Persister la session au reload (vérifier `/users/me` au démarrage)

### 5. Google OAuth
- [x] Bouton "Continuer avec Google" sur SignIn et SignUp
- [x] Appeler `GET /auth/oauth/google/url` → récupérer l'URL de redirect
- [x] Rediriger l'utilisateur vers Google
- [x] Sur callback `/auth/callback?code=...`, appeler `GET /auth/oauth/google/callback?code=...`
- [x] Stocker le token retourné et redirect vers la page d'origine

### 6. Internationalisation
- [x] Uniformiser les textes FR/EN (actuellement mixte)
- [x] Supporter les codes téléphoniques Cameroun (+237) par défaut au lieu de France (+33)

## Critères d'acceptation
- [x] Flux OTP email fonctionnel (ou correctement stubbé si backend pas prêt)
- [x] Flux Google OAuth fonctionnel avec redirect et callback
- [x] Session persistée au reload du navigateur
- [x] Erreurs UX claires : email invalide, OTP expiré, réseau indisponible
- [x] Mode mock configurable via variable d'environnement `VITE_AUTH_MOCK=true`
- [x] Aucune régression sur la navigation et les routes

## Fichiers impactés
- `client/services/auth.adapter.ts` (nouveau)
- `client/services/auth.service.ts` (mis à jour)
- `client/pages/SignIn.tsx` (refonte)
- `client/pages/SignUp.tsx` (refonte)
- `client/contexts/AuthContext.tsx` (nouveau)
- `client/hooks/useAuth.ts` (refonte)
- `client/App.tsx` (ajouter AuthProvider + route callback OAuth)
