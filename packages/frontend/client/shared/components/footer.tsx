import { Link } from "react-router";

import type { TranslationKey } from "@/shared/lib/i18n";
import { useT } from "@/shared/lib/i18n";

const FOOTER_LINKS: ReadonlyArray<{ to: string; labelKey: TranslationKey }> = [
  { to: "/about", labelKey: "nav.about" },
  { to: "/faq", labelKey: "footer.faq" },
  { to: "/terms", labelKey: "footer.terms" },
  { to: "/privacy", labelKey: "footer.privacy" },
];

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="footer-mobile-safe border-t border-ganitel-stroke-neutral px-6 pt-8 md:px-12 md:pt-10">
      {/* Compact mobile footer — sits above the fixed bottom-nav. */}
      <div className="mx-auto flex max-w-7xl flex-col gap-3 pb-2 text-[11px] text-ganitel-text-placeholder md:hidden">
        <div className="flex items-center gap-2 text-ganitel-text-title">
          <span className="grid size-4 rotate-[-4deg] place-items-center rounded-md bg-ganitel-text-title text-[9px] font-extrabold leading-none text-ganitel-paper">
            G
          </span>
          <span className="font-display text-[13px] font-extrabold tracking-[-0.04em]">
            ganitel
          </span>
          <span>· {year}</span>
        </div>
        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-1 tracking-tight"
          aria-label="Footer"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hover:text-ganitel-text-title"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
        <p className="leading-snug">{t("footer.regions")}</p>
      </div>

      <div className="mx-auto hidden max-w-7xl flex-wrap items-center justify-between gap-6 text-xs text-ganitel-text-placeholder md:flex">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-ganitel-text-title"
          aria-label="ganitel"
        >
          <span className="grid size-5 rotate-[-4deg] place-items-center rounded-md bg-ganitel-text-title text-[10px] font-extrabold leading-none text-ganitel-paper">
            G
          </span>
          <span className="font-display text-[14px] font-extrabold tracking-[-0.04em]">
            ganitel
          </span>
          <span className="text-ganitel-text-placeholder">· {year}</span>
        </Link>
        <nav
          className="flex flex-wrap items-center gap-x-6 gap-y-2 tracking-tight"
          aria-label="Footer"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hover:text-ganitel-text-title"
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <span>{t("footer.regions")}</span>
        </nav>
      </div>
    </footer>
  );
}
