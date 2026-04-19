# FE-PAY-002 — Intégration paiement Tranzak (flux réel)

## Priorité
P0

## Délai estimé
2d

## Dépendances
- FE-INT-001 (pages connectées aux données réelles)
- FE-GUARD-001 (routes protégées)
- FE-AUTH-002 (session auth)

## Contexte (Audit)
Le flux paiement est actuellement **100% factice** :
- `PaymentProgress.tsx` affiche un spinner 3s puis redirige vers `PaymentSuccess` sans appel API
- `PaymentMethod.tsx` collecte les infos de paiement mais ne les envoie pas
- `PaymentSuccess.tsx` affiche des données hardcodées ("M. Jacques Zeh", "$240", "7 nights")
- Le backend expose `POST /payments/initiate` qui retourne `{ payment_id, transaction_id, payment_url, amount, currency, status }`
- L'utilisateur doit être redirigé vers `payment_url` (Tranzak) puis revenir sur l'app
- Le V1 prévoit un changement vers token auth Tranzak + `requestId` + `paymentAuthUrl`

## Tâches

### 1. Flux de paiement (`POST /payments/initiate`)
- [ ] Depuis `ReviewInformation.tsx`, le bouton "Confirmer et payer" doit :
  1. Créer la booking (`POST /bookings`) avec les données du `BookingContext`
  2. Initier le paiement (`POST /payments/initiate` avec `{ booking_id, amount, currency, provider: "tranzak" | "mobile_money" }`)
  3. Recevoir `PaymentInitiateResponse` avec `payment_url`
  4. Rediriger vers `payment_url` (page Tranzak externe)
- [ ] Gérer les erreurs : booking déjà existante, montant invalide, service Tranzak indisponible

### 2. Retour de paiement
- [ ] Créer une route `/booking/payment-callback` pour gérer le retour depuis Tranzak
- [ ] Récupérer le `payment_id` ou `transaction_id` depuis les query params
- [ ] Appeler `GET /payments/{payment_id}` pour vérifier le statut
- [ ] Selon le statut :
  - `completed` → rediriger vers `PaymentSuccess` avec les vraies données
  - `pending` → afficher `PaymentProgress` avec polling
  - `failed` → afficher un message d'erreur avec bouton retry

### 3. Polling de statut (`PaymentProgress.tsx`)
- [ ] Remplacer le fake timer 3s par un polling `GET /payments/{payment_id}` toutes les 3s
- [ ] Timeout après 2 minutes → afficher "Paiement en attente, vérifiez votre email"
- [ ] Afficher les vrais détails de la réservation (pas de hardcoded)

### 4. Page succès (`PaymentSuccess.tsx`)
- [ ] Afficher les données réelles de la booking (dates, propriété, montant, devises)
- [ ] Supprimer les fallbacks hardcodés ("M. Jacques Zeh", "+237 6 59 47 80 87")
- [ ] Afficher le `transaction_id` comme référence de paiement
- [ ] Utiliser la devise correcte au lieu de `$` hardcodé

### 5. PaymentMethod.tsx
- [ ] Connecter les méthodes de paiement aux providers backend : `tranzak`, `mobile_money`, `card`
- [ ] Supprimer la date d'annulation hardcodée `"Jul 30, 2025"`
- [ ] Valider que la méthode sélectionnée est supportée avant d'avancer

### 6. Gestion d'erreur paiement
- [ ] Créer un composant `PaymentError.tsx` réutilisable :
  - Message d'erreur clair
  - Bouton "Réessayer"
  - Bouton "Choisir une autre méthode"
  - Lien vers le support
- [ ] Gérer le cas d'un paiement double (idempotency via `booking_id`)

## Critères d'acceptation
- [ ] Le paiement Tranzak fonctionne de bout en bout : initiation → redirect → callback → confirmation
- [ ] Le polling affiche correctement le statut en temps réel
- [ ] Les erreurs de paiement sont gérées avec retry possible
- [ ] PaymentSuccess affiche les données réelles de la réservation
- [ ] Aucun montant, date ou nom hardcodé
- [ ] Mode stub configurable si Tranzak n'est pas accessible (`VITE_PAYMENT_MOCK=true`)

## Fichiers impactés
- `client/pages/ReviewInformation.tsx` (bouton payer → API)
- `client/pages/PaymentMethod.tsx` (méthodes réelles)
- `client/pages/PaymentProgress.tsx` (polling)
- `client/pages/PaymentSuccess.tsx` (données réelles)
- `client/pages/PaymentCallback.tsx` (nouveau)
- `client/components/PaymentError.tsx` (nouveau)
- `client/services/payments.service.ts` (vérifier alignement)
- `client/hooks/usePayment.ts` (nouveau — hooks React Query pour paiement)
- `client/App.tsx` (nouvelle route callback)
