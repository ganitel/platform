/**
 * Root document. Rendered on every request — server-side first, then hydrated.
 *
 * Owns:
 *   - `<html>` skeleton + `<Links>` (route stylesheets) and `<Meta>` (route SEO).
 *   - Cross-cutting providers (Clerk, TanStack Query, Tooltip).
 *   - The single `<Outlet />` where every route renders.
 */
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import { ClerkProvider } from "@clerk/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import type { Route } from "./+types/root";

import { LocaleContext, type Locale } from "@/shared/lib/i18n";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";
import indexCss from "@/styles/index.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: indexCss },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
];

export const meta: Route.MetaFunction = () => [
  { charSet: "utf-8" },
  { name: "viewport", content: "width=device-width,initial-scale=1" },
  { name: "theme-color", content: "#18100C" },
  { title: "Ganitel — séjours et expériences" },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-ganitel-paper text-ganitel-text-title antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  // QueryClient lives per-request in module scope on the server, per-tab on the client.
  // Using `useState` ensures a stable instance across re-renders without leaking
  // between requests on the server (each request gets a fresh component tree).
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
  const [locale] = useState<Locale>("fr");

  return (
    <ClerkProvider
      loaderData={loaderData}
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <QueryClientProvider client={queryClient}>
        <LocaleContext.Provider value={locale}>
          <TooltipProvider delayDuration={200}>
            <Outlet />
            <Toaster />
          </TooltipProvider>
        </LocaleContext.Provider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

/**
 * Top-level error boundary.
 * Returns a route response (4xx/5xx) for HTTP-shaped errors, falls back to a
 * generic message for thrown JS errors. Rendered inside `Layout`.
 */
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
      <h1 className="mt-4 text-xl font-semibold text-ganitel-text-title">{heading}</h1>
      <p className="mt-2 text-sm text-ganitel-text-subtitle">{detail}</p>
    </main>
  );
}

/**
 * Clerk's middleware reads the session JWT once per request and stashes auth
 * state on the request context. It must run before any loader that calls
 * `rootAuthLoader` or `getAuth`. Gated behind RR's `v8_middleware` future
 * flag (see react-router.config.ts).
 *
 * Server-only imports — RR's vite plugin tree-shakes these out of the client
 * bundle because they're only referenced from server-only exports.
 */
import { clerkMiddleware, rootAuthLoader } from "@clerk/react-router/server";

export const middleware: Route.MiddlewareFunction[] = [clerkMiddleware()];

export async function loader(args: Route.LoaderArgs) {
  return rootAuthLoader(args);
}
