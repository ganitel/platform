# ✅ Pre-Sprint Checklist — Ganitel Backend

Objectif: stabiliser une base **config + sécurité + exécution** avant de planifier les sprints fonctionnels.

---

## 1) Unification de la configuration (déjà identifié)

- [*] **Unifier `config.py` (dev/staging/test)**
	- **Problème :** paramètres incohérents entre environnements (debug, secrets, CORS, durées token), ce qui crée des comportements différents et des bugs difficiles à reproduire.
	- **Solution :** définir une matrice claire par environnement (development/staging/production/test), ajouter des validations fail-fast, et documenter les valeurs attendues.

- [x] **Aligner les conteneurs local/staging avec la même logique d’exécution**
	- **Problème :** staging et local ne tournent pas exactement de la même façon (workers, commandes, options), ce qui masque des problèmes de charge et de concurrence.
	- **Solution :** harmoniser les commandes de run (gunicorn/uvicorn worker class), variables d’env, healthchecks, et conventions réseau entre `docker-compose.local.yml` et `docker-compose.staging.yml`.

- [x] **Normaliser la configuration de test**
	- **Problème :** fallback SQLite et marquage de tests incomplet faussent la fiabilité des résultats.
	- **Solution :** imposer PostgreSQL pour les tests d’intégration, clarifier les marqueurs pytest (`unit`, `integration`, `e2e`), et verrouiller les garde-fous anti-prod.

---

## 2) Sécurité critique à corriger avant sprint

- [x] **Sécuriser/supprimer l’endpoint admin public (`create-default-admin`)**
	- **Problème :** endpoint HTTP public permettant la création d’admin + mot de passe renvoyé en réponse, avec risque d’escalade immédiate et compromission totale.
	- **Solution :** suppression de l’endpoint API, création admin via commande manuelle sécurisée; en parallèle, prévention des superpositions conteneurs par suppression de `container_name`, nom de projet unique par stack, isolation réseaux/volumes par projet, et standardisation d’exécution via Make.


- [x] **Bloquer l’auto-inscription publique en `admin`**
	- **Problème :** escalade de privilèges via `user_type=admin` à l’inscription.
	- **Solution :** restreindre les types autorisés en public (ex: traveler/provider uniquement) et forcer la création admin via processus interne contrôlé.

- [x] **Retirer les tokens OAuth des URLs**
	- **Problème :** fuite de JWT via historique navigateur, logs, referer, proxies.
	- **Solution :** implémenter un code temporaire (TTL court en Redis) échangé via POST sécurisé côté frontend.

- [x] **Supprimer les détails d’exception dans les redirections OAuth**
	- **Problème :** exposition d’informations internes au client.
	- **Solution :** renvoyer un code d’erreur générique côté client et logger le détail uniquement côté serveur.

- [x] **Valider le type de token JWT (`access` vs `refresh`)**
	- **Problème :** un refresh token peut être accepté sur des endpoints API protégés.
	- **Solution :** vérifier explicitement le claim `type == "access"` dans les dépendances d’authentification.

- [x] **Sanitiser les chemins d’upload (path traversal)**
	- **Problème :** possibilité d’écrire hors du dossier upload via `subdirectory` manipulé.
	- **Solution :** normaliser/valider le sous-répertoire (basename + allowlist), puis refuser toute valeur suspecte.

---

## 3) Fiabilité d’exécution et observabilité

- [x] **Ajouter un handler global d’exceptions métier**
	- **Problème :** gestion d’erreurs incohérente, duplication dans les endpoints, oublis fréquents.
	- **Solution :** centraliser via `app.exception_handler(...)` pour `GanitelException` + réponse API standardisée.

- [x] **Éliminer les réponses `detail=str(e)` dans les erreurs 500**
	- **Problème :** fuite d’informations internes (SQL, paths, stack details).
	- **Solution :** message générique côté API, `logger.exception(...)` côté serveur.

