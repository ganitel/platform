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
import {
  useCallback,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { Route } from "./+types/root";

import {
  LocaleContext,
  SetLocaleContext,
  localeFromAcceptLanguage,
  localeFromCookie,
  persistLocale,
  t as translate,
  type Locale,
} from "@/shared/lib/i18n";
import { forceReload, isChunkLoadError } from "@/shared/lib/chunk-reload";
import { NavigationProgress } from "@/shared/components/navigation-progress";
import { env } from "@/shared/lib/env";
import { organizationJsonLd, websiteJsonLd } from "@/shared/lib/seo";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";
import indexCss from "@/styles/index.css?url";
import interFontUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
import serifFontUrl from "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url";

function apiOrigin(): string | null {
  if (!/^https?:\/\//.test(env.apiBaseUrl)) return null;
  try {
    return new URL(env.apiBaseUrl).origin;
  } catch {
    return null;
  }
}

export const links: Route.LinksFunction = () => {
  const api = apiOrigin();
  return [
    { rel: "stylesheet", href: indexCss },
    {
      rel: "preconnect",
      href: "https://images.unsplash.com",
      crossOrigin: "anonymous",
    },
    ...(api
      ? [
          { rel: "preconnect", href: api, crossOrigin: "anonymous" as const },
          { rel: "dns-prefetch", href: api },
        ]
      : []),
    {
      rel: "preload",
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
      href: interFontUrl,
    },
    {
      rel: "preload",
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
      href: serifFontUrl,
    },
    { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    { rel: "icon", href: "/favicon.ico", sizes: "any" },
    {
      rel: "apple-touch-icon",
      href: "/icons/apple-touch-icon.png",
      sizes: "180x180",
    },
  ];
};

export const meta: Route.MetaFunction = () => [
  { title: "Ganitel — séjours et expériences" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const pinned = localeFromCookie(request.headers.get("cookie"));
  const locale =
    pinned ?? localeFromAcceptLanguage(request.headers.get("accept-language"));
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
      <body className="text-ganitel-text-title antialiased">
        <NavigationProgress />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const NEVER_CHANGES = () => () => {};

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
  // Auto-detected locale: a pinned cookie wins, otherwise the browser
  // preference. Server snapshot matches the loader to avoid a hydration flash.
  const detected = useSyncExternalStore<Locale>(
    NEVER_CHANGES,
    () =>
      localeFromCookie(document.cookie) ??
      localeFromAcceptLanguage(navigator.language),
    () => loaderData.locale,
  );
  const [override, setOverride] = useState<Locale | null>(null);
  const locale = override ?? detected;

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    setOverride(next);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleContext.Provider value={locale}>
        <SetLocaleContext.Provider value={setLocale}>
          <TooltipProvider delayDuration={200}>
            <Outlet />
            <Toaster />
          </TooltipProvider>
        </SetLocaleContext.Provider>
      </LocaleContext.Provider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const rootData = useRouteLoaderData("root") as
    | { locale?: Locale }
    | undefined;
  const locale: Locale =
    rootData?.locale ??
    (typeof navigator !== "undefined"
      ? localeFromAcceptLanguage(navigator.language)
      : "fr");
  const isResponse = isRouteErrorResponse(error);
  const isChunkError = !isResponse && isChunkLoadError(error);

  if (isChunkError) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold text-ganitel-text-title">
          {translate("error.outdated.heading", locale)}
        </h1>
        <p className="mt-2 text-sm text-ganitel-text-subtitle">
          {translate("error.outdated.detail", locale)}
        </p>
        <button
          type="button"
          onClick={forceReload}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-ganitel-text-title px-5 text-sm font-medium text-ganitel-paper transition-colors hover:bg-ganitel-text-title/90"
        >
          {translate("error.outdated.cta", locale)}
        </button>
      </main>
    );
  }

  const status = isResponse ? error.status : 500;
  const heading = isResponse
    ? error.statusText ||
      `${translate("common.error.heading", locale)} ${status}`
    : translate("common.error.heading", locale);
  const detail =
    isResponse && typeof error.data === "string"
      ? error.data
      : import.meta.env.DEV && error instanceof Error
        ? error.message
        : translate("common.error.detail", locale);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-7xl font-semibold tracking-tight text-ganitel-text-title">
        {status}
      </p>
      <h1 className="mt-4 text-xl font-semibold text-ganitel-text-title">
        {heading}
      </h1>
      <p className="mt-2 text-sm text-ganitel-text-subtitle">{detail}</p>
    </main>
  );
}
