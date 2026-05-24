export type MediaKind = "image" | "video";

export type ImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif";

export type VideoMimeType = "video/mp4" | "video/webm";

export type MediaMimeType = ImageMimeType | VideoMimeType;

export interface MediaUploadInput {
  mime_type: MediaMimeType;
  kind: MediaKind;
  size_bytes?: number;
  draft_id?: string;
  poster_media_id?: string;
  duration_ms?: number;
}

export interface MediaUploadOutput {
  media_id: string;
  upload_url: string;
  expires_in: number;
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_VIDEO_DURATION_MS = 60_000;
export const MAX_MEDIA_PER_LISTING = 20;
export const MAX_VIDEOS_PER_LISTING = 3;

export const ACCEPTED_IMAGE_MIMES: ImageMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const ACCEPTED_VIDEO_MIMES: VideoMimeType[] = [
  "video/mp4",
  "video/webm",
];
