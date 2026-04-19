# FE-SVC-001 — Aligner la couche services sur l'API backend `/services/*`

## Priorité
P0 (bloquant)

## Délai estimé
1.5d

## Dépendances
- FE-FIX-001

## Contexte (Audit)
L'audit révèle un problème structurel majeur : deux services coexistent pour les propriétés/services :
- `properties.service.ts` appelle `/properties/*` → **tous les endpoints retournent 404** (le backend utilise `/services/*`)
- `services.service.ts` appelle `/services/*` → **correctement aligné sur le backend** mais **aucun hook React Query ne le consomme**
- Les hooks `useProperties.ts` pointent tous vers `propertiesService` (cassé)
- Les pages importent directement `mockData.ts` et n'utilisent ni les hooks ni les services

## Tâches

### 1. Créer les hooks pour `servicesService`
- [ ] Créer `client/hooks/useServices.ts` avec les hooks React Query suivants :
  - `useSearchServices(filters)` → `servicesService.searchServices()`
  - `useServiceDetail(id)` → `servicesService.getServiceDetail()`
  - `useServiceReviews(serviceId)` → `servicesService.getServiceReviews()`
  - `useFeaturedServices()` → `servicesService.getFeaturedServices()`
- [ ] Configurer `staleTime`, `cacheTime`, et `enabled` pour chaque hook
- [ ] Exporter depuis `client/hooks/index.ts`

### 2. Déprécier/supprimer `propertiesService`
- [ ] Supprimer `client/services/properties.service.ts` (tous les endpoints sont faux)
- [ ] Supprimer `client/hooks/useProperties.ts` (pointe vers le service cassé)
- [ ] Mettre à jour les imports barrel dans `services/index.ts` et `hooks/index.ts`

### 3. Aligner les types partagés
- [ ] Dans `shared/api.ts`, consolider les types :
  - Garder `ServiceListItem` et `ServiceDetail` (alignés sur le backend `ServiceResponse`)
  - Mapper les champs imbriqués : `pricing.base_price`, `rating.average`, `capacity.max_guests`, `location.city`
  - Supprimer ou aliaser `PropertyListItem` → `ServiceListItem` pour la transition
- [ ] Ajouter les types `ServiceSearchFilters` alignés sur les query params du backend (`q`, `service_type`, `country`, `city`, `min_price`, `max_price`, `amenities`, `guests`, `check_in`, `check_out`, `sort`, `page`, `per_page`)
- [ ] Ajouter le type `ServiceSearchResponse` avec pagination

### 4. Créer un adapter/mapper
- [ ] Créer `client/lib/mappers.ts` avec :
  - `mapServiceToCard(service: ServiceListItem): CardProps` — transforme la réponse API en props pour `PropertyCard`
  - `mapServiceToDetail(service: ServiceDetail): DetailProps` — transforme pour la page détail
- [ ] Les composants UI peuvent garder leur interface actuelle (PropertyCard, etc.) mais les données sont mappées depuis les types `Service*`

## Critères d'acceptation
- [ ] Un seul service pour les propriétés/services (`servicesService`) correctement aligné
- [ ] Hooks React Query fonctionnels consommant `servicesService`
- [ ] Types cohérents dans `shared/api.ts` sans duplication
- [ ] `pnpm typecheck` passe sans erreur
- [ ] Tests unitaires pour les nouveaux hooks et le mapper

## Fichiers impactés
- `client/hooks/useServices.ts` (nouveau)
- `client/lib/mappers.ts` (nouveau)
- `client/services/properties.service.ts` (supprimé)
- `client/hooks/useProperties.ts` (supprimé)
- `client/services/index.ts`
- `client/hooks/index.ts`
- `shared/api.ts`
