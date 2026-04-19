# FE-DEPLOY-001 — Dockerisation, CI/CD et préparation production

## Priorité
P1

## Délai estimé
2d

## Dépendances
- FE-TEST-001 (tests passants en CI)
- FE-UX-001 (TypeScript strict + cleanup deps)

## Contexte (Audit)
Le projet n'a aucune infrastructure de déploiement avancée :
- **Netlify** : Configuration existante (`netlify.toml`) mais utilise `npm` au lieu de `pnpm`
- **Docker** : Aucun Dockerfile
- **CI/CD** : Aucun pipeline (GitHub Actions, etc.)
- **Variables d'env** : Seul `VITE_API_BASE_URL` est utilisé ; pas de `.env.example` ni de validation
- **Monitoring** : Aucun (pas de Sentry, pas d'analytics)
- **SEO** : Pas de meta tags dynamiques, pas de sitemap

## Tâches

### 1. Dockerfile multi-stage
- [ ] Créer `Dockerfile` à la racine :
  ```dockerfile
  # Stage 1: Build
  FROM node:20-alpine AS builder
  RUN corepack enable
  WORKDIR /app
  COPY package.json pnpm-lock.yaml ./
  RUN pnpm install --frozen-lockfile
  COPY . .
  RUN pnpm build

  # Stage 2: Serve
  FROM node:20-alpine AS runner
  RUN corepack enable
  WORKDIR /app
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/package.json ./
  COPY --from=builder /app/pnpm-lock.yaml ./
  RUN pnpm install --prod --frozen-lockfile
  EXPOSE 3000
  CMD ["node", "dist/server/index.js"]
  ```
- [ ] Créer `.dockerignore` (node_modules, .git, dist, test-results, playwright)
- [ ] Tester le build Docker localement : `docker build -t ganitel-frontend . && docker run -p 3000:3000 ganitel-frontend`

### 2. Docker Compose (dev)
- [ ] Créer `docker-compose.yml` pour le développement :
  ```yaml
  services:
    frontend:
      build: .
      ports:
        - "8080:3000"
      environment:
        - VITE_API_BASE_URL=https://staging.ganitel.com/api/v1
      volumes:
        - .:/app
        - /app/node_modules
  ```
- [ ] Optionnel : ajouter un service `nginx` pour le reverse proxy

### 3. CI/CD Pipeline (GitHub Actions)
- [ ] Créer `.github/workflows/ci.yml` :
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    lint-and-typecheck:
      - pnpm install
      - pnpm typecheck
    test:
      - pnpm test -- --reporter=verbose
    build:
      - pnpm build
    e2e:
      - npx playwright install --with-deps
      - pnpm test:e2e
  ```
- [ ] Créer `.github/workflows/deploy.yml` pour le déploiement sur Netlify/production :
  - Trigger : push sur `main`
  - Build → test → deploy

### 4. Variables d'environnement
- [ ] Créer `.env.example` avec toutes les variables documentées :
  ```
  VITE_API_BASE_URL=https://staging.ganitel.com/api/v1
  VITE_AUTH_MOCK=false
  VITE_PAYMENT_MOCK=false
  VITE_GOOGLE_OAUTH_CLIENT_ID=
  VITE_SENTRY_DSN=
  VITE_APP_ENV=development
  ```
- [ ] Créer un helper `client/lib/env.ts` qui valide les variables au démarrage :
  ```typescript
  const env = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
    isAuthMock: import.meta.env.VITE_AUTH_MOCK === 'true',
    isPaymentMock: import.meta.env.VITE_PAYMENT_MOCK === 'true',
    appEnv: import.meta.env.VITE_APP_ENV || 'development',
  };
  ```
- [ ] Utiliser `env.ts` dans tous les services au lieu de `import.meta.env` partout

### 5. Corriger Netlify
- [ ] `netlify.toml` : changer `npm run build:client` → `pnpm build:client` (ou `npx pnpm build:client`)
- [ ] Vérifier que les redirects SPA fonctionnent (`/* → /index.html 200`)
- [ ] Ajouter les variables d'environnement dans le dashboard Netlify

### 6. Monitoring et observabilité
- [ ] Intégrer **Sentry** pour le tracking d'erreurs :
  - `pnpm add @sentry/react`
  - Initialiser dans `App.tsx` avec `Sentry.init({ dsn: env.sentryDsn, environment: env.appEnv })`
  - Wrapper les routes avec `Sentry.ErrorBoundary`
- [ ] Ajouter un **Error Boundary** global qui affiche une page d'erreur propre au lieu d'un écran blanc
- [ ] Optionnel : ajouter des logs structurés côté serveur Express

### 7. Optimisation build
- [ ] Activer le code splitting par route (React.lazy + Suspense) :
  ```typescript
  const PropertyDetails = React.lazy(() => import('./pages/PropertyDetails'));
  ```
- [ ] Vérifier le bundle size avec `npx vite-bundle-visualizer`
- [ ] Ajouter les headers de cache appropriés pour les assets statiques

### 8. SEO minimal
- [ ] Installer `react-helmet-async` pour les meta tags dynamiques
- [ ] Ajouter les meta tags de base : title, description, og:image, robots
- [ ] Créer `public/sitemap.xml` minimal

## Critères d'acceptation
- [ ] `docker build` et `docker run` fonctionnent sans erreur
- [ ] Pipeline CI passe sur GitHub Actions (typecheck + tests + build)
- [ ] `.env.example` documente toutes les variables nécessaires
- [ ] Netlify build fonctionne avec `pnpm`
- [ ] Sentry capture les erreurs en production
- [ ] Error Boundary global empêche l'écran blanc
- [ ] Bundle size < 500KB gzipped pour le chunk principal
- [ ] Toutes les routes sont lazy-loaded

## Fichiers impactés
- `Dockerfile` (nouveau)
- `.dockerignore` (nouveau)
- `docker-compose.yml` (nouveau)
- `.github/workflows/ci.yml` (nouveau)
- `.github/workflows/deploy.yml` (nouveau)
- `.env.example` (nouveau)
- `client/lib/env.ts` (nouveau)
- `client/App.tsx` (Sentry, ErrorBoundary, lazy loading)
- `netlify.toml` (fix pnpm)
- `package.json` (scripts)
