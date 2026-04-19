# Ganitel Frontend MVP — Backlog

## Sprint Goal
Livrer un MVP fonctionnel permettant aux utilisateurs de rechercher des propriétés, consulter les détails, faire des demandes de négociation, et effectuer des réservations avec paiement intégré.

## Scope
- API Ganitel v1 (propriétés, réservations, négociations, paiements)
- UI en français et en anglais 
- Authentification basique (inscription/connexion)
- Recherche de propriétés avec filtres
- Système de wishlist
- Processus de réservation complet
- Négociation de prix

## Definitions
### Definition of Ready
- Spécifications claires et validées
- Contrat API confirmé
- Maquettes/wireframes disponibles
- Dépendances identifiées et documentées

### Definition of Done
- Feature fonctionnelle en développement local
- Gestion des erreurs API (400/401/404/500)
- États de chargement, vides et erreurs implémentés
- Tests unitaires minimaux passants
- Code review effectuée
- QA rapide validée

---

## EPIC 1 — API & Types Fondamentaux

### FE-API-001 — Créer types base (Property, Booking, Negotiation, Payment, User)
**Priority:** P0  
**Estimate:** 1.5d  
**Owner:** FE  
**Description:**
- Définir interfaces TypeScript pour Property, PropertyDetails, Booking, Negotiation, Payment, User
- Créer types de pagination et de réponses API standardisées
- Définir types pour filtres et recherche

**Acceptance Criteria:**
- Types compilent sans erreurs TypeScript
- Types exportés et réutilisables dans tout le projet
- Documentation inline des propriétés importantes

### FE-API-002 — Créer services API (properties, bookings, negotiations, payments, auth)
**Priority:** P0  
**Estimate:** 2d  
**Owner:** FE  
**Description:**
- Implémenter services HTTP pour properties, bookings, negotiations, payments
- Service d'authentification (login, signup, logout, refresh token)
- Gestion centralisée des erreurs et intercepteurs axios
- Configuration des headers et tokens

**Acceptance Criteria:**
- Tous les endpoints principaux implémentés
- Gestion erreurs 400/401/404/500 centralisée
- Retry logic pour erreurs réseau
- Tests unitaires des services

### FE-API-003 — Créer hooks React Query (useProperties, useBooking, useNegotiation, useAuth)
**Priority:** P0  
**Estimate:** 1.5d  
**Owner:** FE  
**Description:**
- Hooks React Query pour propriétés (search, details, filters)
- Hooks pour réservations (create, get, cancel)
- Hooks pour négociations (send request, get status)
- Hooks d'authentification et gestion du user state

**Acceptance Criteria:**
- Hooks fonctionnels avec cache React Query
- Configuration optimale du staleTime et cacheTime
- Invalidation de cache appropriée
- Loading et error states gérés

---

## EPIC 2 — Pages Utilisateur Core

### FE-UI-001 — Page Accueil (Index)
**Priority:** P0  
**Estimate:** 2d  
**Description:**
- Hero section avec SearchBar intégrée
- Sections "Propriétés populaires", "Destinations tendances"
- Bannière promotionnelle
- Footer avec liens utiles

**Acceptance Criteria:**
- Appels API pour propriétés populaires
- SearchBar fonctionnelle avec redirection vers résultats
- États loading/empty/error visibles
- Responsive mobile/tablet/desktop

### FE-UI-002 — Page Recherche & Résultats
**Priority:** P0  
**Estimate:** 2.5d  
**Description:**
- Barre de recherche avec filtres (dates, voyageurs, prix, équipements)
- Grille de PropertyCard avec pagination
- Tri (popularité, prix, note)
- Filtres avancés (type de propriété, règles, accessibilité)

**Acceptance Criteria:**
- API /properties/search avec paramètres de filtrage
- Pagination fonctionnelle
- Filtres appliqués dynamiquement
- URL sync avec paramètres de recherche

