# DÉPENDANCES — Sprint 2 (Ganitel Backend)

Date: 03 mars 2026  
Base analysée: branche `dev` + backlog Sprint 2

## 1) Principes de dépendance retenus

- **Ordre macro imposé**: EPIC A (audit) → EPIC B (auth Supabase) → EPIC C (plateforme/data).
- **Règle sécurité**: aucun ticket auth Supabase (B-xx) ne démarre tant que les P0 audit critiques ne sont pas fermés (A-01..A-04).
- **Règle contrat**: chaque ticket qui expose un nouveau comportement (erreurs API, webhook, médias, auth) doit publier son contrat avant implémentation finale.

---

## 2) Dépendances explicites par ticket

## EPIC A — Restes audit

### A-01 — Éliminer les fuites `detail=str(e)`
- **Dépend de**: aucune.
- **Bloque**: A-02, A-03, A-04, A-07.
- **Justification code**: occurrences nombreuses sur endpoints critiques (`auth`, `wallets`, `reviews`, `coupons`, etc.).

### A-02 — Durcir stratégie d’exception API
- **Dépend de**: A-01.
- **Bloque**: A-07, B-01 (préparation architecture auth sur base d’erreurs stabilisée).
- **Justification code**: coexistence d’un handler global propre (`app/core/exception_handlers.py`) et de patterns endpoint hétérogènes.

### A-03 — Sécuriser accès uploads (suppression exposition publique brute)
- **Dépend de**: A-01 (messages d’erreur sûrs), A-02 (frontière HTTP standardisée).
- **Bloque**: A-07, C-01 (durcissement storage cohérent).
- **Justification code**: mount public direct `/uploads` dans `app/main.py` + endpoints upload actuellement orientés URL publique.

### A-04 — Webhook Tranzak HMAC header-based
- **Dépend de**: A-01, A-02.
- **Bloque**: A-07, B-01 (risque paiements critique à fermer avant migration auth), C-04 (runbooks stables).
- **Justification code**: endpoint actuel valide `auth_key` body (`app/api/v1/endpoints/payments.py`) sans signature header sur body brut.

### A-05 — Adapter pool DB par environnement
- **Dépend de**: aucune.
- **Bloque**: indirectement B-04/B-07/C-03 en charge (stabilité runtime).
- **Justification code**: pool fixe (`DATABASE_POOL_SIZE=20`, `DATABASE_MAX_OVERFLOW=30`) dans `app/config.py` et `app/database.py`.

### A-06 — Supprimer `--no-cache` staging systématique
- **Dépend de**: aucune.
- **Bloque**: aucun ticket métier, mais améliore cadence de livraison des A/B/C.
- **Justification code**: `scripts/deploy-staging.sh` exécute `build --no-cache app` en dur.

### A-07 — Renforcer tests E2E critiques
- **Dépend de**: A-01, A-02, A-03, A-04 (comportements à figer avant e2e).
- **Bloque**: B-05 (décommission auth legacy), C-04 (runbooks finalisés avec preuve e2e).

### A-08 — Convertir tests use cases en vrais unit tests
- **Dépend de**: aucune stricte (travail parallèle possible).
- **Bloque**: B-07 (campagne auth complète fiable/rapide).

### A-09 — Timezone-aware + nettoyage tests morts
- **Dépend de**: aucune.
- **Bloque**: aucun ticket critique.

---

## EPIC B — Auth Supabase

### B-01 — ADR/design cible Supabase
- **Dépend de**: A-01, A-02, A-03, A-04.
- **Bloque**: B-02..B-07.

### B-02 — Validation JWT Supabase via JWKS
- **Dépend de**: B-01.
- **Bloque**: B-03, B-07.
- **Note code**: dépendances auth actuelles sont HS256 local (`app/dependencies.py`) et doivent être remplacées proprement.

### B-03 — Remplacer dépendances auth backend
- **Dépend de**: B-02.
- **Bloque**: B-04, B-05, B-07, C-01.

### B-04 — Provisioning/linking user local
- **Dépend de**: B-03.
- **Bloque**: B-05, B-06.

### B-05 — Décommission auth legacy
- **Dépend de**: B-03, B-04, A-07 (au minimum e2e de couverture).
- **Bloque**: B-07, C-01, C-04.

### B-06 — Migration rôles + backfill
- **Dépend de**: B-04.
- **Bloque**: partiellement B-07.

### B-07 — Campagne tests auth complète
- **Dépend de**: B-02, B-05, A-08.
- **Bloque**: C-04 (runbook cutover validé par tests).

---

## EPIC C — Plateforme/Data

### C-01 — Policy storage: R2 obligatoire en prod
- **Dépend de**: B-05 (recommandé), A-03 (fortement recommandé).
- **Bloque**: C-04.
- **Note code**: `STORAGE_TYPE` existe déjà dans `app/config.py` + provider local/r2 dans `app/infrastructure/services/storage_provider.py`.

### C-02 — Solidifier seed reference data
- **Dépend de**: stabilisation EPIC A (au moins A-01/A-02).
- **Bloque**: C-03.

### C-03 — Hardening ETL legacy prod
- **Dépend de**: C-02 (conseillé), A-05 (stabilité DB utile).
- **Bloque**: C-04.

### C-04 — Runbooks exploitation
- **Dépend de**: B-07, C-01, C-03.
- **Bloque**: aucun (livrable terminal).

---

## 3) Graphe de dépendances (vue rapide)

- A-01 → A-02 → {A-03, A-04} → A-07
- {A-01, A-02, A-03, A-04} → B-01 → B-02 → B-03 → B-04 → B-05 → B-07
- B-04 → B-06
- A-08 → B-07
- B-05 → C-01
- C-02 → C-03 → C-04
- {B-07, C-01} → C-04

---

## 4) Exécution parallèle autorisée (sans conflit majeur)

- **Track sécurité**: A-01, puis A-02/A-03/A-04 (séquencé).
- **Track plateforme**: A-05 et A-06 en parallèle du track sécurité.
- **Track qualité**: A-08 en parallèle, puis A-07 après stabilisation sécurité.
- **Track auth Supabase**: commence strictement après clôture A-01..A-04.

---

## 5) Gating checks (bloquants de passage)

- **Gate G1 (fin A-P0)**: A-01..A-04 done + tests négatifs sécurité passants.
- **Gate G2 (entrée B-implémentation)**: ADR B-01 validé + contrat auth publié.
- **Gate G3 (extinction legacy)**: B-04 done + e2e auth minimum vert (A-07/B-07 partiel).
- **Gate G4 (entrée C-prod)**: B-05 done + policy storage C-01 validée en staging.

---

## 6) Points d’attention de couplage fort

- **A-03 ↔ C-01**: évolution du mode d’accès média doit rester compatible local/staging/prod.
- **A-04 ↔ B-series**: éviter changements simultanés non testés sur auth globale + paiements webhooks.
- **A-02 ↔ B-03**: dépendances auth futures doivent réutiliser le pattern d’exception unique API.
