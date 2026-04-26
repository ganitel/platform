import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { setAuthTokenGetter } from "@/shared/api/client";
import { queryClient } from "@/shared/api/query-client";
import { LocaleContext, type Locale } from "@/shared/lib/i18n";
import { env } from "@/shared/lib/env";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";

function ClerkTokenBridge({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken().catch(() => null));
  }, [getToken]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [locale, _setLocale] = useState<Locale>("fr");

  return (
    <ClerkProvider
      publishableKey={env.clerkPublishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <ClerkTokenBridge>
        <QueryClientProvider client={queryClient}>
          <LocaleContext.Provider value={locale}>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster />
            </TooltipProvider>
          </LocaleContext.Provider>
        </QueryClientProvider>
      </ClerkTokenBridge>
    </ClerkProvider>
  );
}
