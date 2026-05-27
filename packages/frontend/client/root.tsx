import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import type { Route } from "./+types/root";

import {
  LocaleContext,
  localeFromAcceptLanguage,
  type Locale,
} from "@/shared/lib/i18n";
import { NavigationProgress } from "@/shared/components/navigation-progress";
import { env } from "@/shared/lib/env";
import { organizationJsonLd, websiteJsonLd } from "@/shared/lib/seo";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";
import indexCss from "@/styles/index.css?url";

function apiOrigin(): string | null {
  if (!/^https?:\/\//.test(env.apiBaseUrl)) return null;
  try {
    return new URL(env.apiBaseUrl).origin;
  } catch {
    return null;
  }
}

const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:wght@300;400;500;600;700&display=swap";

export const links: Route.LinksFunction = () => {
  const api = apiOrigin();
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    { rel: "stylesheet", href: GOOGLE_FONTS_HREF },
    { rel: "stylesheet", href: indexCss },
    ...(api
      ? [
          { rel: "preconnect", href: api, crossOrigin: "anonymous" as const },
          { rel: "dns-prefetch", href: api },
        ]
      : []),
    { rel: "icon", href: "/favicon.ico", sizes: "any" },
    { rel: "apple-touch-icon", href: "/og/default.png" },
  ];
};

export const meta: Route.MetaFunction = () => [
  { title: "ganitel — séjours et expériences" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(
    request.headers.get("accept-language"),
  );
  return { locale };
}

export function Layout({ children }: { children: ReactNode }) {
  const rootData = useRouteLoaderData("root") as
    | { locale?: Locale }
    | undefined;
  const lang = rootData?.locale ?? "fr";

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        <meta name="theme-color" content="#18100C" />
        <Meta />
        <Links />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="bg-ganitel-paper text-ganitel-text-title antialiased">
        <NavigationProgress />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider value={loaderData.locale}>
        <TooltipProvider delayDuration={200}>
          <Outlet />
          <Toaster />
        </TooltipProvider>
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isResponse = isRouteErrorResponse(error);
  const status = isResponse ? error.status : 500;
  const heading = isResponse
    ? error.statusText || `Erreur ${status}`
    : "Une erreur s'est produite";
  const detail =
    isResponse && typeof error.data === "string"
      ? error.data
      : import.meta.env.DEV && error instanceof Error
        ? error.message
        : "Veuillez réessayer plus tard.";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-infoma text-7xl text-ganitel-text-title">{status}</p>
      <h1 className="mt-4 text-xl font-semibold text-ganitel-text-title">
        {heading}
      </h1>
      <p className="mt-2 text-sm text-ganitel-text-subtitle">{detail}</p>
    </main>
  );
}