### FE-UI-003 — Page Détails Propriété (PropertyDetails)
**Priority:** P0  
**Estimate:** 3d  
**Description:**
- PropertyImageGallery avec lightbox
- PropertyInfo (titre, localisation, hôte, prix)
- PropertyDescription + PropertyAmenities
- ReviewsSection avec pagination
- Neighborhood + carte
- HouseRules + PropertyAccessibility
- CTA "Réserver" ou "Négocier"
- SimilarProperties

**Acceptance Criteria:**
- API /properties/{id} pour détails complets
- Tous les sous-composants intégrés
- Wishlist toggle fonctionnel
- Redirection vers réservation ou négociation

### FE-UI-004 — Page Inscription/Connexion (SignUp)
**Priority:** P0  
**Estimate:** 1.5d  
**Description:**
- Formulaire inscription (email, mot de passe, nom, prénom)
- Formulaire connexion
- Validation Zod
- Gestion des erreurs serveur
- Redirection post-connexion

**Acceptance Criteria:**
- API /auth/signup et /auth/login
- Validation côté client avec messages clairs
- Stockage sécurisé du token (localStorage ou httpOnly cookie)
- Redirection intelligente après login

---

## EPIC 3 — Processus de Réservation

### FE-BOOK-001 — Page "Réserver ou Négocier" (BookOrNegotiate)
**Priority:** P0  
**Estimate:** 1d  
**Description:**
- Choix entre réservation directe ou demande de négociation
- Résumé de la propriété
- Dates et nombre de voyageurs

**Acceptance Criteria:**
- Redirection vers TravelerInformation ou Negotiation
- Données persistées entre les pages

### FE-BOOK-002 — Page Informations Voyageur (TravelerInformation)
**Priority:** P0  
**Estimate:** 1.5d  
**Description:**
- Formulaire informations voyageurs (nom, prénom, email, téléphone)
- Validation Zod
- Message au propriétaire (optionnel)
- Redirection vers ReviewInformation

**Acceptance Criteria:**
- Formulaire validé avant soumission
- Données sauvegardées en contexte ou state global
- Navigation vers l'étape suivante

### FE-BOOK-003 — Page Révision Informations (ReviewInformation)
**Priority:** P0  
**Estimate:** 1.5d  
**Description:**
- Récapitulatif de la réservation (propriété, dates, voyageurs, prix total)
- Modification possible des étapes précédentes
- CTA "Continuer vers le paiement"

**Acceptance Criteria:**
- Toutes les informations affichées correctement
- Navigation retour vers étapes précédentes
- Calcul du prix total (nuits × prix + frais de service)

### FE-BOOK-004 — Page Méthode de Paiement (PaymentMethod)
**Priority:** P0  
**Estimate:** 2d  
**Description:**
- Sélection méthode de paiement (carte, mobile money, virement)
- Intégration Stripe/PayPal ou provider local
- Validation des informations de paiement
- Création de la réservation en backend

**Acceptance Criteria:**
- API /bookings avec création de transaction
- Intégration provider de paiement sécurisée
- Gestion des erreurs de paiement

### FE-BOOK-005 — Page Paiement en Cours (PaymentProgress)
**Priority:** P0  
**Estimate:** 0.5d  
**Description:**
- Écran de chargement pendant le traitement du paiement
- Animation ou spinner
- Messages de statut

**Acceptance Criteria:**
- Affichage pendant le traitement
- Timeout géré (redirection après échec)

### FE-BOOK-006 — Page Succès Paiement (PaymentSuccess)
**Priority:** P0  
**Estimate:** 1d  
**Description:**
- Confirmation de réservation
- Numéro de réservation
- Email de confirmation envoyé
- CTA vers "Mes Réservations" ou retour à l'accueil

**Acceptance Criteria:**
- Affichage des détails de réservation
- Email de confirmation (backend)
- Options de navigation claires

---

## EPIC 4 — Négociation

