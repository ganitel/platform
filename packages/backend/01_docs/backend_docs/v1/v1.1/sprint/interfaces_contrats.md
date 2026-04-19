# INTERFACES & CONTRATS — Sprint 2 (Ganitel Backend)

Date: 03 mars 2026  
Objectif: établir une base commune d’implémentation pour éviter les divergences entre équipes (API, sécurité, auth, storage, tests, DevOps).

---

## 1) Contrat transversal d’erreur API (A-01, A-02)

## 1.1 Règle commune
- Aucun endpoint critique ne retourne `str(e)` au client.
- Les détails techniques vont uniquement dans les logs serveur (`logger.exception`).
- Réponse API standardisée pour erreurs non métier:

```json
{
  "detail": "<message neutre>",
  "error_code": "InternalServerError",
  "request_id": "<uuid>"
}
```

## 1.2 Contrat de mapping HTTP
- `ValidationError` → 400
- `AuthorizationError` / token invalide → 401
- accès rôle insuffisant → 403
- ressource absente → 404
- conflit métier → 409
- erreur inattendue → 500 (message neutre uniquement)

## 1.3 Accord de collaboration
- Chaque PR endpoint critique inclut au moins 1 test négatif vérifiant message neutre + présence `request_id` sur 500.

---

## 2) Contrat webhook Tranzak signé (A-04)

## 2.1 Interface d’entrée (HTTP)
- Endpoint: `POST /api/v1/payments/webhook/tranzak`
- Header obligatoire: `X-Tranzak-Signature` (HMAC SHA-256 hex ou base64, format à figer dans ADR ticket).
- Payload signé: **body brut exact** reçu (pas JSON re-serialisé).

## 2.2 Interface de vérification (code)

```python
from typing import Protocol

class WebhookSignatureVerifier(Protocol):
	def verify(self, raw_body: bytes, signature_header: str) -> bool:
		...
```

Règles:
- comparaison en temps constant (`hmac.compare_digest`)
- si header absent/invalide: rejet immédiat
- réponse webhook reste générique (pas de fuite interne)

## 2.3 Contrat de réponse webhook
- Toujours JSON stable:

```json
{ "success": true|false, "message": "Webhook processed|Webhook rejected" }
```

---

## 3) Contrat d’accès médias/upload (A-03, C-01)

## 3.1 Décision d’architecture
- Interdire l’exposition publique brute des fichiers locaux en staging/prod.
- Accès média via endpoint contrôlé (auth + autorisation métier).

## 3.2 Interface de service (code)

```python
from typing import Protocol

class MediaAccessService(Protocol):
	async def resolve_download(self, *, file_ref: str, requester_id: str) -> dict:
		"""Retourne soit un flux local, soit une URL signée, selon STORAGE_TYPE."""
```

Retour attendu:
- `{"mode": "stream", "path": "..."}` (local/minio)
- ou `{"mode": "redirect", "url": "...", "expires_in": 300}` (r2)

## 3.3 Contrat sécurité
- Anonyme: `401/403`
- chemin/référence invalide: `400`
- accès autorisé: `200`
- logs d’accès refusé obligatoires avec `request_id`, `user_id`, `file_ref`

---

## 4) Contrat d’authentification cible Supabase (B-01..B-05)

## 4.1 Interface de validation token

```python
from typing import Protocol, Any

class TokenValidator(Protocol):
	async def validate_access_token(self, token: str) -> dict[str, Any]:
		"""Valide signature + claims (iss, aud, exp, nbf) et retourne claims normalisés."""
```

Claims minimales normalisées:
- `sub` (obligatoire)
- `email` (fortement recommandé)
- `roles` (liste)
- `iss`, `aud`, `exp`, `nbf`

## 4.2 Interface de provisioning local

```python
from typing import Protocol, Any

class UserProvisioningService(Protocol):
	async def upsert_from_claims(self, claims: dict[str, Any]) -> dict[str, Any]:
		"""Create/update user local idempotent à partir des claims Supabase."""
```

Contraintes:
- unicité sur `sub` et email
- gestion explicite collisions email/sub
- idempotence stricte

## 4.3 Contrat dépendances FastAPI
- `get_current_user`, `get_current_admin`, `get_optional_current_user` restent les points d’entrée fonctionnels.
- Leur implémentation bascule de JWT local HS256 vers validation JWKS Supabase sans casser les endpoints métier.

---

## 5) Contrat configuration & environnements (A-05, C-01)

## 5.1 Pool DB par environnement
- `development`: petit pool
- `staging`: pool intermédiaire
- `production`: pool renforcé

Contrat:
- valeurs définies via settings, validées au boot
- échec de démarrage si combinaison invalide

## 5.2 Storage policy
- `production`: `STORAGE_TYPE` doit être `r2` (fail-fast)
- `development/staging`: `local|minio|r2` autorisés (selon config décidée)

## 5.3 Contrat DevOps staging
- Build cache activé par défaut
- Rebuild complet uniquement via option explicite (`--no-cache` flag opérateur)

---

## 6) Contrat de test minimum (A-07, A-08, B-07)

## 6.1 Unit
- Use cases testés avec mocks (pas de DB réelle) pour auth/services.

## 6.2 Integration/API
- Status codes non-régressifs: 400/401/403/404/409/500.
- Tests de non fuite de détails internes sur endpoints critiques.

## 6.3 E2E minimum
- 1 flux voyageur
- 1 flux provider
- 1 contrôle d’accès admin

## 6.4 Convention de preuve dans PR
- commande exécutée
- résultat (succès/échec)
- périmètre de tests couvert

---

## 7) Contrat de collaboration inter-équipes (DoR/DoD opérationnel)

## Definition of Ready (avant démarrage ticket)
- dépendances upstream marquées done dans `dependances.md`
- contrat d’interface du ticket validé (section concernée ci-dessus)
- stratégie de tests du ticket définie

## Definition of Done (complément à la DoD sprint)
- code + tests passants
- logs utiles sans fuite sensible
- doc impactée mise à jour
- preuve de validation jointe

---

## 8) Check-list de synchronisation par EPIC

- **EPIC A**: valider contrat erreur API + webhook + media access avant merge massif.
- **EPIC B**: publier ADR auth puis implémenter interfaces `TokenValidator` + `UserProvisioningService`.
- **EPIC C**: verrouiller policy storage prod et runbooks sur comportements déjà contractuels.
