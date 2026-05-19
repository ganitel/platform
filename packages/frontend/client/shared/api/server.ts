/**
 * Server-only fetch helper for route `loader` / `action` functions.
 *
 * Routes call this; components must keep using `apiClient` from `./client`.
 * SSR loaders run on a server (Vercel function in prod) — no browser origin to
 * ride, so they need the absolute backend URL via `API_BASE_URL`. Defaults to
 * the dev backend port for local work.
 */

import { createSupabaseServerClient } from "@/lib/supabase.server";

const baseUrl = (
  globalThis.process?.env?.API_BASE_URL ?? "http://localhost:8000/api"
).replace(/\/+$/, "");

/**
 * Retrieve the current Supabase session's access token from the request
 * cookies. Returns null if unauthenticated.
 */
export async function getServerToken(request: Request): Promise<string | null> {
  const { supabase } = createSupabaseServerClient(request);
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export interface ServerFetchOptions extends RequestInit {
  /** Bearer token from `getServerToken()` for routes that need an authenticated user. */
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
