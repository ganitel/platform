import { describe, expect, test } from "vitest";

import {
  isChunkLoadError,
  markReloadAttempt,
  shouldAttemptReload,
} from "./chunk-reload";

function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  } satisfies Storage;
}

describe("isChunkLoadError", () => {
  test.each([
    ["TypeError: Failed to fetch dynamically imported module: /assets/x.js"],
    ["error loading dynamically imported module"],
    ["Importing a module script failed."],
    ["Loading chunk app failed."],
    ["Loading CSS chunk 42 failed."],
    ["Unable to preload CSS for /assets/index-abc.css"],
    // Chrome, when a stale chunk path resolves to the 200-HTML SPA fallback:
    [
      'Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.',
    ],
    // Firefox equivalent for the same 200-HTML response:
    [
      'Loading module from "https://ganitel.com/assets/admin.rentals-OLD.js" was blocked because of a disallowed MIME type ("text/html").',
    ],
  ])("matches: %s", (message) => {
    expect(isChunkLoadError(new Error(message))).toBe(true);
  });

  test("matches by error name even with empty message", () => {
    const err = new Error("");
    err.name = "ChunkLoadError";
    expect(isChunkLoadError(err)).toBe(true);
  });

  test("matches plain string error", () => {
    expect(
      isChunkLoadError("Failed to fetch dynamically imported module"),
    ).toBe(true);
  });

  test("matches object with message field", () => {
    expect(
      isChunkLoadError({
        message: "Failed to fetch dynamically imported module: /assets/x.js",
      }),
    ).toBe(true);
  });

  test("does not match unrelated errors", () => {
    expect(isChunkLoadError(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadError(new TypeError("Cannot read property"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError(42)).toBe(false);
    expect(isChunkLoadError({})).toBe(false);
  });
});

describe("reload loop guard", () => {
  test("allows reload when no marker is set", () => {
    const storage = memoryStorage();
    expect(shouldAttemptReload({ storage, now: 1_000 })).toBe(true);
  });

  test("blocks reload within the guard window", () => {
    const storage = memoryStorage();
    markReloadAttempt({ storage, now: 1_000 });
    expect(shouldAttemptReload({ storage, now: 5_000, windowMs: 10_000 })).toBe(
      false,
    );
  });

  test("allows reload again after the window expires", () => {
    const storage = memoryStorage();
    markReloadAttempt({ storage, now: 1_000 });
    expect(
      shouldAttemptReload({ storage, now: 12_000, windowMs: 10_000 }),
    ).toBe(true);
  });

  test("fails open when storage is unavailable", () => {
    expect(shouldAttemptReload({ storage: null })).toBe(true);
  });

  test("treats a corrupted marker as no marker", () => {
    const storage = memoryStorage();
    storage.setItem("ganitel:chunk_reload_at", "not-a-number");
    expect(shouldAttemptReload({ storage, now: 1_000 })).toBe(true);
  });
});
