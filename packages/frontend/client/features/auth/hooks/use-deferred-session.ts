import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

export function useDeferredSession(): {
  session: Session | null;
  isPending: boolean;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const { getSupabase } = await import("@/lib/supabase");
      if (cancelled) return;
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setIsPending(false);
      const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
        if (cancelled) return;
        setSession(s);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { session, isPending };
}
