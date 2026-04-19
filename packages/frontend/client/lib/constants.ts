/**
 * App-wide constants and configuration
 */

export const CURRENCIES = {
  XOF: { symbol: 'FCFA', code: 'XOF', decimals: 0 },
  EUR: { symbol: '€', code: 'EUR', decimals: 2 },
  USD: { symbol: '$', code: 'USD', decimals: 2 },
} as const;

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
  { value: 'other', label: 'Other' },
] as const;

export const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { id: 'parking', label: 'Parking', icon: 'car' },
  { id: 'pool', label: 'Pool', icon: 'waves' },
  { id: 'ac', label: 'Air Conditioning', icon: 'wind' },
  { id: 'kitchen', label: 'Kitchen', icon: 'chef-hat' },
  { id: 'tv', label: 'Television', icon: 'tv' },
  { id: 'gym', label: 'Gym', icon: 'dumbbell' },
  { id: 'security', label: '24/7 Security', icon: 'shield-check' },
  { id: 'washing_machine', label: 'Washing Machine', icon: 'waves' },
  { id: 'dryer', label: 'Dryer', icon: 'wind' },
  { id: 'heating', label: 'Heating', icon: 'flame' },
  { id: 'balcony', label: 'Balcony', icon: 'square' },
] as const;

export const CANCELLATION_POLICIES = {
  flexible: 'Free cancellation up to 24 hours before arrival',
  moderate: 'Free cancellation up to 5 days before arrival',
  strict: 'Partial refund up to 14 days before arrival',
} as const;

export const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit / Debit Card', icon: 'credit-card' },
  { value: 'mobile_money', label: 'Mobile Money', icon: 'smartphone' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'bank' },
] as const;

export const BOOKING_STATUS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  rejected: 'Rejected',
} as const;

export const NEGOTIATION_STATUS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  countered: 'Countered',
  expired: 'Expired',
} as const;

export const PAYMENT_STATUS = {
  pending: 'Pending',
  processing: 'Processing',
  succeeded: 'Succeeded',
  failed: 'Failed',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh-token',
  AUTH_ME: '/users/me',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',

  // Services
  SERVICES_SEARCH: '/services/',
  SERVICES_POPULAR: '/services/popular',
  SERVICES_FEATURED: '/services/featured',

  // Bookings
  BOOKINGS_CREATE: '/bookings',
  BOOKINGS_MY: '/bookings/users/me',

  // Negotiations
  NEGOTIATIONS_CREATE: '/negotiations',
  NEGOTIATIONS_MY: '/negotiations/my',

  // Payments
  PAYMENTS_INTENT: '/payments/initiate',
  PAYMENTS_CONFIRM: '/payments/confirm',
  PAYMENTS_METHODS: '/payments/methods',

  // Wishlists
  WISHLISTS: '/wishlists',
  WISHLISTS_DEFAULT: '/wishlists/default',
  WISHLISTS_TOGGLE: '/wishlists/services/{service_id}/toggle',
} as const;

export const ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  PROPERTY_NOT_FOUND: 'PROPERTY_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  INVALID_DATES: 'INVALID_DATES',
  PROPERTY_NOT_AVAILABLE: 'PROPERTY_NOT_AVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^\+?[\d\s\-()]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
} as const;
