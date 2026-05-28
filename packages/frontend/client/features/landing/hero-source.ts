import {
  buildSrcSet,
  transformImage,
  CARD_WIDTHS,
  HERO_WIDTHS,
  HERO_SIZES,
} from "@/shared/lib/image";

// Placeholder Cameroon imagery from Edouard TAMBA's Unsplash portfolio.
// Replace with owned photography before launch. picsum fallback keeps the
// page intact if an Unsplash URL fails.

export const HERO_SOURCE =
  "https://images.unsplash.com/photo-1659947234291-13d4843d0e75?w=2000&q=80&auto=format&fit=crop";
export const HERO_FALLBACK = "https://picsum.photos/seed/ganitelhero/1600/1067";

export const VISION_SOURCE =
  "https://images.unsplash.com/photo-1615463531521-201b9e68ae96?w=2000&q=80&auto=format&fit=crop";
export const VISION_FALLBACK =
  "https://picsum.photos/seed/ganitelvisionhome/1600/900";

export const DEST_SW_SOURCE =
  "https://images.unsplash.com/photo-1615463668140-d294c94ec8ef?w=1200&q=80&auto=format&fit=crop";
export const DEST_SW_FALLBACK =
  "https://picsum.photos/seed/ganiteldestsw/900/700";

export const DEST_HIGHLANDS_SOURCE =
  "https://images.unsplash.com/photo-1615463669098-521a22047a1e?w=1200&q=80&auto=format&fit=crop";
export const DEST_HIGHLANDS_FALLBACK =
  "https://picsum.photos/seed/ganiteldesthighlands/900/700";

export const DEST_EAST_SOURCE =
  "https://images.unsplash.com/photo-1615463738213-b9381d217b4e?w=1200&q=80&auto=format&fit=crop";
export const DEST_EAST_FALLBACK =
  "https://picsum.photos/seed/ganiteldesteast/900/700";

export const DEST_LITTORAL_SOURCE =
  "https://images.unsplash.com/photo-1637244018403-785e7fa8707a?w=1200&q=80&auto=format&fit=crop";
export const DEST_LITTORAL_FALLBACK =
  "https://picsum.photos/seed/ganiteldestlittoral/900/700";

export const HERO_MOBILE_SRC = transformImage(HERO_SOURCE, {
  width: 720,
  quality: 65,
});
export const HERO_SRCSET = buildSrcSet(HERO_SOURCE, HERO_WIDTHS, 70) ?? "";

export const DEST_SIZES =
  "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

export { HERO_SIZES, HERO_WIDTHS, CARD_WIDTHS };
