# BACKLOG SPRINT 2 — Ganitel Backend

Date: 03 mars 2026  
Branche de référence: dev  
Priorisation validée: **(1) restes audit non réglés → (2) migration auth Supabase totale immédiate → (3) reste plateforme/data (R2, seed, ETL)**

---

## 1) Contexte et décisions figées

Ce backlog est construit sur:
- l'audit technique 2026,
- l'état actuel du code après le pre-sprint,
- vos arbitrages produits/techniques.

Décisions confirmées:
- **Migration auth vers Supabase = basculement total immédiat** (pas de phase hybride longue).
- **R2-only en production uniquement**.
- **MinIO accepté en local/staging**.
- Ordre de traitement strict: **audit restant d'abord**, puis **auth Supabase**, puis **reste**.

---

## 2) Objectifs du Sprint 2

### Objectif principal
Fermer les écarts critiques/élevés encore ouverts de l'audit pour stabiliser la plateforme avant le cutover auth Supabase.

### Résultats attendus en fin de sprint
- Plus de fuite d'information dans les erreurs API critiques.
- Webhook paiement durci cryptographiquement.
- Exposition publique des uploads traitée.
- Pipeline de déploiement staging accéléré (suppression du no-cache systématique).
- Base de tests renforcée sur les parcours critiques (au minimum smoke + cas négatifs sécurité).

---

## 3) Définition de Done (DoD) commune

Un ticket est considéré "Done" uniquement si:
1. Code mergé sur `dev` avec revue.
2. Tests automatisés associés écrits/mis à jour et passants.
3. Aucun secret/log sensible exposé dans les réponses API.
4. Documentation d'exploitation mise à jour si impact runtime/deploy.
5. Preuve de validation fournie (commande, capture CI, ou rapport script).

---

## 4) Backlog détaillé (priorité stricte)

## EPIC A — Restes audit non réglés (priorité absolue)

### A-01 (P0) — Éliminer les fuites `detail=str(e)` sur endpoints critiques
- **Pourquoi**: fuite d'informations internes (sécurité).
- **Scope**:
	- Remplacer les réponses d'erreur exposant `str(e)` par messages génériques.
	- Logger le détail côté serveur (`logger.exception`).
	- Commencer par endpoints sensibles: auth, paiements, admin, wallets, reviews, coupons.
- **Livrables**:
	- Refactor des handlers d'erreur.
	- Checklist des occurrences traitées.
- **Tests/Validation**:
	- Tests API: provoquer exceptions et vérifier payload générique.
	- Recherche statique: plus d'occurrence `detail=str(e)` dans endpoints cibles.
- **Estimation**: 5 pts
- **Dépendances**: aucune

### A-02 (P0) — Durcir la stratégie d'exception (frontière API)
- **Pourquoi**: cohérence d'erreur, traçabilité, moins de `except Exception` non maîtrisé.
- **Scope**:
	- Standardiser le pattern d'exception dans endpoints critiques.
	- Ne capturer large qu'aux frontières HTTP avec message neutre.
	- Conserver handlers globaux métier déjà en place.
- **Livrables**:
	- Pattern unique documenté (snippet de référence).
	- Application au top 8 endpoints les plus risqués.
- **Tests/Validation**:
	- Tests de non-régression des status codes (400/401/403/404/409/500).
- **Estimation**: 3 pts
- **Dépendances**: A-01

