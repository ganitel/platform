import { Link } from "react-router";

import { useT } from "@/shared/lib/i18n";

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="footer-mobile-safe border-t border-ganitel-stroke-neutral px-6 pt-8 md:px-12 md:pt-10">
      {/* Compact mobile footer — sits above the fixed bottom-nav. */}
      <div className="mx-auto flex max-w-7xl flex-col gap-2 text-[11px] text-ganitel-text-placeholder md:hidden">
        <div className="flex items-center gap-2 text-ganitel-text-title">
          <span className="grid size-4 rotate-[-4deg] place-items-center rounded-md bg-ganitel-text-title text-[9px] font-extrabold leading-none text-ganitel-paper">
            G
          </span>
          <span className="font-display text-[13px] font-extrabold tracking-[-0.04em]">
            Ganitel
          </span>
          <span>· {year}</span>
        </div>
        <p className="leading-snug">{t("footer.regions")}</p>
      </div>

      <div className="mx-auto hidden max-w-7xl flex-wrap items-center justify-between gap-6 text-xs text-ganitel-text-placeholder md:flex">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-ganitel-text-title"
          aria-label="Ganitel"
        >
          <span className="grid size-5 rotate-[-4deg] place-items-center rounded-md bg-ganitel-text-title text-[10px] font-extrabold leading-none text-ganitel-paper">
            G
          </span>
          <span className="font-display text-[14px] font-extrabold tracking-[-0.04em]">
            Ganitel
          </span>
          <span className="text-ganitel-text-placeholder">· {year}</span>
        </Link>
        <nav
          className="flex items-center gap-6 tracking-tight"
          aria-label="Footer"
        >
          <Link to="/about" className="hover:text-ganitel-text-title">
            {t("nav.about")}
          </Link>
          <span>{t("footer.regions")}</span>
        </nav>
      </div>
    </footer>
  );
}
