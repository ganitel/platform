export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Money is serialized as Decimal-string + ISO 4217 currency code. Mirrors `app.core.money.Money`. */
export interface Money {
  amount: string;
  currency: string;
}

export interface MediaPublic {
  id: string;
  url: string;
  mime_type: string;
  created_at: string;
}

export interface HostPublic {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export type CancellationPolicy = "flexible" | "moderate" | "strict";
export type PropertyStatus = "draft" | "published" | "unlisted" | "removed";
export type ParkingAvailability = "none" | "free" | "paid";
export type KitchenType = "none" | "kitchenette" | "full";

export interface PropertyPublic {
  id: string;
  title: string;
  property_type: string;
  city: string;
  country_code: string;
  location: GeoPoint;
  capacity: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  base_price: Money;
  amenities: string[];
  cover_photo: MediaPublic | null;
  distance_km: number | null;
}

export interface PropertyDetail extends PropertyPublic {
  description: string;
  house_rules: string | null;
  cancellation_policy: CancellationPolicy;
  content_language: string;
  status: PropertyStatus;
  host: HostPublic;
  photos: MediaPublic[];
  created_at: string;
  published_at: string | null;
}

export interface SearchOut {
  items: PropertyPublic[];
  total: number;
  limit: number;
  offset: number;
}

export interface PropertyCreateInput {
  title: string;
  description?: string;
  property_type: string;
  city: string;
  country_code: string;
  location: GeoPoint;
  capacity: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  amenities?: string[];
  parking_available?: ParkingAvailability;
  elevator?: boolean;
  accessible?: boolean;
  private_bathroom?: boolean;
  kitchen_type?: KitchenType;
  events_allowed?: boolean;
  family_friendly?: boolean;
  child_friendly?: boolean;
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  check_in_time?: string | null;
  check_out_time?: string | null;
  house_rules?: string | null;
  cancellation_policy?: CancellationPolicy;
  base_price: Money;
  content_language?: "fr" | "en";
}

export interface PropertyAdminListItem {
  id: string;
  title: string;
  property_type: string;
  city: string;
  country_code: string;
  status: PropertyStatus;
  base_price: Money;
  cover_photo: MediaPublic | null;
  created_at: string;
  published_at: string | null;
}

export interface AdminListOut {
  items: PropertyAdminListItem[];
  total: number;
}

export interface SearchFilters {
  q?: string;
  city?: string;
  country_code?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string[];
  amenity?: string[];
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "distance";
  limit?: number;
  offset?: number;
}
