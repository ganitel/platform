# Contracts & Interfaces — Ganitel Frontend MVP (API v1)

Objectif : figer les contrats de données, signatures de services, et interfaces de composants/hooks pour permettre le développement en parallèle.

---

## 1) Types de base (v1)

### Pagination
```ts
export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

### Coordonnées géographiques
```ts
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  zipCode?: string;
}
```

### Disponibilité
```ts
export interface Availability {
  date: string; // ISO 8601
  available: boolean;
  price?: number;
}

export interface DateRange {
  checkIn: string; // ISO 8601
  checkOut: string; // ISO 8601
}
```

---

## 2) Modèles principaux

### Property (liste)
```ts
export interface PropertyListItem {
  id: string;
  title: string;
  description: string;
  type: 'apartment' | 'house' | 'villa' | 'studio' | 'loft' | 'other';
  location: Location;
  price_per_night: number;
  currency: 'XOF' | 'EUR' | 'USD';
  rating: number; // 0-5
  review_count: number;
  main_image_url: string;
  images_count: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[]; // IDs ou slugs
  is_instant_book: boolean;
  is_favorited?: boolean; // côté client
  host: {
    id: string;
    name: string;
    avatar_url?: string;
    is_superhost: boolean;
  };
}
```

### PropertyDetail
```ts
export interface PropertyDetail extends PropertyListItem {
  images: PropertyImage[];
  full_description: string;
  house_rules: HouseRule[];
  cancellation_policy: 'flexible' | 'moderate' | 'strict';
  check_in_time: string; // "14:00"
  check_out_time: string; // "11:00"
  minimum_stay_nights: number;
  maximum_stay_nights?: number;
  accessibility_features: string[];
  nearby_places: NearbyPlace[];
  availability_calendar: Availability[]; // 90 jours
  reviews: Review[];
  similar_properties?: PropertyListItem[];
  accompanied_services?: AccompaniedService[];
}

export interface PropertyImage {
  id: string;
  url: string;
  thumbnail_url: string;
  alt?: string;
  order: number;
}

export interface HouseRule {
  id: string;
  icon?: string;
  title: string;
  description?: string;
}

export interface NearbyPlace {
  name: string;
  type: 'restaurant' | 'attraction' | 'transport' | 'shop' | 'hospital' | 'other';
  distance_km: number;
}

export interface AccompaniedService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  icon?: string;
}
```

### Review
```ts
export interface Review {
  id: string;
  property_id: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  rating: number; // 1-5
  comment: string;
  created_at: string; // ISO 8601
  helpful_count: number;
  response?: {
    text: string;
    created_at: string;
  };
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  categories?: {
    cleanliness: number;
    accuracy: number;
    communication: number;
    location: number;
    check_in: number;
    value: number;
  };
}
```

### User
```ts
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_host: boolean;
  is_superhost: boolean;
  member_since: string; // ISO 8601
  bio?: string;
  language: string;
  currency: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
}
```

### Booking
```ts
export interface BookingRequest {
  property_id: string;
  check_in: string; // ISO 8601
  check_out: string; // ISO 8601
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  traveler_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  message_to_host?: string;
  accompanied_services?: string[]; // service IDs
}

export interface Booking {
  id: string;
  property: PropertyListItem;
  check_in: string;
  check_out: string;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  nights: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  pricing: {
    price_per_night: number;
    nights: number;
    subtotal: number;
    service_fee: number;
    cleaning_fee: number;
    taxes: number;
    total: number;
    currency: string;
  };
  traveler: User;
  host: User;
  created_at: string;
  updated_at: string;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method?: string;
  confirmation_code?: string;
}
```

### Negotiation
```ts
export interface NegotiationRequest {
  property_id: string;
  check_in: string;
  check_out: string;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  proposed_price: number;
  message: string;
}

export interface Negotiation {
  id: string;
  property: PropertyListItem;
  check_in: string;
  check_out: string;
  guests: {
    adults: number;
    children: number;
    infants: number;
  };
  original_price: number;
  proposed_price: number;
  counter_offer_price?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  message: string;
  host_response?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}
```

### Payment
```ts
export interface PaymentIntent {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  payment_method: 'card' | 'mobile_money' | 'bank_transfer';
  client_secret?: string; // pour Stripe
  provider_data?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'bank_transfer';
  label: string;
  icon?: string;
  is_default: boolean;
  details?: {
    last4?: string;
    brand?: string;
    exp_month?: number;
    exp_year?: number;
    phone?: string; // mobile money
  };
}
```

### Wishlist
```ts
export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  properties: PropertyListItem[];
  created_at: string;
  updated_at: string;
  is_public: boolean;
}
```

### Search Filters
```ts
export interface SearchFilters {
  destination?: string;
  check_in?: string; // ISO 8601
  check_out?: string; // ISO 8601
  guests?: {
    adults?: number;
    children?: number;
    infants?: number;
  };
  price_min?: number;
  price_max?: number;
  property_type?: ('apartment' | 'house' | 'villa' | 'studio' | 'loft')[];
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[]; // IDs ou slugs
  instant_book?: boolean;
  superhost?: boolean;
  rating_min?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'popularity' | 'newest';
}
```

---

## 3) Contracts API (services)

### properties.service.ts
```ts
// GET /properties/search
searchProperties(filters: SearchFilters): Promise<Paginated<PropertyListItem>>;

