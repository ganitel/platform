import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { setAuthTokenGetter } from "@/shared/api/client";

// Hydrate on client. The Clerk session getter is bridged into the axios
// client once Clerk has finished booting (it sets up `window.Clerk`).
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});

if (typeof window !== "undefined") {
  setAuthTokenGetter(async () => {
    type ClerkLike = { session?: { getToken: () => Promise<string | null> } | null };
    const clerk = (window as unknown as { Clerk?: ClerkLike }).Clerk;
    return clerk?.session?.getToken() ?? null;
  });
}
