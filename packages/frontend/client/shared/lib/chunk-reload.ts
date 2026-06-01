/**
 * After a deploy, content-hashed chunk filenames change. Tabs already open on
 * the previous deploy reference the old hashes and 404 when they navigate or
 * `lazy()`-load a component. Without intervention the failure bubbles to the
 * root ErrorBoundary as a generic "500" — which is what users have been
 * reporting.
 *
 * The remedy is a single reload to pick up the new HTML + chunk URLs.
 *
 * Why the loop guard:
 *   A reload-then-fail again means the chunk is genuinely gone from the
 *   current deploy (or some other non-deploy cause). Reloading again would
 *   loop the user forever. We mark each attempt in sessionStorage with a
 *   timestamp and decline to auto-reload if the previous attempt was recent.
 */

const RELOAD_KEY = "ganitel:chunk_reload_at";
const RELOAD_WINDOW_MS = 10_000;

const CHUNK_ERROR_PATTERNS: readonly RegExp[] = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk \S+ failed/i,
  /Loading CSS chunk/i,
  /Unable to preload CSS/i,
] as const;

export function isChunkLoadError(error: unknown): boolean {
  if (error === null || error === undefined) return false;

  if (typeof error === "object") {
    const name = (error as { name?: unknown }).name;
    if (typeof name === "string" && name === "ChunkLoadError") return true;
  }

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" &&
            "message" in (error as Record<string, unknown>) &&
            typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : "";

  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

interface ReloadGuardOptions {
  now?: number;
  storage?: Storage | null;
  windowMs?: number;
}

function readStorage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.sessionStorage
      ? window.sessionStorage
      : null;
  } catch {
    return null;
  }
}

export function shouldAttemptReload(opts: ReloadGuardOptions = {}): boolean {
  const storage = opts.storage === undefined ? readStorage() : opts.storage;
  if (!storage) return true;
  const now = opts.now ?? Date.now();
  const windowMs = opts.windowMs ?? RELOAD_WINDOW_MS;

  let raw: string | null;
  try {
    raw = storage.getItem(RELOAD_KEY);
  } catch {
    return true;
  }
  if (!raw) return true;
  const last = Number.parseInt(raw, 10);
  if (!Number.isFinite(last)) return true;
  return now - last > windowMs;
}

export function markReloadAttempt(opts: ReloadGuardOptions = {}): void {
  const storage = opts.storage === undefined ? readStorage() : opts.storage;
  if (!storage) return;
  const now = opts.now ?? Date.now();
  try {
    storage.setItem(RELOAD_KEY, String(now));
  } catch {
    // sessionStorage can throw in private mode / quota — fail open.
  }
}

export function clearReloadMarker(): void {
  const storage = readStorage();
  if (!storage) return;
  try {
    storage.removeItem(RELOAD_KEY);
  } catch {
    // sessionStorage can throw in private mode / quota — fail open.
  }
}

// User-initiated reload from the ErrorBoundary CTA bypasses the loop guard.
export function forceReload(): void {
  if (typeof window === "undefined") return;
  markReloadAttempt();
  window.location.reload();
}

function attemptReload(error: unknown): boolean {
  if (!isChunkLoadError(error)) return false;
  if (typeof window === "undefined") return false;
  if (!shouldAttemptReload()) return false;
  markReloadAttempt();
  window.location.reload();
  return true;
}

// Three listeners because each catches a different failure mode that the
// others don't see: vite preloadError → preload helper, unhandledrejection →
// bare import() rejections, error → uncaught sync (rare but possible).
export function installChunkReloadHandlers(): () => void {
  if (typeof window === "undefined") return () => {};

  const onPreloadError = (event: Event) => {
    const payload = (event as Event & { payload?: unknown }).payload;
    if (attemptReload(payload ?? event)) {
      event.preventDefault();
    }
  };

  const onError = (event: ErrorEvent) => {
    attemptReload(event.error ?? event.message);
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    attemptReload(event.reason);
  };

  window.addEventListener("vite:preloadError", onPreloadError);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("vite:preloadError", onPreloadError);
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