// GET /properties/{id}
getPropertyDetail(propertyId: string): Promise<PropertyDetail>;

// GET /properties/{id}/availability
getPropertyAvailability(propertyId: string, from: string, to: string): Promise<Availability[]>;

// GET /properties/{id}/reviews
getPropertyReviews(propertyId: string, page?: number, limit?: number): Promise<Paginated<Review>>;

// GET /properties/popular
getPopularProperties(limit?: number): Promise<PropertyListItem[]>;

// GET /properties/featured
getFeaturedProperties(limit?: number): Promise<PropertyListItem[]>;
```

### auth.service.ts
```ts
// POST /auth/signup
signup(data: { email: string; password: string; first_name: string; last_name: string; phone?: string }): Promise<AuthResponse>;

// POST /auth/login
login(email: string, password: string): Promise<AuthResponse>;

// POST /auth/logout
logout(): Promise<void>;

// POST /auth/refresh
refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }>;

// POST /auth/forgot-password
forgotPassword(email: string): Promise<{ message: string }>;

// POST /auth/reset-password
resetPassword(token: string, newPassword: string): Promise<{ message: string }>;

// GET /auth/me
getCurrentUser(): Promise<User>;
```

### bookings.service.ts
```ts
// POST /bookings
createBooking(data: BookingRequest): Promise<Booking>;

// GET /bookings/{id}
getBooking(bookingId: string): Promise<Booking>;

// GET /bookings/my
getMyBookings(status?: string): Promise<Paginated<Booking>>;

// PUT /bookings/{id}/cancel
cancelBooking(bookingId: string, reason?: string): Promise<Booking>;

// GET /bookings/{id}/pricing
calculatePricing(propertyId: string, checkIn: string, checkOut: string, guests: any): Promise<Booking['pricing']>;
```

### negotiations.service.ts
```ts
// POST /negotiations
createNegotiation(data: NegotiationRequest): Promise<Negotiation>;

// GET /negotiations/{id}
getNegotiation(negotiationId: string): Promise<Negotiation>;

// GET /negotiations/my
getMyNegotiations(status?: string): Promise<Paginated<Negotiation>>;

// PUT /negotiations/{id}/accept (guest accepts counter-offer)
acceptNegotiation(negotiationId: string): Promise<Negotiation>;

// PUT /negotiations/{id}/reject (guest rejects counter-offer)
rejectNegotiation(negotiationId: string): Promise<Negotiation>;
```

### payments.service.ts
```ts
// POST /payments/intent
createPaymentIntent(bookingId: string, paymentMethodId: string): Promise<PaymentIntent>;

// POST /payments/confirm
confirmPayment(paymentIntentId: string): Promise<PaymentIntent>;

// GET /payments/methods
getPaymentMethods(): Promise<PaymentMethod[]>;

// POST /payments/methods
addPaymentMethod(data: { type: string; details: any }): Promise<PaymentMethod>;

// DELETE /payments/methods/{id}
deletePaymentMethod(methodId: string): Promise<void>;
```

### wishlists.service.ts
```ts
// GET /wishlists
getWishlists(): Promise<Wishlist[]>;

// POST /wishlists
createWishlist(name: string, description?: string): Promise<Wishlist>;

// GET /wishlists/{id}
getWishlist(wishlistId: string): Promise<Wishlist>;

// PUT /wishlists/{id}
updateWishlist(wishlistId: string, data: { name?: string; description?: string }): Promise<Wishlist>;

// DELETE /wishlists/{id}
deleteWishlist(wishlistId: string): Promise<void>;

// POST /wishlists/{id}/properties/{propertyId}
addPropertyToWishlist(wishlistId: string, propertyId: string): Promise<Wishlist>;

// DELETE /wishlists/{id}/properties/{propertyId}
removePropertyFromWishlist(wishlistId: string, propertyId: string): Promise<Wishlist>;

// GET /wishlists/default (wishlist par défaut de l'utilisateur)
getDefaultWishlist(): Promise<Wishlist>;

