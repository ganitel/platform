// SSR'd HTML references content-hashed asset URLs that rotate on every
// deploy. CDN-caching the HTML means a deploy can leave the cache pointing
// at chunk URLs that no longer exist — every cached page then breaks until
// the cache expires (and the broken page itself ships the new client bundle
// in *fresh* HTML, so client-side recovery can't reach those tabs).
//
// We let browsers revalidate each navigation instead; SSR is cheap for this
// app and the immutable hashed assets keep doing the heavy lifting at the
// edge. If we ever need shared caching for HTML again, do it via Vercel
// Skew Protection or Cache-Tag purge-on-deploy, not raw s-maxage.
export const PUBLIC_HTML_CACHE = "public, max-age=0, must-revalidate";

// Detail pages can flip between public and private (host unpublishes a
// listing). The backend already responds with `private, no-store` in that
// case; mirror it at the route layer so the rendered SSR HTML never lands
// in a shared CDN cache.
export const PRIVATE_NO_STORE_CACHE = "private, no-store";