### FE-NEG-001 — Page Négociation (Negotiation)
**Priority:** P1  
**Estimate:** 2d  
**Description:**
- Formulaire de demande de négociation (dates, budget proposé, message)
- Validation des champs
- Soumission de la demande
- Redirection vers RequestSent

**Acceptance Criteria:**
- API /negotiations/requests
- Validation des données
- Gestion des erreurs (propriété non disponible, budget irréaliste)

### FE-NEG-002 — Page Demande Envoyée (RequestSent)
**Priority:** P1  
**Estimate:** 0.5d  
**Description:**
- Confirmation d'envoi de la demande
- Message explicatif (délai de réponse, prochaines étapes)
- CTA vers accueil ou mes demandes

**Acceptance Criteria:**
- Message clair affiché
- Options de navigation

---

## EPIC 5 — Wishlist & Favoris

### FE-WISH-001 — Contexte Wishlist (WishlistContext)
**Priority:** P1  
**Estimate:** 1d  
**Description:**
- Context React pour gérer wishlist globale
- Actions add/remove property
- Persistance en localStorage
- Sync avec backend (si connecté)

**Acceptance Criteria:**
- Context accessible dans toute l'app
- Sync avec API /users/wishlist
- Persistance locale même déconnecté

### FE-WISH-002 — Page Ma Wishlist (MyWishlist)
**Priority:** P1  
**Estimate:** 1d  
**Description:**
- Affichage des propriétés favorites
- Suppression de propriétés
- Navigation vers détails

**Acceptance Criteria:**
- Liste des propriétés affichée
- Action de suppression fonctionnelle
- État vide géré ("Aucune propriété favorite")


---

## EPIC 6 — Composants Réutilisables

### FE-CMP-001 — PropertyCard
**Priority:** P0  
**Estimate:** 0.5d  
**Description:**
- Carte propriété (image, titre, prix, note, localisation)
- Wishlist toggle icon
- Hover effects

**Acceptance Criteria:**
- Responsive
- Wishlist toggle fonctionnel

### FE-CMP-002 — PropertyImageGallery
**Priority:** P0  
**Estimate:** 1d  
**Description:**
- Galerie d'images avec thumbnails
- Lightbox/modal plein écran
- Navigation entre images

**Acceptance Criteria:**
- Lightbox accessible
- Navigation clavier et touch

### FE-CMP-003 — SearchBar
**Priority:** P0  
**Estimate:** 1d  
**Description:**
- Input recherche (destination, dates, voyageurs)
- DatePicker pour check-in/out
- Dropdown pour nombre de voyageurs
- Soumission vers page de recherche

**Acceptance Criteria:**
- Validation des dates
- Redirection avec paramètres

### FE-CMP-004 — ReviewsSection
**Priority:** P1  
**Estimate:** 1d  
**Description:**
- Liste des avis clients
- Note globale + répartition
- Pagination
- Filtre par note

**Acceptance Criteria:**
- API /properties/{id}/reviews
- Pagination fonctionnelle

### FE-CMP-005 — BookingFooter
**Priority:** P0  
**Estimate:** 0.5d  
**Description:**
- Footer sticky avec prix et CTA réservation
- Affichage mobile optimisé

**Acceptance Criteria:**
- Sticky sur scroll
- Responsive

---

## EPIC 7 — Navigation & Layout

### FE-NAV-001 — Header
**Priority:** P0  
**Estimate:** 1d  
**Description:**
- Logo Ganitel
- SearchBar intégrée
- Menu utilisateur (connexion/profil)
- Wishlist icon avec badge
- Navigation responsive

**Acceptance Criteria:**
- Menu mobile hamburger
- Dropdown user menu
- Wishlist badge count

### FE-NAV-002 — Footer
**Priority:** P1  
**Estimate:** 0.5d  
**Description:**
- Liens utiles (À propos, Contact, CGU, Politique de confidentialité)
- Réseaux sociaux
- Copyright

**Acceptance Criteria:**
- Tous les liens fonctionnels
- Responsive

