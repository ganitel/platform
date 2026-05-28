import {
  buildSrcSet,
  transformImage,
  HERO_WIDTHS,
  HERO_SIZES,
} from "@/shared/lib/image";

export const HERO_SOURCE =
  "https://images.unsplash.com/photo-1756475471671-48813cf5ea5b?w=2000&q=80&auto=format&fit=crop";
export const HERO_FALLBACK = "https://picsum.photos/seed/ganitelhero/1600/1067";
export const FEATURE_SOURCE =
  "https://images.unsplash.com/photo-1741850819375-5de72125719e?w=900&q=80&auto=format&fit=crop";
export const FEATURE_FALLBACK =
  "https://picsum.photos/seed/ganitelfeat/720/560";

export const HERO_MOBILE_SRC = transformImage(HERO_SOURCE, {
  width: 720,
  quality: 65,
});
export const HERO_SRCSET = buildSrcSet(HERO_SOURCE, HERO_WIDTHS, 70) ?? "";
export { HERO_SIZES, HERO_WIDTHS };
