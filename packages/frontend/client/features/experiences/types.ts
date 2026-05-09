import type {
  GeoPoint,
  HostPublic,
  MediaPublic,
  Money,
} from "@/features/properties/types";

export type ExperienceCancellationPolicy = "flexible" | "moderate" | "strict";
export type ExperienceStatus = "draft" | "published" | "unlisted" | "removed";

export interface ExperiencePublic {
  id: string;
  title: string;
  experience_type: string;
  city: string;
  country_code: string;
  location: GeoPoint;
  capacity: number;
  duration_minutes: number;
  base_price: Money;
  cover_photo: MediaPublic | null;
  distance_km: number | null;
}

export interface ExperienceDetail extends ExperiencePublic {
  description: string | null;
  cancellation_policy: ExperienceCancellationPolicy;
  content_language: string;
  status: ExperienceStatus;
  host: HostPublic;
  photos: MediaPublic[];
  created_at: string;
  published_at: string | null;
}

export interface ExperienceSearchOut {
  items: ExperiencePublic[];
  total: number;
  limit: number;
  offset: number;
}