### FE-NAV-003 — BottomNav (mobile)
**Priority:** P1  
**Estimate:** 0.5d  
**Description:**
- Navigation mobile sticky bottom
- Icônes (Accueil, Recherche, Wishlist, Profil)

**Acceptance Criteria:**
- Navigation fonctionnelle
- Active state

---

## EPIC 8 — Tests & QA

### FE-TST-001 — Tests unitaires composants
**Priority:** P1  
**Estimate:** 2d  
**Description:**
- Tests Vitest pour composants clés
- Tests hooks personnalisés
- Tests services API (mocks)

**Acceptance Criteria:**
- Couverture > 60%
- Tous les tests passent

### FE-TST-002 — Tests E2E critiques
**Priority:** P1  
**Estimate:** 2d  
**Description:**
- Playwright/Cypress E2E
- Parcours: Recherche → Détails → Réservation → Paiement
- Parcours: Wishlist add/remove
- Parcours: Négociation

**Acceptance Criteria:**
- 3 parcours principaux couverts
- Tests passent en CI/CD

---

## EPIC 9 — Optimisation & Polish

### FE-OPT-001 — SEO & Meta tags
**Priority:** P2  
**Estimate:** 1d  
**Description:**
- Meta tags dynamiques par page
- Open Graph tags
- Sitemap

**Acceptance Criteria:**
- Meta tags sur pages principales
- Preview social media OK

### FE-OPT-002 — Performance & Loading
**Priority:** P2  
**Estimate:** 1d  
**Description:**
- Lazy loading images
- Code splitting
- Skeleton loaders
- Optimisation bundle

**Acceptance Criteria:**
- Lighthouse score > 85
- First Contentful Paint < 2s

### FE-OPT-003 — Accessibilité (a11y)
**Priority:** P2  
**Estimate:** 1d  
**Description:**
- ARIA labels
- Navigation clavier
- Contraste couleurs
- Screen reader friendly

**Acceptance Criteria:**
- WAVE scan sans erreurs critiques
- Navigation clavier complète

---

## Milestones

- **M1: Fondations (Semaine 1-2)**  
  API, Types, Hooks, Services prêts

- **M2: Pages Core (Semaine 3-4)**  
  Accueil, Recherche, Détails propriété fonctionnels

- **M3: Réservation (Semaine 5-6)**  
  Parcours réservation complet avec paiement

- **M4: Features Secondaires (Semaine 7)**  
  Wishlist, Négociation, Reviews

- **M5: Polish & Launch (Semaine 8)**  
  Tests, optimisations, déploiement

---

## Risks & Dependencies

### Risques
- **Intégration paiement**: Complexité provider (Mobile Money/Mastercard)
- **Performance**: Chargement images propriétés (CDN requis)
- **Authentification**: Gestion tokens et refresh
- **Disponibilité API**: Stabilité et latence backend

### Dépendances externes
- Backend API Ganitel v1 (endpoints confirmés)
- Provider de paiement (credentials et sandbox)
- Service d'email (confirmations)
- CDN pour images (BunnyCDN/Cloudinary)
- Maps API (Google Maps/Mapbox) pour localisation

### Mitigation
- Mocks API pour développement parallèle
- Environnement de staging pour tests d'intégration
- Feature flags pour fonctionnalités en cours
- Monitoring erreurs (Sentry)

---

## Notes Importantes

- **MVP = Focus sur parcours utilisateur principal**: recherche → détails → réservation
- **Authentification simple**: email/password (OAuth v2)
- **Paiement**: une méthode minimum pour MVP (Mastercard)
- **UI anglaise uniquement**: i18n en v2
- **Admin panel**: hors scope MVP (v2)
- **Notifications**: email uniquement pour MVP (push v2)

---

## Prochaines Étapes (Post-MVP v2)

- Espace hôte (gestion annonces)
- Messagerie intégrée hôte/voyageur
- Système de reviews bidirectionnel
- Multi-langue (FR, ES, ...)
- Application mobile (React Native)
- Programme de fidélité
- Assurance voyage
