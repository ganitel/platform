import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { setAuthTokenGetter } from "@/shared/api/client";

// Fetch the better-auth JWT from the /token endpoint on every request.
// The endpoint validates the session cookie and returns a signed JWT; if the
// user is not signed in it returns 401 and we return null.
setAuthTokenGetter(async () => {
  const res = await fetch("/api/auth/token", { credentials: "include" });
  if (!res.ok) return null;
  const { token } = (await res.json()) as { token?: string };
  return token ?? null;
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
