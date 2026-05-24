/**
 * Image URL helpers for the two external CDNs we currently use:
 *   - Unsplash (`images.unsplash.com`) — supports `w`, `q`, `auto=format`.
 *   - Picsum   (`picsum.photos/seed/<seed>/<w>/<h>`) — width/height in path.
 *
 * Host-uploaded URLs from the backend pass through untouched. The functions
 * are defensive: if the URL doesn't match a known pattern, the original
 * string is returned and the srcSet is empty.
 *
 * Why: African users on slow networks shouldn't pay desktop-size weight on
 * a phone. Tiering hero/feature/card images saves hundreds of KB.
 */

export const MOBILE_BREAKPOINT_PX = 768;

const UNSPLASH_HOST = "images.unsplash.com";
const PICSUM_HOST = "picsum.photos";

function isUnsplash(url: string): boolean {
  return url.includes(UNSPLASH_HOST);
}

function isPicsum(url: string): boolean {
  return url.includes(PICSUM_HOST);
}

/** Returns a single resized URL for a known CDN, or the original string. */
export function transformImage(
  url: string,
  opts: { width: number; quality?: number },
): string {
  if (!url) return url;
  const q = opts.quality ?? 75;

  if (isUnsplash(url)) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", String(opts.width));
      u.searchParams.set("q", String(q));
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      return u.toString();
    } catch {
      return url;
    }
  }

  if (isPicsum(url)) {
    return url.replace(
      /\/(\d+)\/(\d+)(\?.*)?$/,
      (_match, w: string, h: string, query: string | undefined) => {
        const ratio = Number(h) / Number(w);
        const newH = Math.round(
          opts.width * (Number.isFinite(ratio) ? ratio : 0.66),
        );
        return `/${opts.width}/${newH}${query ?? ""}`;
      },
    );
  }

  return url;
}

/** Comma-separated `url Xw` srcSet for the widths we care about. */
export function buildSrcSet(
  url: string,
  widths: readonly number[],
  quality?: number,
): string | undefined {
  if (!url) return undefined;
  if (!isUnsplash(url) && !isPicsum(url)) return undefined;
  return widths
    .map((w) => `${transformImage(url, { width: w, quality })} ${w}w`)
    .join(", ");
}

/** Standard tier for property/experience card covers (1-col → 3-col grid). */
export const CARD_WIDTHS = [400, 600, 900] as const;
export const CARD_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/** Standard tier for hero / above-the-fold full-bleed photos. */
export const HERO_WIDTHS = [640, 960, 1440] as const;
export const HERO_SIZES = "100vw";
