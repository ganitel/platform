import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { setAuthTokenGetter } from "@/shared/api/client";
import { installChunkReloadHandlers } from "@/shared/lib/chunk-reload";

installChunkReloadHandlers();

setAuthTokenGetter(async () => {
  const { getSupabase } = await import("@/lib/supabase");
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
