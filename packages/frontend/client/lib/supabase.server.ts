/**
 * Supabase server client for React Router SSR loaders/actions.
 *
 * Reads the session from the incoming request's cookies and surfaces any
 * Set-Cookie writes via the returned headers object so the response can carry
 * them back to the browser (token refresh, sign-out, etc.).
 */

import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseServerClient(request: Request): {
  supabase: SupabaseClient;
  headers: Headers;
} {
  const headers = new Headers();
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "").map(
          ({ name, value }) => ({ name, value: value ?? "" }),
        );
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          headers.append(
            "Set-Cookie",
            serializeCookieHeader(name, value, options),
          );
        });
      },
    },
  });

  return { supabase, headers };
}