// POST /wishlists/toggle/{propertyId} (add/remove de la wishlist par défaut)
togglePropertyInDefaultWishlist(propertyId: string): Promise<{ is_favorited: boolean }>;
```

---

## 4) Contracts Hooks (React Query)

### Properties
```ts
useSearchProperties(filters: SearchFilters, options?: UseQueryOptions)
usePropertyDetail(propertyId: string, options?: UseQueryOptions)
usePropertyAvailability(propertyId: string, from: string, to: string)
usePropertyReviews(propertyId: string, page: number)
usePopularProperties(limit?: number)
useFeaturedProperties(limit?: number)
```

### Auth
```ts
useAuth() // retourne { user, login, logout, signup, isAuthenticated, isLoading }
useCurrentUser(options?: UseQueryOptions)
useLogin(options?: UseMutationOptions)
useSignup(options?: UseMutationOptions)
useLogout(options?: UseMutationOptions)
```

### Bookings
```ts
useCreateBooking(options?: UseMutationOptions)
useBooking(bookingId: string, options?: UseQueryOptions)
useMyBookings(status?: string, options?: UseQueryOptions)
useCancelBooking(options?: UseMutationOptions)
useCalculatePricing(propertyId: string, checkIn: string, checkOut: string, guests: any)
```

### Negotiations
```ts
useCreateNegotiation(options?: UseMutationOptions)
useNegotiation(negotiationId: string, options?: UseQueryOptions)
useMyNegotiations(status?: string, options?: UseQueryOptions)
useAcceptNegotiation(options?: UseMutationOptions)
useRejectNegotiation(options?: UseMutationOptions)
```

### Payments
```ts
useCreatePaymentIntent(options?: UseMutationOptions)
useConfirmPayment(options?: UseMutationOptions)
usePaymentMethods(options?: UseQueryOptions)
useAddPaymentMethod(options?: UseMutationOptions)
useDeletePaymentMethod(options?: UseMutationOptions)
```

### Wishlists
```ts
useWishlists(options?: UseQueryOptions)
useWishlist(wishlistId: string, options?: UseQueryOptions)
useCreateWishlist(options?: UseMutationOptions)
useUpdateWishlist(options?: UseMutationOptions)
useDeleteWishlist(options?: UseMutationOptions)
useAddPropertyToWishlist(options?: UseMutationOptions)
useRemovePropertyFromWishlist(options?: UseMutationOptions)
useDefaultWishlist(options?: UseQueryOptions)
useTogglePropertyInWishlist(options?: UseMutationOptions)
```

---

## 5) Contracts Composants

### PropertyCard
```ts
interface PropertyCardProps {
  property: PropertyListItem;
  onClick?: () => void;
  showWishlistButton?: boolean;
  variant?: 'default' | 'compact' | 'wide';
}
```

### PropertyImageGallery
```ts
interface PropertyImageGalleryProps {
  images: PropertyImage[];
  propertyTitle: string;
  onImageClick?: (index: number) => void;
}
```

### SearchBar
```ts
interface SearchBarProps {
  initialFilters?: Partial<SearchFilters>;
  onSearch: (filters: SearchFilters) => void;
  variant?: 'default' | 'compact';
  showAdvancedFilters?: boolean;
}
```

### PropertyInfo
```ts
interface PropertyInfoProps {
  property: PropertyDetail;
  showBookButton?: boolean;
  onBookClick?: () => void;
}
```

### PropertyDescription
```ts
interface PropertyDescriptionProps {
  description: string;
  maxLength?: number;
  expandable?: boolean;
}
```

### PropertyAmenities
```ts
interface PropertyAmenitiesProps {
  amenities: string[];
  showAll?: boolean;
  maxVisible?: number;
}
```

### ReviewsSection
```ts
interface ReviewsSectionProps {
  propertyId: string;
  reviews?: Review[];
  summary?: ReviewSummary;
  showAll?: boolean;
  maxVisible?: number;
}
```

### HostInfo
```ts
interface HostInfoProps {
  host: PropertyDetail['host'];
  showContactButton?: boolean;
  onContactClick?: () => void;
}
```

### HouseRules
```ts
interface HouseRulesProps {
  rules: HouseRule[];
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
}
```

### Neighborhood
```ts
interface NeighborhoodProps {
  location: Location;
  nearbyPlaces: NearbyPlace[];
  showMap?: boolean;
}
```

### BookingFooter
```ts
interface BookingFooterProps {
  pricePerNight: number;
  currency: string;
  totalPrice?: number;
  onBookClick: () => void;
  isLoading?: boolean;
  isInstantBook?: boolean;
}
```

### SimilarProperties
```ts
interface SimilarPropertiesProps {
  properties: PropertyListItem[];
  title?: string;
}
```

### AmenitiesList
```ts
interface AmenitiesListProps {
  amenities: string[];
  columns?: 1 | 2 | 3;
  showIcons?: boolean;
}
```

### ListingRules
```ts
interface ListingRulesProps {
  rules: HouseRule[];
  variant?: 'default' | 'compact';
}
```

### PromotionBanner
```ts
interface PromotionBannerProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
  discount?: number;
}
```

### Header
```ts
interface HeaderProps {
  user?: User | null;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onLogoClick?: () => void;
  showSearchBar?: boolean;
}
```

### BottomNav
```ts
interface BottomNavProps {
  activeRoute?: string;
  wishlistCount?: number;
}
```

---

## 6) Conventions UI / Routing

### Routes MVP
```
/                           -> Index (Accueil)
/search                     -> Résultats de recherche
/properties/:id             -> PropertyDetails
/book-or-negotiate/:id      -> BookOrNegotiate (choix)
/booking/traveler-info/:id  -> TravelerInformation
/booking/review/:id         -> ReviewInformation
/booking/payment/:id        -> PaymentMethod
/booking/payment-progress   -> PaymentProgress
/booking/success/:bookingId -> PaymentSuccess
/negotiation/:id            -> Negotiation (formulaire)
/negotiation/sent/:negotiationId -> RequestSent
/wishlist                   -> MyWishlist
/wishlists                  -> AllWishlists
/signup                     -> SignUp
/login                      -> Login (à créer)
/profile                    -> User Profile (à créer)
/bookings                   -> My Bookings (à créer)
/negotiations               -> My Negotiations (à créer)
```

### Contraintes MVP
- UI anglaise uniquement
- Authentification email/password
- Une devise par défaut (XAF)
- Recherche avec filtres basiques
- Paiement: carte bancaire minimum

---

## 7) Configuration & Constantes

### API Base URLs
```ts
// .env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GOOGLE_MAPS_KEY=...
VITE_CDN_BASE_URL=https://cdn.ganitel.com
```

### Constantes
```ts
export const CURRENCIES = {
  XOF: { symbol: 'FCFA', code: 'XAF', decimals: 0 },
  EUR: { symbol: '€', code: 'EUR', decimals: 2 },
  USD: { symbol: '$', code: 'USD', decimals: 2 },
};

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'house', label: 'Maison' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
];