- [x] **Remplacer les `print()` critiques par du logging structuré**
	- **Problème :** logs non filtrables, pas de niveaux, données sensibles en stdout.
	- **Solution :** standardiser `logging.getLogger(__name__)`, niveaux (`info/warning/error`), format cohérent JSON ou key-value.

---

## 4) Gouvernance des secrets et configuration sûre

- [x] **Fail-fast sur `SECRET_KEY` par défaut hors dev**
	- **Problème :** tokens JWT forgeables si clé par défaut utilisée.
	- **Solution :** validation stricte au démarrage (staging/prod) et arrêt immédiat si valeur par défaut détectée.

- [x] **Fail-fast sur identifiants admin par défaut hors dev**
	- **Problème :** compte admin prédictible créé automatiquement.
	- **Solution :** interdire valeurs par défaut en non-dev + désactiver auto-création admin en staging/prod.

- [x] **Fail-fast sur secrets de paiement/OAuth placeholders**
	- **Problème :** connexions externes non fiables et risque de sécurité.
	- **Solution :** valider l’ensemble des secrets critiques au boot, avec message clair d’erreur de configuration.

- [x] **Réduire la durée de vie access token**
	- **Problème :** fenêtre d’exploitation trop longue en cas de vol (24h).
	- **Solution :** passer à 15-30 min et s’appuyer sur le refresh token HttpOnly pour renouvellement.

---

## 5) DevOps minimal pour éviter les blocages sprint

- [x] **Éviter les conflits de ports hôtes (local/staging simultanés)**
	- **Problème :** collisions de bind Docker (`5432`, `6379`, `8000`) quand plusieurs stacks coexistent sur la même machine.
	- **Solution :** exposer les ports hôtes via variables d'environnement dédiées (`APP_HOST_PORT`, `POSTGRES_HOST_PORT`, `REDIS_HOST_PORT`, etc.), garder les ports internes stables (`8000`, `5432`, `6379`), et appliquer une validation fail-fast sur plage/duplication de ports.

- [x] **Créer `docker-compose.prod.yml` minimal viable**
	- **Problème :** pas de référence de déploiement production testable.
	- **Solution :** définir service app avec gunicorn multi-workers, limites ressources, restart policy, variables production.

- [x] **Retirer les dépendances de test de l’image runtime**
	- **Problème :** image plus lourde + surface d’attaque élargie.
	- **Solution :** installer `requirements-test.txt` uniquement pour pipeline test, pas dans l’image de runtime.

- [x] **Ajouter un `.dockerignore`**
	- **Problème :** contexte de build trop gros (fichiers inutiles/sensibles).
	- **Solution :** exclure `.git`, caches, logs, dumps SQL, uploads, artefacts tests/IDE.

- [x] **Corriger le run staging mono-worker**
	- **Problème :** comportement de concurrence non représentatif.
	- **Solution :** utiliser `gunicorn` + `uvicorn.workers.UvicornWorker` + variable `WORKERS` effectivement appliquée.

---

## 6) Correctifs de cohérence applicative avant planification

- [x] **Corriger le double préfixe des routes `reference_data`**
	- **Problème :** routes potentiellement inaccessibles (`/api/v1/api/v1/...`).
	- **Solution :** garder un seul niveau de préfixe (router global ou endpoint local, pas les deux).

- [x] **Corriger la recherche de disponibilité (conflits de réservation ignorés)**
	- **Problème :** résultat métier faux sur un flux cœur produit.
	- **Solution :** ajouter vérification stricte des conflits temporels dans le use case/repository et couvrir par tests d’intégration.

---

## 7) Définition de “Done” pour ce pré-sprint

- [ ] Tous les services démarrent en local/staging avec configuration homogène et documentée.
- [ ] L’application échoue explicitement au boot en non-dev si un secret par défaut est détecté.
- [ ] Les endpoints critiques auth/admin ne présentent plus de faille d’escalade évidente.
- [ ] Les tests d’intégration s’exécutent uniquement contre PostgreSQL et sont marqués correctement.
- [ ] Une base de logs structurés existe sur les parcours critiques (auth, paiements, admin, erreurs globales).

