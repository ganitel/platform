/**
 * Server-only fetch helper for route `loader` / `action` functions.
 *
 * Routes call this; components must keep using `apiClient` from `./client`.
 * Why a separate helper:
 *   - relative URLs can't resolve at request time on the SSR server
 *   - native fetch is plenty (no axios in the server bundle)
 *
 * The internal API URL is configurable via `INTERNAL_API_URL`. In prod, point
 * it at a private backend hostname (no public DNS hop). Defaults to the dev
 * backend port for local work.
 */

import { auth } from "@/lib/auth.server";

const baseUrl = (
  globalThis.process?.env?.INTERNAL_API_URL ?? "http://localhost:8000/api"
).replace(/\/+$/, "");

/**
 * Retrieve a signed JWT for the current session without an HTTP round-trip.
 * Returns null if the request is unauthenticated.
 */
export async function getServerToken(request: Request): Promise<string | null> {
  const authUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const tokenReq = new Request(`${authUrl}/api/auth/token`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
  const res = await auth.handler(tokenReq);
  if (!res.ok) return null;
  const body = (await res.json()) as { token?: string };
  return body.token ?? null;
}

export interface ServerFetchOptions extends RequestInit {
  /** Bearer token from `getAuth()` for routes that need an authenticated user. */
  token?: string | null;
}

export class ServerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { token, headers, ...init } = options;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");
  if (init.body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers: finalHeaders });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore — non-JSON error body
    }
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : res.statusText || "request failed";
    throw new ServerApiError(detail, res.status, body);
  }

  return res.json() as Promise<T>;
}
