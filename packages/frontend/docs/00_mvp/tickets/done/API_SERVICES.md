# API Services Documentation

Ce document décrit les services API utilisés pour communiquer avec le backend Ganitel v1.

## Architecture

```
client/
├── lib/
│   ├── axios.ts              # Configuration axios + interceptors
│   ├── constants.ts          # Constantes globales
│   └── test-utils.ts         # Utilitaires de test
└── services/
    ├── index.ts              # Export principal
    ├── auth.service.ts       # Authentification
    ├── properties.service.ts # Propriétés
    ├── bookings.service.ts   # Réservations
    ├── negotiations.service.ts # Négociations
    ├── payments.service.ts   # Paiements
    ├── wishlists.service.ts  # Listes de souhaits
    └── *.spec.ts            # Tests unitaires
```

## Configuration Axios

Le fichier `client/lib/axios.ts` configure axios avec :

### Intercepteurs

1. **Request Interceptor** : Ajoute le token JWT aux headers `Authorization`
2. **Response Interceptor** : 
   - Gère les erreurs 401 (token expiré) avec refresh automatique
   - Transforme les erreurs en format standardisé `ApiError`
   - Redirige vers `/login` si le token refresh échoue

### Utilisation

```typescript
import { apiClient } from '@/lib/axios';

// Utiliser directement pour des requêtes personnalisées
const data = await apiClient.get('/custom-endpoint');
```

## Services API

### Auth Service

```typescript
import { authService } from '@/services';

// Signup
const authResponse = await authService.signup({
  email: 'user@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+33123456789',
});

// Login
const authResponse = await authService.login('user@example.com', 'password123');

// Logout
await authService.logout();

// Get current user
const user = await authService.getCurrentUser();

// Check if authenticated
if (authService.isAuthenticated()) {
  // User is logged in
}
```

### Properties Service

```typescript
import { propertiesService } from '@/services';

// Search properties
const results = await propertiesService.searchProperties({
  destination: 'Paris',
  check_in: '2024-01-01',
  check_out: '2024-01-05',
  guests: { adults: 2, children: 0, infants: 0 },
  price_max: 300,
});

// Get property details
const property = await propertiesService.getPropertyDetail('property-id');

// Get availability
const availability = await propertiesService.getPropertyAvailability(
  'property-id',
  '2024-01-01',
  '2024-01-31'
);

// Get reviews
const reviews = await propertiesService.getPropertyReviews('property-id', 1, 10);

// Get popular properties
const popular = await propertiesService.getPopularProperties(6);

// Get featured properties
const featured = await propertiesService.getFeaturedProperties(6);
```

### Bookings Service

```typescript
import { bookingsService } from '@/services';

// Create booking
const booking = await bookingsService.createBooking({
  property_id: 'property-id',
  check_in: '2024-01-01',
  check_out: '2024-01-05',
  guests: { adults: 2, children: 0, infants: 0 },
  traveler_info: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+33123456789',
  },
  message_to_host: 'Looking forward to staying here!',
});

// Get booking
const booking = await bookingsService.getBooking('booking-id');

// Get my bookings
const myBookings = await bookingsService.getMyBookings('confirmed');

// Cancel booking
const booking = await bookingsService.cancelBooking('booking-id', 'Change of plans');

// Calculate pricing
const pricing = await bookingsService.calculatePricing(
  'property-id',
  '2024-01-01',
  '2024-01-05',
  { adults: 2, children: 0, infants: 0 }
);
```

### Negotiations Service

```typescript
import { negotiationsService } from '@/services';

// Create negotiation
const negotiation = await negotiationsService.createNegotiation({
  property_id: 'property-id',
  check_in: '2024-01-01',
  check_out: '2024-01-05',
  guests: { adults: 2, children: 0, infants: 0 },
  proposed_price: 350,
  message: 'Can you reduce the price to 350?',
});

// Get negotiation
const negotiation = await negotiationsService.getNegotiation('negotiation-id');

// Get my negotiations
const myNegotiations = await negotiationsService.getMyNegotiations('pending');

// Accept counter-offer
const negotiation = await negotiationsService.acceptNegotiation('negotiation-id');

// Reject counter-offer
const negotiation = await negotiationsService.rejectNegotiation('negotiation-id');
```

