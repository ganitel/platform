# FE-BOOK-001 — Flux de réservation et négociation connecté au backend

## Priorité
P1

## Délai estimé
2d

## Dépendances
- FE-INT-001 (pages connectées)
- FE-PAY-002 (paiement intégré)
- FE-GUARD-001 (routes protégées)

## Contexte (Audit)
Le flux réservation existe visuellement mais n'appelle aucune API :
- `BookOrNegotiate.tsx` — sélection dates/guests fonctionne via `BookingContext` local uniquement
- `TravelerInformation.tsx` — formulaire validé par Zod mais jamais envoyé
- `ReviewInformation.tsx` — résumé affiché mais `handleConfirm` ne fait rien de concret
- `Negotiation.tsx` — slider de négociation fonctionne localement, `handleSubmit` navigue sans API
- Les endpoints négociation (`/negotiations/*`) **n'existent pas encore** dans le backend actuel
- Le backend expose `POST /bookings`, `GET /bookings/{id}`, `GET /bookings/users/me/`, `PUT /bookings/{id}/cancel`

## Tâches

### 1. Création de booking (`POST /bookings`)
- [ ] Dans `ReviewInformation.tsx`, le bouton "Confirmer" doit :
  1. Construire le payload depuis `BookingContext` :
     ```typescript
     { service_id, start_date, end_date, guests: totalGuests, notes, total_amount, currency }
     ```
  2. Convertir `guests: { adults, children, infants }` → `guests: number` (total)
  3. Appeler `bookingsService.createBooking(payload)`
  4. Sur succès → stocker `booking_id` dans le contexte → passer au paiement
  5. Sur erreur → afficher toast (dates indisponibles, service inactif, etc.)

### 2. Mes réservations
- [ ] Créer la page `client/pages/MyBookings.tsx`
- [ ] Appeler `GET /bookings/users/me/` via `useMyBookings()`
- [ ] Afficher la liste avec statuts : `pending`, `confirmed`, `cancelled`, `completed`
- [ ] Action "Annuler" → `PUT /bookings/{id}/cancel` avec confirmation dialog
- [ ] Ajouter la route `/my-bookings` dans `App.tsx` (protégée)
- [ ] Ajouter le lien dans le `BottomNav` ou le menu profil

### 3. Négociation (stubbed)
- [ ] Le backend n'a pas encore d'endpoints `/negotiations/*`
- [ ] Implémenter en mode stub :
  - `Negotiation.tsx` → appel à `negotiationsService.createNegotiation()` (retournera 404 si backend pas prêt)
  - Fallback : enregistrer la négociation dans `BookingContext.notes` comme "Proposed price: X XAF"
  - Afficher un message "Votre proposition a été envoyée" même en mode stub
- [ ] Quand le backend V1 ajoutera le statut `NEGOTIATING` et `negotiated_price`, l'intégration sera minimale

### 4. Corriger les données hardcodées
- [ ] `BookOrNegotiate.tsx` — supprimer le fallback property depuis `location.state`, utiliser le `BookingContext.propertyData` ou charger depuis l'API
- [ ] `Negotiation.tsx` — supprimer les fallbacks hardcodés (`totalPrice=240`, `nights=7`, `checkIn="Wed, 23 July"`)
- [ ] `PaymentProgress.tsx` — supprimer "7 nights" et "$240" hardcodés
- [ ] `PaymentSuccess.tsx` — supprimer "M. Jacques Zeh", "+237 6 59 47 80 87"
- [ ] `PaymentMethod.tsx` — supprimer `"Jul 30, 2025"` hardcodé

### 5. Validation formulaire
- [ ] `TravelerInformation.tsx` — ajouter validation Zod complète :
  - Email format
  - Téléphone format (supporter +237 par défaut)
  - Nom/prénom requis (min 2 chars)
- [ ] Corriger les clés dupliquées dans le `<select>` des codes pays (React warnings)
- [ ] Afficher les erreurs inline sous chaque champ

## Critères d'acceptation
- [ ] Création de booking fonctionnelle via `POST /bookings`
- [ ] Page "Mes réservations" liste les bookings réelles de l'utilisateur
- [ ] Annulation de booking fonctionne avec confirmation
- [ ] Aucune donnée hardcodée dans le flux booking
- [ ] Négociation fonctionne en mode stub et est prête pour le backend V1
- [ ] Validation Zod active sur tous les formulaires
- [ ] Gestion d'erreurs avec toasts sur chaque étape

## Fichiers impactés
- `client/pages/ReviewInformation.tsx`
- `client/pages/BookOrNegotiate.tsx`
- `client/pages/TravelerInformation.tsx`
- `client/pages/Negotiation.tsx`
- `client/pages/MyBookings.tsx` (nouveau)
- `client/contexts/BookingContext.tsx`
- `client/App.tsx` (route /my-bookings)
- `client/components/BottomNav.tsx` (lien mes réservations)
