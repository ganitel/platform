import type {
  AdminStatusSummary,
  GeoPoint,
  HostPublic,
  MediaItemPublic,
  MediaPublic,
  Money,
} from "@/features/properties/types";

export type { AdminStatusSummary };

export type ExperienceCancellationPolicy = "flexible" | "moderate" | "strict";
export type ExperienceStatus = "draft" | "published" | "unlisted" | "removed";

export interface ExperiencePublic {
  id: string;
  title: string;
  experience_type: string;
  address: string | null;
  city: string;
  country_code: string;
  location: GeoPoint;
  capacity: number;
  duration_minutes: number;
  prices: Money[];
  cover_media: MediaPublic | null;
  distance_km: number | null;
}

export interface ExperienceDetail extends ExperiencePublic {
  description: string | null;
  cancellation_policy: ExperienceCancellationPolicy;
  content_language: string;
  status: ExperienceStatus;
  host: HostPublic;
  media: MediaItemPublic[];
  created_at: string;
  published_at: string | null;
}

export interface ExperienceSearchOut {
  items: ExperiencePublic[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExperienceCreateInput {
  title: string;
  description?: string;
  experience_type: string;
  address?: string | null;
  city: string;
  country_code: string;
  location: GeoPoint;
  capacity: number;
  duration_minutes: number;
  cancellation_policy?: ExperienceCancellationPolicy;
  prices: Money[];
  content_language?: "fr" | "en";
  media_ids?: string[];
}

export interface ExperienceAdminListItem {
  id: string;
  title: string;
  experience_type: string;
  city: string;
  country_code: string;
  status: ExperienceStatus;
  duration_minutes: number;
  prices: Money[];
  cover_media: MediaPublic | null;
  created_at: string;
  published_at: string | null;
}

export interface ExperienceAdminListOut {
  items: ExperienceAdminListItem[];
  total: number;
  limit: number;
  offset: number;
}

export type ExperienceUpdateInput = Partial<ExperienceCreateInput>;
