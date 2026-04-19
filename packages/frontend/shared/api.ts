/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// ==================== PAGINATION ====================
/**
 * Generic paginated response wrapper
 */
export interface Paginated<T> {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

// ==================== LOCATION & GEOGRAPHY ====================

/**
 * Availability for a specific date
 */
export interface Availability {
  date: string; // ISO 8601
  available: boolean;
  price?: number;
}

/**
 * Geographic coordinates and address information (backend structure)
 */
export interface ServiceLocation {
  country: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Pricing information (backend structure)
 */
export interface ServicePricing {
  base_price: number;
  currency: string;
  price_per: string; // "night", "hour", "person", etc.
}

/**
 * Capacity information (backend structure)
 */
export interface ServiceCapacity {
  max_guests: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
}

/**
 * Rating information (backend structure)
 */
export interface ServiceRating {
  average: number;
  count: number;
}

/**
 * Booking info (backend structure)
 */
export interface ServiceBookingInfo {
  instant_book?: boolean;
  min_stay?: number;
  max_stay?: number;
  check_in_time?: string;
  check_out_time?: string;
}

/**
 * Stats (backend structure)
 */
export interface ServiceStats {
  view_count: number;
  booking_count: number;
}

// ==================== SERVICE TYPES (backend uses Services not Properties) ====================
/**
 * Service listing item (used in search results and lists)
 */
export interface ServiceListItem {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  service_type: 'accommodation' | 'tour' | 'activity' | 'transport' | 'dining' | 'wellness';
  accommodation_type?: 'hotel' | 'apartment' | 'house' | 'villa' | 'guesthouse' | 'hostel' | 'resort' | 'lodge';
  status: 'draft' | 'pending_review' | 'active' | 'inactive' | 'rejected' | 'archived';
  provider_id: string;
  location: ServiceLocation;
  pricing: ServicePricing;
  capacity: ServiceCapacity;
  rating: ServiceRating;
  booking_info?: ServiceBookingInfo;
  stats?: ServiceStats;
  amenities?: string[];
  house_rules?: string[];
  images?: string[];
  videos?: string[];
  virtual_tour_url?: string;
  is_favorited?: boolean; // client-side flag
}

/**
 * Detailed service information
 */
export interface ServiceDetail extends ServiceListItem {
  availability_calendar?: any; // JSON field
  blocked_dates?: string[];
}

/**
 * Service search filters
 */
export interface ServiceSearchFilters {
  q?: string;
  service_type?: 'accommodation' | 'tour' | 'activity' | 'transport' | 'dining' | 'wellness';
  accommodation_type?: 'hotel' | 'apartment' | 'house' | 'villa' | 'guesthouse' | 'hostel' | 'resort' | 'lodge';
  country?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  amenities?: string;
  guests?: number;
  check_in?: string;
  check_out?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: string;
  page?: number;
  per_page?: number;
}

/**
 * Service search response
 */
export interface ServiceSearchResponse {
  services: ServiceListItem[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    pages: number;
  };
  filters_applied: ServiceSearchFilters;
}

// ==================== LEGACY TYPES (DEPRECATED - Use Service types instead) ====================
/**
 * @deprecated Use ServiceDetail instead. Backend uses /services/* not /properties/*
 * Kept for backward compatibility during migration
 */
export type PropertyDetail = ServiceDetail;

/**
 * @deprecated Legacy location type - use ServiceLocation instead
 */
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
  zipCode?: string;
}

// ==================== USER & AUTH ====================
/**
 * User profile information (backend structure)
 */
export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  user_type: 'traveler' | 'provider' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  is_verified: boolean;
  profile_picture?: string;
  bio?: string;
  country?: string;
  city?: string;
  language: string; // default fr
  currency: string; // default XAF
  auth_type?: string;
  oauth_id?: string;
  oauth_provider?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication response with tokens
 */
export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in?: number; // seconds
}

// ==================== REVIEW ====================
/**
 * Review from a user about a service (backend structure)
 */
export interface Review {
  id: string;
  service_id: string;
  user_id: string;
  booking_id?: string;
  overall_rating: number;
  cleanliness_rating?: number;
  communication_rating?: number;
  checkin_rating?: number;
  accuracy_rating?: number;
  location_rating?: number;
  value_rating?: number;
  title?: string;
  comment?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

// ==================== BOOKING ====================
/**
 * Booking request payload (backend structure)
 */
export interface BookingRequest {
  service_id: string;
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  guests: number; // simple number, not object
  notes?: string;
}

/**
 * Booking confirmation with full details (backend structure)
 */
export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  start_date: string;
  end_date: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed' | 'completed';
  total_amount?: number;
  currency?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ==================== NEGOTIATION ====================
/**
 * Negotiation request payload (backend structure)
 */
export interface NegotiationRequest {
  booking_id?: string;
  service_id: string;
  user_id?: string;
  provider_id?: string;
  original_price: number;
  proposed_price: number;
  currency: string;
  message?: string;
}

/**
 * Negotiation record with status tracking (backend structure)
 */
export interface Negotiation {
  id: string;
  booking_id?: string;
  service_id: string;
  user_id: string;
  provider_id: string;
  original_price: number;
  proposed_price: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'cancelled';
  message?: string;
  counter_price?: number;
  counter_message?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// ==================== PAYMENT (Tranzak Flow) ====================
/**
 * Payment initiate request (backend structure for Tranzak)
 */
export interface PaymentInitiateRequest {
  booking_id: string;
  amount: number;
  currency: string;
  provider: 'tranzak' | 'mobile_money' | 'card';
}

/**
 * Payment initiate response (backend structure for Tranzak)
 */
export interface PaymentInitiateResponse {
  payment_id: string;
  transaction_id: string;
  payment_url: string; // URL to redirect user to Tranzak
  amount: number;
  currency: string;
  status: string;
  message: string;
}

/**
 * Payment record (backend structure)
 */
export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  provider: 'tranzak' | 'mobile_money' | 'card';
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  provider_response?: any;
  error_message?: string;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Payment refund request (admin only)
 */
export interface PaymentRefundRequest {
  refund_amount: number;
  refund_reason: string;
}

// ==================== WISHLIST (Simple Toggle System) ====================
/**
 * Wishlist item (backend structure - simple service favorites)
 */
export interface WishlistItem {
  id: string;
  user_id: string;
  service_id: string;
  created_at: string;
}

// ==================== SEARCH FILTERS ====================
/**
 * @deprecated Use ServiceSearchFilters instead. Backend uses /services/* not /properties/*
 * Kept for backward compatibility during migration
 */
export type SearchFilters = ServiceSearchFilters;
