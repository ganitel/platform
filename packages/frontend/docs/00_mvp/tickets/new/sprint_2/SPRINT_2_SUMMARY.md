# Sprint 2 — Résumé et ordre d'exécution

## Résultat de l'audit

### État global du projet
- **Complétude estimée** : ~35% (12/34 user stories terminées)
- **UI** : 95% terminée (pages et composants visuels prêts)
- **Intégration API** : 0% en production (services existent mais aucune page ne les utilise — 100% mock data)
- **Auth** : 0% fonctionnel (OTP hardcodé, aucun token, aucune session)
- **Paiement** : 0% fonctionnel (timer 3s factice, aucun appel Tranzak)
- **Tests** : 127 passent mais couverture réelle < 15% (smoke tests uniquement)
- **Production** : 0% (pas de Docker, pas de CI, pas de monitoring)

### Problèmes bloquants identifiés

| # | Problème | Sévérité |
|---|---|---|
| 1 | `useSignup` appelle une méthode inexistante `authService.signup()` | CRASH |
| 2 | `useCalculatePricing` appelle une méthode inexistante `bookingsService.calculatePricing()` | CRASH |
| 3 | Type `Availability` importé mais non défini dans `shared/api.ts` | CRASH TS |
| 4 | `propertiesService` appelle `/properties/*` — le backend n'a que `/services/*` → 404 | BLOQUANT |
| 5 | `negotiationsService` appelle `/negotiations/*` — endpoints inexistants | BLOQUANT |
| 6 | Toutes les pages utilisent `mockData.ts` au lieu des hooks/services | BLOQUANT |
| 7 | `servicesService` (correctement aligné) n'a aucun hook React Query | BLOQUANT |
| 8 | Zéro route protégée par auth sur 16 routes | SÉCURITÉ |
| 9 | Auth 100% factice (OTP hardcodé, token jamais stocké) | BLOQUANT |
| 10 | Paiement 100% factice (aucun appel `POST /payments/initiate`) | BLOQUANT |

### Incohérences frontend ↔ backend

| Sujet | Frontend actuel | Backend réel |
|---|---|---|
| Auth | Email OTP hardcodé | Email+password + Google/Facebook OAuth |
| Propriétés | `/properties/*` | `/services/*` |
| Guests | `{ adults, children, infants }` | `guests: number` |
| Wishlist | localStorage seul | `POST /wishlists/services/{id}/toggle` |
| Paiement | Timer 3s factice | `POST /payments/initiate` → redirect Tranzak |
| Négociations | `/negotiations/*` (5 endpoints) | Aucun endpoint (V1 prévu) |
| Constants | `API_ENDPOINTS` stale et jamais utilisé | — |
| Redirect 401 | → `/login` | Route réelle = `/sign-in` |

---

## Tickets Sprint 2

### Phase 1 — Fondations (semaine 1)

| Ticket | Titre | Priorité | Estimé | Dépendances |
|---|---|---|---|---|
| **FE-FIX-001** | Corriger les bugs critiques services/hooks | P0 | 1d | — |
| **FE-SVC-001** | Aligner la couche services sur `/services/*` | P0 | 1.5d | FE-FIX-001 |
| **FE-AUTH-002** | Auth OTP email + Google OAuth | P0 | 2.5d | FE-FIX-001 |

### Phase 2 — Intégration (semaine 2)

| Ticket | Titre | Priorité | Estimé | Dépendances |
|---|---|---|---|---|
| **FE-GUARD-001** | Routes protégées et navigation sécurisée | P0 | 1d | FE-AUTH-002 |
| **FE-INT-001** | Connecter les pages aux données réelles | P0 | 2.5d | FE-SVC-001, FE-AUTH-002, FE-GUARD-001 |
| **FE-PAY-002** | Intégration paiement Tranzak | P0 | 2d | FE-INT-001 |
| **FE-BOOK-001** | Flux réservation + négociation connecté | P1 | 2d | FE-INT-001, FE-PAY-002 |

### Phase 3 — Qualité et production (semaine 3)

| Ticket | Titre | Priorité | Estimé | Dépendances |
|---|---|---|---|---|
| **FE-UX-001** | Corrections UX, performance, qualité code | P1 | 1.5d | FE-INT-001 |
| **FE-PROFILE-001** | Page profil utilisateur | P2 | 1.5d | FE-AUTH-002, FE-GUARD-001 |
| **FE-TEST-001** | Tests unitaires, intégration et E2E | P1 | 3d | FE-INT-001, FE-AUTH-002, FE-BOOK-001 |
| **FE-DEPLOY-001** | Dockerisation, CI/CD, production | P1 | 2d | FE-TEST-001, FE-UX-001 |

### Diagramme de dépendances

```
FE-FIX-001 ──┬── FE-SVC-001 ──┐
              │                 │
              └── FE-AUTH-002 ──┼── FE-GUARD-001 ──┐
                                │                   │
                                └───────────────────┼── FE-INT-001 ──┬── FE-PAY-002 ──── FE-BOOK-001
                                                    │                │
                                                    │                ├── FE-UX-001
                                                    │                │
                                                    └── FE-PROFILE-001
                                                                     │
                                                    FE-TEST-001 ─────┘
                                                         │
                                                    FE-DEPLOY-001
```

### Effort total estimé : ~20.5 jours-homme

### Tickets existants conservés
Les 3 tickets existants (FE-AUTH-001, FE-PAY-001, FE-PROP-001) sont **englobés** dans les nouveaux tickets :
- FE-AUTH-001 → absorbé par **FE-AUTH-002** (plus complet, inclut OAuth + adapter)
- FE-PAY-001 → absorbé par **FE-PAY-002** (inclut flux Tranzak réel)
- FE-PROP-001 → absorbé par **FE-SVC-001** + **FE-INT-001** (correction du service layer + connexion des pages)
