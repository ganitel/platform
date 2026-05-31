import { Link } from "react-router";
import type { ReactNode } from "react";

import { useT } from "@/shared/lib/i18n";

/**
 * Two-pane layout shared by sign-in and sign-up.
 * Left pane: brand panel on the warm-dark primary.
 * Right pane: auth form centered on a neutral background.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const t = useT();

  return (
    <div className="flex min-h-screen flex-col bg-ganitel-background-neutral1 lg:flex-row">
      {/* Brand panel */}
      <aside
        className="relative isolate flex min-h-[34vh] flex-col justify-between overflow-hidden bg-ganitel-primary px-6 py-10 text-ganitel-text-button md:px-12 lg:min-h-screen lg:w-[42%] lg:flex-shrink-0"
        aria-hidden="true"
      >
        <div
          className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-ganitel-secondary/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 size-[360px] rounded-full bg-ganitel-secondary/10 blur-3xl"
          aria-hidden
        />

        <Link
          to="/"
          className="relative z-10 inline-flex w-fit text-[32px] leading-none tracking-[-0.01em] text-ganitel-text-button"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ganitel
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ganitel-secondary">
            {subtitle}
          </p>
          <h1 className="mt-4 text-[36px] leading-[1.04] tracking-[-0.01em] md:text-[52px]">
            {title}
          </h1>
          <p className="mt-4 text-sm text-ganitel-text-button/70">
            {t("auth.layout.tagline")}
          </p>
        </div>

        <p className="relative z-10 hidden text-xs text-ganitel-text-button/50 lg:block">
          © {new Date().getFullYear()} ganitel
        </p>
      </aside>

      {/* Auth card */}
      <main className="flex flex-1 items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
