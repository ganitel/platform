export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Money is serialized as Decimal-string + ISO 4217 currency code. Mirrors `app.core.money.Money`. */
export interface Money {
  amount: string;
  currency: string;
}

export type MediaKind = "image" | "video";

export interface MediaPublic {
  id: string;
  url: string;
  mime_type: string;
  kind: MediaKind;
  poster_url: string | null;
  duration_ms: number | null;
  created_at: string;
}

/** Element of a listing's `media` array. Same shape as MediaPublic plus the
 *  join-row id, which the frontend needs to detach or reorder a specific
 *  attachment. */
export interface MediaItemPublic extends MediaPublic {
  media_item_id: string;
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

export interface PropertyShowcaseAmenities {
  has_wifi: boolean;
  has_ac: boolean;
  has_gym: boolean;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  highlights: Record<string, boolean>;
}

export interface PropertyListingMetadata {
  parking_available: ParkingAvailability;
  elevator: boolean;
  accessible: boolean;
  private_bathroom: boolean;
  kitchen_type: KitchenType;
  events_allowed: boolean;
  family_friendly: boolean;
  child_friendly: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
}

export interface PropertyPublic {
  id: string;
  title: string;
  property_type: string;
  address: string | null;
  city: string;
  country_code: string;
  location: GeoPoint;
  capacity: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  prices: Money[];
  amenities: string[];
  showcase_amenities: PropertyShowcaseAmenities;
  listing_metadata: PropertyListingMetadata;
  cover_media: MediaPublic | null;
  distance_km: number | null;
}

export interface PropertyDetail extends PropertyPublic {
  description: string;
  house_rules: string | null;
  cancellation_policy: CancellationPolicy;
  content_language: string;
  status: PropertyStatus;
  host: HostPublic;
  media: MediaItemPublic[];
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
  address?: string | null;
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
  prices: Money[];
  content_language?: "fr" | "en";
  media_ids?: string[];
}

export interface PropertyAdminListItem {
  id: string;
  title: string;
  property_type: string;
  city: string;
  country_code: string;
  status: PropertyStatus;
  prices: Money[];
  cover_media: MediaPublic | null;
  created_at: string;
  published_at: string | null;
}

export interface AdminStatusSummary {
  draft: number;
  published: number;
  unlisted: number;
  removed: number;
  total: number;
}

export interface AdminListOut {
  items: PropertyAdminListItem[];
  total: number;
  limit: number;
  offset: number;
}

export type PropertyUpdateInput = Partial<PropertyCreateInput>;

export interface SearchFilters {
  q?: string;
  city?: string;
  country_code?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  currency?: string;
  property_type?: string[];
  amenity?: string[];
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "distance";
  limit?: number;
  offset?: number;
}