### A-03 (P0) — Sécuriser l'accès aux uploads (supprimer l'exposition publique brute)
- **Pourquoi**: aujourd'hui les fichiers peuvent être devinés/servis publiquement.
- **Scope**:
	- Retirer le mount statique direct en prod/staging.
	- Introduire un endpoint de téléchargement contrôlé (auth + règles d'accès).
	- Journaliser les accès refusés.
- **Livrables**:
	- Nouveau flux d'accès aux médias côté API.
	- Documentation de compatibilité frontend.
- **Tests/Validation**:
	- Test anonyme = 401/403.
	- Test utilisateur autorisé = 200.
	- Test chemin invalide = 400.
- **Estimation**: 5 pts
- **Dépendances**: A-01

### A-04 (P0) — Vérification webhook Tranzak via signature HMAC header-based
- **Pourquoi**: auth_key dans body non fiable cryptographiquement.
- **Scope**:
	- Lire le body brut de la requête.
	- Vérifier signature HMAC depuis header dédié (const-time compare).
	- Rejeter si signature absente/invalide.
	- Garder réponse webhook générique (pas de détail interne).
- **Livrables**:
	- Middleware ou utilitaire de vérification de signature.
	- Endpoint webhook durci.
- **Tests/Validation**:
	- Signature valide => traité.
	- Signature invalide/absente => rejet.
	- Payload altéré => rejet.
- **Estimation**: 5 pts
- **Dépendances**: A-01

### A-05 (P1) — Adapter pool DB par environnement
- **Pourquoi**: pool fixe non optimal local vs prod.
- **Scope**:
	- Policy pool_size/max_overflow par environnement.
	- Validation config au boot.
- **Livrables**:
	- Paramétrage dans settings + database engine.
- **Tests/Validation**:
	- Tests unitaires settings.
	- Vérification startup local/staging/prod.
- **Estimation**: 2 pts
- **Dépendances**: aucune

### A-06 (P1) — Supprimer le `--no-cache` systématique en staging
- **Pourquoi**: déploiements trop lents.
- **Scope**:
	- Script `deploy-staging.sh`.
	- Workflow GitHub staging build.
- **Livrables**:
	- Build caché par défaut + option force rebuild explicite.
- **Tests/Validation**:
	- Mesure temps de build avant/après.
- **Estimation**: 1 pt
- **Dépendances**: aucune

### A-07 (P1) — Renforcer tests E2E minimum sur flux critiques
- **Pourquoi**: répertoire e2e vide, manque couverture bout-en-bout.
- **Scope**:
	- Flux voyageur minimal.
	- Flux provider minimal.
	- Contrôle d'accès admin minimal.
- **Livrables**:
	- 3 scénarios e2e automatisés.
- **Tests/Validation**:
	- Exécution CI/staging.
- **Estimation**: 5 pts
- **Dépendances**: A-01 à A-04 stabilisés

### A-08 (P1) — Convertir tests use cases en vrais unit tests
- **Pourquoi**: certains tests unitaires sont de l'intégration déguisée.
- **Scope**:
	- Mocker repositories/services externes pour use cases auth/services.
- **Livrables**:
	- Suite unit dédiée, rapide, déterministe.
- **Tests/Validation**:
	- `pytest -m unit` fiable.
- **Estimation**: 3 pts
- **Dépendances**: aucune

### A-09 (P2) — Dette technique basse: timezone-aware datetimes + nettoyage code mort tests
- **Pourquoi**: conformité Python moderne + hygiene.
- **Scope**:
	- Remplacer `datetime.utcnow()` ciblé.
	- Retirer/archiver `test_base.py` inutilisé.
- **Livrables**:
	- Patch de modernisation faible risque.
- **Tests/Validation**:
	- Tests non-régression.
- **Estimation**: 2 pts
- **Dépendances**: aucune

---

## EPIC B — Auth Supabase (après fermeture P0 audit)

### B-01 (P0) — ADR et design cible auth Supabase total
- **Pourquoi**: figer architecture avant implémentation.
- **Scope**:
	- Supabase comme source de vérité auth.
	- Règles claims (sub, email, roles, iss, aud).
	- Politique de provisioning utilisateur local.
- **Livrables**:
	- ADR signé + schéma des flux.
- **Estimation**: 2 pts
- **Dépendances**: A-01..A-04

### B-02 (P0) — Validation JWT Supabase via JWKS
- **Scope**:
	- Récupération JWKS, cache, rotation clés.
	- Validation stricte issuer/audience/exp/nbf.
	- Rejet tokens non Supabase.
- **Livrables**:
	- Nouveau provider de dépendances auth.
- **Tests/Validation**:
	- Tests unitaires signature + claims.
- **Estimation**: 5 pts
- **Dépendances**: B-01

### B-03 (P0) — Remplacement dépendances auth backend
- **Scope**:
	- `get_current_user`, `get_current_admin`, optional user basés Supabase JWT.
	- Compatibilité contrôle de rôle.
- **Livrables**:
	- Dépendances unifiées Supabase.
- **Tests/Validation**:
	- Tests API authz/roles.
- **Estimation**: 5 pts
- **Dépendances**: B-02

### B-04 (P0) — Provisioning et linking utilisateur local
- **Scope**:
	- À la première requête valide: create/update user local via `sub` + email.
	- Éviter doublons (email/sub).
- **Livrables**:
	- Service de sync profil.
- **Tests/Validation**:
	- Cas nouveau user, user existant, collision email.
- **Estimation**: 5 pts
- **Dépendances**: B-03

### B-05 (P0) — Décommission auth legacy
- **Scope**:
	- Désactiver/retirer endpoints login/register/refresh/oauth backend legacy.
	- Maintenir uniquement endpoints nécessaires au domaine.
- **Livrables**:
	- API contract nettoyé.
- **Tests/Validation**:
	- Test de non-disponibilité endpoints legacy.
	- Frontend impact checklist.
- **Estimation**: 3 pts
- **Dépendances**: B-03, B-04

### B-06 (P1) — Migration rôles et backfill
- **Scope**:
	- Mapping `admin/provider/traveler` claims ↔ base locale.
	- Script backfill utilisateurs existants.
- **Estimation**: 3 pts
- **Dépendances**: B-04

### B-07 (P1) — Campagne de tests auth complète
- **Scope**:
	- Unit + integration + e2e auth.
	- Cas invalid token, expired, bad aud/iss, rôle insuffisant.
- **Estimation**: 3 pts
- **Dépendances**: B-05

---

## EPIC C — Plateforme/Data après audit + auth

### C-01 (P0) — Storage policy: R2 obligatoire en production
- **Pourquoi**: exigence produit/sécu.
- **Scope**:
	- Fail-fast en prod si `STORAGE_TYPE != r2`.
	- Local/staging: support MinIO explicite.
	- Standardiser config endpoints/credentials.
- **Livrables**:
	- Validation config + doc env.
- **Tests/Validation**:
	- Boot prod sans R2 => erreur bloquante.
	- Local/staging MinIO fonctionnels.
- **Estimation**: 3 pts
- **Dépendances**: B-05 recommandé

### C-02 (P1) — Solidifier seed reference data
- **Scope**:
	- Vérifier idempotence stricte.
	- Ajouter tests d'intégration seed (double run, soft-delete restore, ordering).
	- Rapport d'exécution standardisé.
- **Estimation**: 5 pts
- **Dépendances**: A stabilisé

### C-03 (P1) — Hardening ETL legacy pour prod
- **Scope**:
	- Checklist dry-run/apply.
	- Garde-fous integrity (FK, mapping, anomalies seuil).
	- Rapport exécution exploitable ops.
- **Estimation**: 8 pts
- **Dépendances**: C-02 conseillé

### C-04 (P1) — Runbooks d'exploitation
- **Scope**:
	- Runbook cutover auth Supabase.
	- Runbook seed prod.
	- Runbook ETL prod + rollback.
- **Estimation**: 2 pts
- **Dépendances**: B et C implémentés

---

## 5) Capacité et plan de lotissement proposé

Hypothèse capacité équipe backend: ~20 à 24 points / sprint.

### Sprint 2 (engagement ferme)
- A-01, A-02, A-03, A-04, A-06
- **Total cible**: 19 points

### Sprint 2 (stretch si marge)
- A-05, A-08
- **+5 points**

### Sprint 3 (prévision)
- A-07, A-09, B-01, B-02

### Sprint 4 (prévision)
- B-03, B-04, B-05, B-06, B-07

### Sprint 5 (prévision)
- C-01, C-02

### Sprint 6 (prévision)
- C-03, C-04

---

## 6) Dépendances critiques

1. **A-01/A-02 avant B-series**: éviter de migrer auth sur une base d'erreurs non maîtrisée.
2. **B-02 avant B-03**: validation JWT Supabase est le socle.
3. **B-04 avant B-05**: provisioning prêt avant extinction legacy.
4. **C-01 après B-05** conseillé pour limiter fronts de migration simultanés.

---

## 7) Risques et mitigation

### Risque R1 — Régression auth lors du cutover Supabase
- **Mitigation**: tests contract + e2e + runbook rollback + monitoring renforcé 48h.

### Risque R2 — Rupture d'accès fichiers après durcissement uploads
- **Mitigation**: endpoint d'accès contrôlé + test frontend de bout-en-bout + mapping URL migration.

### Risque R3 — Webhook paiement rejeté à tort
- **Mitigation**: phase shadow logging signatures + tests provider simulés + tolérance horodatage si requis.

### Risque R4 — ETL legacy non fiable en prod
- **Mitigation**: dry-run obligatoire, seuil anomalies bloquant, backup/restauration validés avant apply.

---

## 8) Critères de succès globaux

- 0 vulnérabilité critique/élevée restante sur périmètre audit traité dans Sprint 2.
- Plus d'exposition d'erreurs internes côté API sur endpoints critiques.
- Webhook paiement avec authentification cryptographique vérifiée.
- Build staging accéléré par suppression du no-cache systématique.
- Plan auth Supabase prêt à exécution avec tickets ordonnés, dépendances et runbook.

---

## 9) Suivi hebdomadaire recommandé

- **Lundi**: revalidation scope + risques + affectation tickets.
- **Mercredi**: point sécurité (A-01 à A-04), rapport tests intermédiaire.
- **Vendredi**: démo technique + écarts DoD + décisions sprint suivant.

---

## 10) Annexes opérationnelles

### Labels Jira/GitHub Projects recommandés
- `P0`, `P1`, `P2`
- `security`, `auth`, `payments`, `storage`, `tests`, `devops`, `migration`
- `audit-gap`, `supabase-cutover`, `prod-hardening`

### Règles de merge
- Pas de merge P0 sans tests associés.
- Pas de merge auth Supabase sans validation e2e minimale.
- Toute modif sécurité doit inclure preuve de test négatif.

