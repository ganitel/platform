import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { setAuthTokenGetter } from "@/shared/api/client";
import { getSupabase } from "@/lib/supabase";

// Forward the current Supabase session's access token as a Bearer header
// on every backend call. Supabase auto-refreshes in the background;
// we just read whatever's current at request time.
setAuthTokenGetter(async () => {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
