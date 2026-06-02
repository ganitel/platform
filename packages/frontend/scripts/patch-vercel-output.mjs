/**
 * Make missing `/assets/*` return a real 404 instead of the 200-HTML SPA
 * fallback.
 *
 * Why: content-hashed chunk filenames change on every deploy. A tab still open
 * on the previous deploy requests an old chunk by its old hash; without this,
 * Vercel's catch-all serves the prerendered index (HTTP 200, text/html). The
 * browser then rejects that as a module on MIME grounds, the dynamic import
 * fails, and `vite:preloadError` never fires (the fetch "succeeded" with 200),
 * so the chunk-reload recovery can't kick in cleanly. A genuine 404 lets the
 * browser surface a real preload error that the recovery handles.
 *
 * How: the Build Output API (v3) routes are evaluated top to bottom.
 * `{ handle: "filesystem" }` serves real static files (the actual hashed
 * chunks) first; we insert a 404 for `/assets/*` immediately after it, so only
 * paths that did NOT match a real file are rejected. Real assets are untouched.
 *
 * Idempotent and defensive: if the expected structure isn't found, it logs and
 * leaves the config unchanged rather than risk breaking routing.
 */

import { readFileSync, writeFileSync } from "node:fs";

const CONFIG_PATH = ".vercel/output/config.json";
const ASSETS_404 = { src: "^/assets/(.*)$", status: 404 };

function main() {
  let config;
  try {
    config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch (error) {
    console.warn(
      `[patch-vercel-output] skip: cannot read ${CONFIG_PATH}: ${error.message}`,
    );
    return;
  }

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    console.warn("[patch-vercel-output] skip: config is not a JSON object");
    return;
  }

  const routes = config.routes;
  if (!Array.isArray(routes)) {
    console.warn("[patch-vercel-output] skip: config.routes is not an array");
    return;
  }

  const alreadyPatched = routes.some(
    (route) => route?.src === ASSETS_404.src && route?.status === 404,
  );
  if (alreadyPatched) {
    console.log("[patch-vercel-output] already patched; nothing to do");
    return;
  }

  const filesystemIndex = routes.findIndex(
    (route) => route?.handle === "filesystem",
  );
  if (filesystemIndex === -1) {
    console.warn(
      "[patch-vercel-output] skip: no { handle: 'filesystem' } route found — " +
        "Build Output schema may have changed; leaving config untouched",
    );
    return;
  }

  routes.splice(filesystemIndex + 1, 0, ASSETS_404);
  writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
  console.log(
    `[patch-vercel-output] inserted 404 for /assets/* after filesystem (route #${filesystemIndex + 1})`,
  );
}

main();
