import type { MediaPublic } from "@/features/properties/types";

/**
 * Listing media URLs are constructed server-side; the `url` field is already
 * a permanent public URL. This helper exists so we have one place to plug in
 * Supabase Image Transformations when we upgrade to a paid plan.
 */
export function publicUrl(media: MediaPublic): string {
  return media.url;
}

export interface ImageVariantOpts {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif";
}

export function imageVariant(
  media: MediaPublic,
  _opts: ImageVariantOpts,
): string {
  // Free plan: no transforms. Return the original URL.
  // When SUPABASE_IMAGE_TRANSFORMS_ENABLED is rolled out, replace this body
  // with a URL builder against /storage/v1/render/image/public/...
  return media.url;
}

/** Choose the still thumbnail for a media item (the image itself, or a
 * video's poster). Falls back to the original URL if poster is missing.
 */
export function thumbnailUrl(media: MediaPublic): string {
  if (media.kind === "video" && media.poster_url) {
    return media.poster_url;
  }
  return media.url;
}
