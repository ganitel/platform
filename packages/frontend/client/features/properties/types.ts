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
  width: number | null;
  height: number | null;
  alt: string | null;
}

export interface HostPublic {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export type CancellationPolicy = "flexible" | "moderate" | "strict";
export type PropertyStatus = "draft" | "published" | "archived";

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
  bathrooms: string;
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
