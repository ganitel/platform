export const PUBLIC_CDN_CACHE =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=3600";

export const PUBLIC_CDN_CACHE_LONG =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

// Detail pages can flip between public and private (host unpublishes a
// listing). The backend already responds with `private, no-store` in that
// case; mirror it at the route layer so the rendered SSR HTML never lands
// in a shared CDN cache.
export const PRIVATE_NO_STORE_CACHE = "private, no-store";