export const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { id: 'parking', label: 'Parking', icon: 'car' },
  { id: 'pool', label: 'Piscine', icon: 'waves' },
  { id: 'ac', label: 'Climatisation', icon: 'wind' },
  { id: 'kitchen', label: 'Cuisine', icon: 'chef-hat' },
  { id: 'tv', label: 'Télévision', icon: 'tv' },
  { id: 'gym', label: 'Salle de sport', icon: 'dumbbell' },
  { id: 'security', label: 'Sécurité 24/7', icon: 'shield-check' },
];

export const CANCELLATION_POLICIES = {
  flexible: 'Annulation gratuite jusqu\'à 24h avant l\'arrivée',
  moderate: 'Annulation gratuite jusqu\'à 5 jours avant l\'arrivée',
  strict: 'Remboursement partiel jusqu\'à 14 jours avant l\'arrivée',
};
```

---

## 8) Parallelisation recommandée

### Dev A — Types + Services + Hooks
- Créer tous les types dans `shared/types.ts`
- Implémenter services API
- Créer hooks React Query

### Dev B — Composants UI de base
- PropertyCard
- SearchBar
- Header/Footer/BottomNav
- Button, Input, Card (shadcn/ui)

### Dev C — Pages Accueil + Recherche
- Index.tsx
- SearchResults.tsx
- Integration SearchBar + PropertyCard

### Dev D — PropertyDetails + Composants détails
- PropertyImageGallery
- PropertyInfo
- PropertyDescription
- PropertyAmenities
- ReviewsSection
- HostInfo
- Neighborhood

### Dev E — Parcours Réservation
- BookOrNegotiate
- TravelerInformation
- ReviewInformation
- PaymentMethod
- PaymentProgress
- PaymentSuccess

### Dev F — Négociation + Wishlist
- Negotiation
- RequestSent
- MyWishlist
- AllWishlists
- WishlistContext

---

## 9) Open Questions (à clarifier avec backend)

- Format exact des images (URLs absolues ou relatives ?)
- Gestion des time zones pour les dates de réservation
- Webhooks pour les notifications de paiement
- Taux de change pour multi-devises
- Rate limiting des endpoints API
- Format des messages d'erreur (RFC 7807 ?)
- Upload d'images côté utilisateur (avatars) ?
- Pagination max items par page
- Cache-Control headers pour optimisation
- CORS configuration pour production

---

## 10) Notes de sécurité

- **Tokens JWT** : stockage sécurisé (httpOnly cookies recommandé)
- **Refresh tokens** : rotation automatique
- **Validation côté client** : Zod pour tous les formulaires
- **Sanitization** : inputs utilisateur (XSS prevention)
- **HTTPS** : obligatoire en production
- **API keys** : jamais exposées côté client
- **Rate limiting** : géré côté backend
- **CSRF** : tokens pour mutations sensibles
