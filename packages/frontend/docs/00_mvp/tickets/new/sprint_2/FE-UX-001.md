# FE-UX-001 — Corrections UX, performance et qualité de code

## Priorité
P1

## Délai estimé
1.5d

## Dépendances
- FE-INT-001 (pages connectées — les skeletons doivent s'appliquer sur les vraies données)

## Contexte (Audit)
Problèmes UX, performance et qualité identifiés :
- **Deux systèmes de toast** coexistent : Radix `<Toaster>` et `<Sonner>` — incohérence des notifications
- **Inline `<style>` tags** dans Index.tsx et PaymentProgress.tsx au lieu de Tailwind/CSS
- **SVG logo dupliqué** dans 6+ pages (BookOrNegotiate, TravelerInfo, ReviewInfo, PaymentMethod, PaymentProgress, PaymentSuccess)
- **Langues mélangées** : FR dans SignIn, Profile, MyWishlist ; EN partout ailleurs
- **`strict: false`** dans tsconfig.json — pas de vérification stricte des types
- **Codes pays verrouillés sur +33** (France) alors que la cible est le Cameroun (+237)
- **Dépendances lourdes inutilisées** : three.js, @react-three/fiber, @react-three/drei, recharts, framer-motion
- `formatCountdown` défini mais jamais utilisé dans SignIn et SignUp
- `WishlistContext.tsx` (620 lignes) mélange logique et UI (Drawer)

## Tâches

### 1. Unifier le système de notifications
- [ ] Choisir un seul système : **Sonner** (plus moderne, déjà utilisé par certaines pages)
- [ ] Supprimer `<Toaster>` (Radix) de `App.tsx`
- [ ] Remplacer tous les `useToast()` par les appels `toast()` de Sonner
- [ ] Vérifier que les notifications sont cohérentes sur toutes les pages

### 2. Extraire le composant Logo
- [ ] Créer `client/components/Logo.tsx` avec le SVG du logo Ganitel
- [ ] Remplacer toutes les occurrences inline dans les pages booking/payment
- [ ] Accepter des props : `size`, `className`

### 3. Supprimer les styles inline
- [ ] `Index.tsx` — convertir le `<style>` scrollbar-hiding en classe Tailwind (`scrollbar-hide` plugin ou `global.css`)
- [ ] `PaymentProgress.tsx` — convertir `@keyframes spin` en animation Tailwind

### 4. Uniformiser la langue
- [ ] Décider de la langue par défaut : **FR** (app ciblant le Cameroun francophone)
- [ ] Traduire les textes restants en français ou créer une structure i18n minimale
- [ ] Corriger les codes pays : défaut `+237` (Cameroun) au lieu de `+33` (France)

### 5. Activer TypeScript strict
- [ ] Dans `tsconfig.json`, activer progressivement :
  - `"strict": true`
  - `"noImplicitAny": true`
  - `"strictNullChecks": true`
- [ ] Corriger les erreurs de type résultantes (estimé ~30-50 erreurs)
- [ ] Remplacer les `as any` dans les pages par des types corrects

### 6. Nettoyer les dépendances
- [ ] Supprimer les dépendances inutilisées du `package.json` :
  - `three`, `@react-three/fiber`, `@react-three/drei` (3D non utilisé)
  - `recharts` (si aucun graphique n'est affiché)
  - Vérifier `framer-motion` (utilisé ? sinon supprimer)
- [ ] `pnpm install` pour mettre à jour le lockfile

### 7. Refactoring WishlistContext
- [ ] Extraire le composant Drawer de `WishlistContext.tsx` vers `client/components/WishlistDrawer.tsx`
- [ ] Le contexte ne doit contenir que la logique d'état
- [ ] Le Provider rend `{children}` + `<WishlistDrawer />` séparément

### 8. Supprimer le code mort
- [ ] `formatCountdown` dans SignIn.tsx et SignUp.tsx (jamais appelé)
- [ ] Types legacy inutilisés dans `shared/api.ts`
- [ ] `test-utils.ts` : vérifier si utilisé par les tests, sinon supprimer

## Critères d'acceptation
- [ ] Un seul système de toast (Sonner) dans toute l'application
- [ ] Zéro SVG inline dupliqué — composant `<Logo>` utilisé partout
- [ ] Zéro `<style>` inline — tout en Tailwind ou CSS
- [ ] Langue cohérente sur toute l'application
- [ ] `pnpm typecheck` passe avec `strict: true` (ou progression documentée)
- [ ] Bundle size réduit après suppression des dépendances inutiles
- [ ] WishlistContext < 200 lignes (logique seule)

## Fichiers impactés
- `client/components/Logo.tsx` (nouveau)
- `client/components/WishlistDrawer.tsx` (nouveau)
- `client/App.tsx` (supprimer Toaster Radix)
- `client/contexts/WishlistContext.tsx` (refactor)
- `client/pages/SignIn.tsx`, `client/pages/SignUp.tsx` (cleanup)
- `client/pages/Index.tsx`, `client/pages/PaymentProgress.tsx` (inline styles)
- `tsconfig.json`
- `package.json`
- Toutes les pages avec SVG logo inline
