/**
 * Supabase browser client + a small reactive session hook.
 *
 * The client is created once per browser tab and persists the session in
 * cookies via @supabase/ssr — that lets SSR loaders read the same session.
 *
 * Auth flow for ganitel:
 *  - Phone OTP via Supabase Auth Phone provider; Supabase calls the backend's
 *    Send SMS Hook (api.ganitel.com/api/webhooks/auth/sms), which forwards
 *    the OTP to Africa's Talking.
 *  - Google OAuth via Supabase Auth Social provider.
 *  - The session's access_token is a JWT verified by the backend against
 *    Supabase's JWKS endpoint.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { env } from "@/shared/lib/env";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(env.supabaseUrl, env.supabasePublishableKey);
  }
  return _client;
}

export function useSession(): { session: Session | null; isPending: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsPending(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setIsPending(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, isPending };
}

export type { Session };