### Payments Service

```typescript
import { paymentsService } from '@/services';

// Create payment intent
const intent = await paymentsService.createPaymentIntent(
  'booking-id',
  'payment-method-id'
);

// Confirm payment
const confirmed = await paymentsService.confirmPayment('payment-intent-id');

// Get payment methods
const methods = await paymentsService.getPaymentMethods();

// Add payment method
const newMethod = await paymentsService.addPaymentMethod({
  type: 'card',
  details: { /* credit card details */ },
});

// Delete payment method
await paymentsService.deletePaymentMethod('payment-method-id');
```

### Wishlists Service

```typescript
import { wishlistsService } from '@/services';

// Get all wishlists
const wishlists = await wishlistsService.getWishlists();

// Create wishlist
const wishlist = await wishlistsService.createWishlist(
  'My Favorites',
  'My favorite properties'
);

// Get wishlist
const wishlist = await wishlistsService.getWishlist('wishlist-id');

// Update wishlist
const updated = await wishlistsService.updateWishlist('wishlist-id', {
  name: 'Updated Name',
  description: 'Updated description',
});

// Delete wishlist
await wishlistsService.deleteWishlist('wishlist-id');

// Add property to wishlist
const updated = await wishlistsService.addPropertyToWishlist(
  'wishlist-id',
  'property-id'
);

// Remove property from wishlist
const updated = await wishlistsService.removePropertyFromWishlist(
  'wishlist-id',
  'property-id'
);

// Get default wishlist
const defaultWishlist = await wishlistsService.getDefaultWishlist();

// Toggle property in default wishlist
const result = await wishlistsService.togglePropertyInDefaultWishlist('property-id');
// result.is_favorited: true or false
```

## Gestion des Erreurs

Toutes les erreurs API sont transformées en format standardisé :

```typescript
interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}
```

### Utilisation

```typescript
try {
  await authService.login(email, password);
} catch (error) {
  const apiError = error as ApiError;
  console.error(`Error ${apiError.status}: ${apiError.message}`);
  
  if (apiError.errors) {
    // Handle validation errors
    Object.entries(apiError.errors).forEach(([field, messages]) => {
      console.error(`${field}: ${messages.join(', ')}`);
    });
  }
}
```

## Constantes

Les constantes sont définies dans `client/lib/constants.ts` :

```typescript
// Monnaies
CURRENCIES = {
  XOF: { symbol: 'FCFA', code: 'XOF', decimals: 0 },
  EUR: { symbol: '€', code: 'EUR', decimals: 2 },
  USD: { symbol: '$', code: 'USD', decimals: 2 },
};

// Types de propriétés
PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  // ...
];

// Commodités
AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  // ...
];

// Statuts
BOOKING_STATUS = { pending: 'Pending', confirmed: 'Confirmed', /* ... */ };
NEGOTIATION_STATUS = { pending: 'Pending', accepted: 'Accepted', /* ... */ };
PAYMENT_STATUS = { pending: 'Pending', processing: 'Processing', /* ... */ };
```

## Tests Unitaires

Les services incluent des tests unitaires avec vitest :

```bash
npm test  # Run all tests
```

Chaque service a un fichier `.spec.ts` avec des tests pour :
- Succès de l'opération
- Gestion des erreurs
- Validation des paramètres
- Mocking des appels API

## Variables d'Environnement

Configurez les variables dans `.env` :

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GOOGLE_MAPS_KEY=...
VITE_CDN_BASE_URL=https://cdn.ganitel.com
```

## Bonnes Pratiques

1. **Toujours utiliser les services** plutôt que `apiClient` directement
2. **Gérer les erreurs** en cas de requête API échouée
3. **Afficher les états de chargement** pendant les requêtes
4. **Valider les données** côté client avant l'envoi
5. **Utiliser des types TypeScript** pour la sécurité des types
6. **Tester les services** lors de l'ajout de nouvelles fonctionnalités

## Intégration avec React Query (FE-API-003)

Les services API seront intégrés avec React Query (TanStack Query) dans le ticket FE-API-003 pour :
- Cacher les réponses API
- Réutiliser les données
- Invalider automatiquement le cache
- Gérer les états de chargement et erreur
