# Backlog final (choix validés)

Ce document mappe chaque besoin/problème aux zones de code et propose un plan d’implémentation. Les options retenues par le client sont intégrées.

---

## 1) Modèle Property dédié + multi‑services (choix 1B)

### Constat
- Les listings sont des `Service` avec city/country en texte libre. Voir [app/domain/entities/service.py](app/domain/entities/service.py) et [app/infrastructure/repositories/service_repository.py](app/infrastructure/repositories/service_repository.py).

### Plan retenu
- Créer des entités dédiées `Property` pour l’hébergement, tout en gardant `Service` pour les autres verticales.
- Relier `Service` (accommodation) à `Property` via FK (ou 1‑1) pour éviter de dupliquer la logique multi‑services.

### Backlog
- [ ] Créer `Property` (entité + migration) et relations avec `Service`.
- [ ] Mettre à jour endpoints/schemas pour exposer `Property` sur les services d’hébergement.
- [ ] Adapter les recherches et filtres pour support property‑centric.

---

## 2) Localisation & PropertyTypes normalisés (choix 2B)

### Plan retenu
- Ajouter `Locations` et `PropertyTypes` normalisés avec FK depuis `Property`.
- Seed initial (Douala, Yaoundé, Buea, Limbe, Kribi) et types (Apartment, Duplex, Villa, Studio, Room).

### Backlog
- [ ] Ajouter entités + migrations (`Location`, `PropertyType`).
- [ ] Seed data V1.
- [ ] Adapter recherches, filtres, réponses API.

---

## 3) Amenities catégorisés (choix 3B)

### Constat
- Amenities sont des strings dans `Service`. Voir [app/domain/entities/service.py](app/domain/entities/service.py).
- `ServiceAmenity` est plat, sans catégories ni jointure. Voir [app/domain/entities/service_amenity.py](app/domain/entities/service_amenity.py).

### Plan retenu
- Créer `AmenityCategory`, `Amenity` (name_en/name_fr, icon_url) + jointure `PropertyAmenities`.
- Exposer API de listing des catégories + amenities.
- Migrer les amenities existantes vers la nouvelle structure.

### Backlog
- [ ] Entités + migrations + seed.
- [ ] Mise à jour des schémas API.
- [ ] Backfill des données.

---

## 4) Reviews détaillés (choix 4A)

### Constat
- `Review` est service‑level et manque des dimensions. Voir [app/domain/entities/review.py](app/domain/entities/review.py).
- `Service` a des agrégats sans recalcul fiable. Voir [app/domain/entities/service.py](app/domain/entities/service.py).

### Plan retenu
- Étendre `Review` existant (champs manquants) et ajouter `property_id` optionnel.
- Ajouter un service d’agrégation pour recalculer `average_rating` et `review_count`.

### Backlog
- [ ] Migration pour champs de notes.
- [ ] Recalcul automatique des agrégats sur create/update/delete.

---

## 5) Booking négociation + anti‑overlap (choix 5B)

### Constat
- Pas de `NEGOTIATING`, pas de `negotiated_price`. Voir [app/domain/entities/booking.py](app/domain/entities/booking.py).
- Overlap uniquement applicatif, pas de contrainte DB. Voir [app/infrastructure/repositories/booking_repository.py](app/infrastructure/repositories/booking_repository.py).

### Plan retenu
- Ajouter `NEGOTIATING` + `negotiated_price`.
- Contrainte DB d’exclusion pour overlaps.
- Wire negotiation → status booking.

### Backlog
- [ ] Migration + contraintes DB.
- [ ] Mise à jour use cases + tests.

---

## 6) Proximity (accessibilité)

### Plan retenu
- Ajouter entité `Proximity` et exposer dans l’API.

### Backlog
- [ ] Migration + repository + schemas.

---

## 7) Stockage images R2 (choix 6B)

### Constat
- Upload local disque, URL `/uploads`. Voir [app/infrastructure/services/upload_service.py](app/infrastructure/services/upload_service.py).

### Plan retenu
- Ajouter config R2 + client boto3 unique.
- Upload direct vers R2 + URL CDN.
- Delete via `delete_object`.

### Backlog
- [ ] Config + service R2.
- [ ] Tests d’intégration upload.

---

## 8) Tranzak conformité + sécurité (choix 7B)

### Constat
- Signature webhook TODO et flux non conforme. Voir [app/api/v1/endpoints/payments.py](app/api/v1/endpoints/payments.py) et [app/infrastructure/external_apis/tranzak_client.py](app/infrastructure/external_apis/tranzak_client.py).

### Plan retenu
- Refaire le flux complet (token, headers, mapping payload/response).
- Vérification signature webhook + idempotence.
- Tests de validation.

### Backlog
- [ ] Client Tranzak conforme.
- [ ] Idempotence webhooks/refunds.
- [ ] Tests.

---

## 9) Auth protection (rate limit + lockout + erreurs normalisées) (choix 8B)

### Constat
- Pas de rate‑limit ni lockout. Voir [app/api/v1/endpoints/auth.py](app/api/v1/endpoints/auth.py).

### Plan retenu
- Middleware rate‑limit Redis.
- Lockout après échecs répétés.
- Messages d’erreurs uniformes.

### Backlog
- [ ] Middleware + config.
- [ ] Tests.

---

## 10) Validation upload renforcée (choix 9B)

### Plan retenu
- MIME + extension allow‑list + taille max.
- Optionnel: sniffing type réel.

### Backlog
- [ ] Helpers + tests.

---

## 11) Observabilité (choix 10B)

### Plan retenu
- Request‑ID middleware.
- Logs JSON + corrélation.
- Metrics Prometheus/Otel.

### Backlog
- [ ] Middleware + logs.
- [ ] Metrics + tracing.

---

## 12) Money precision (choix 11B)

### Plan retenu
- Decimal partout, éventuellement minor units.

### Backlog
- [ ] Refactor + tests.

---

## 13) Tests sûrs & coverage (choix 12B)

### Plan retenu
- Blocage dur si TESTING != true.
- Gate destruction seulement en local.
- Factory d’app test centralisée (perf/security inclus).
- Nettoyage tables via metadata.

### Backlog
- [ ] Mise à jour conftest + markers.
- [ ] Refactor perf/security tests.

---

## 14) Makefile structuré

### Cibles retenues
Local:
- test-e2e
Staging:
- staging-build
- staging-test-all
Prod:
- prod-up

### Backlog
- [ ] Nouveau Makefile + aliases compat.
- [ ] Documenter prod compose.

---

## 15) Admin par défaut (choix 12B)

### Constat
- Admin créé au démarrage et endpoint ouvert. Voir [app/main.py](app/main.py) et [app/api/v1/endpoints/admin.py](app/api/v1/endpoints/admin.py).

### Plan retenu
- Retirer/garder sous garde stricte en local/staging.
- Remplacer endpoint ouvert par script sécurisé.

### Backlog
- [ ] Gate en lifespan.
- [ ] Script sécurisé.

---

# Priorisation (P0/P1)

## P0 (must‑have)
- Modèle Property dédié + Locations/PropertyTypes.
- Amenities catégorisés.
- Booking overlap DB + NEGOTIATING + negotiated_price.
- Tranzak conforme + signature + idempotence.
- R2 uploads.
- Auth protection (rate‑limit + lockout).
- Suppression/gate admin par défaut.

## P1 (high value)
- Observabilité (logs JSON, request‑id, metrics/tracing).
- Money precision (Decimal).
- Tests sûrs & coverage renforcée.

---

# Prochaine étape
- Validation du backlog P0/P1, puis découpage en tickets sprint (estimations + owners).