import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { UserButton, useAuth, useClerk } from "@clerk/react-router";
import type { CSSProperties } from "react";

import { useT } from "@/shared/lib/i18n";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=2600&q=85&auto=format&fit=crop";
const HERO_FALLBACK = "https://picsum.photos/seed/ganitelhero/2400/1600";
const FEATURE_IMAGE =
  "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=900&q=85&auto=format&fit=crop";
const FEATURE_FALLBACK = "https://picsum.photos/seed/ganitelfeat/900/700";

const ENTRANCE_EASE = [0.2, 0.7, 0.2, 1] as const;

export function Landing() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[#0a0c08] p-5">
      <Stage />
      <NavStrip />
      <HeroPanel />
      <FeatureCard />
    </div>
  );
}

function Stage() {
  return (
    <div className="absolute inset-5 isolate overflow-hidden rounded-[22px] bg-[#14180f]">
      <motion.img
        src={HERO_IMAGE}
        alt=""
        loading="eager"
        decoding="async"
        onError={(event) => {
          event.currentTarget.src = HERO_FALLBACK;
        }}
        className="absolute inset-[-3%] h-[106%] w-[106%] object-cover object-[50%_35%] saturate-[0.92] contrast-[1.05] brightness-[0.92]"
        animate={{
          scale: [1, 1.055],
          x: ["0%", "-1%"],
          y: ["0%", "-1.2%"],
        }}
        transition={{
          duration: 16,
          ease: [0.4, 0, 0.4, 1],
          repeat: Infinity,
          repeatType: "mirror",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_70%_38%,rgba(220,140,60,0.22),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,rgba(8,10,6,0.55))]"
      />
      <div
        aria-hidden
        className="paper-grain pointer-events-none absolute inset-0 opacity-55 mix-blend-overlay"
      />
    </div>
  );
}

function NavStrip() {
  const t = useT();
  const { isLoaded, isSignedIn } = useAuth();
  // Force a render once Clerk has booted; first paint (incl. SSR) shows
  // the signed-out chrome to avoid a flash for anonymous visitors.
  useClerk();

  return (
    <motion.header
      initial={{ y: "-130%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.1, ease: ENTRANCE_EASE }}
      className="absolute left-1/2 top-5 z-20 grid w-[min(1240px,calc(100%-80px))] -translate-x-1/2 grid-cols-[auto_1fr_auto] items-center gap-8 rounded-b-[22px] bg-ganitel-paper px-3.5 py-3 pl-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_28px_60px_-32px_rgba(0,0,0,0.55)]"
    >
      <Link to="/" className="inline-flex items-center gap-2 text-ganitel-text-title" aria-label="Ganitel">
        <span className="grid size-7 -rotate-[4deg] place-items-center rounded-lg bg-ganitel-text-title text-[13px] font-extrabold leading-none text-ganitel-paper">
          G
        </span>
        <span className="font-display text-[22px] font-extrabold leading-none tracking-[-0.045em]">
          Ganitel
        </span>
      </Link>

      <nav className="hidden justify-center gap-9 pl-2 md:inline-flex" aria-label="Primary">
        <NavItem to="/" active>
          {t("nav.home")}
        </NavItem>
        <NavItem to="/browse">{t("landing.nav.properties")}</NavItem>
        <NavItem to="/browse">{t("landing.nav.experiences")}</NavItem>
      </nav>

      <div className="inline-flex items-center gap-1.5 justify-self-end">
        {isLoaded && isSignedIn ? (
          <>
            <Link
              to="/browse"
              className="inline-flex items-center rounded-full bg-ganitel-text-title px-4 py-2.5 text-[13px] font-medium tracking-tight text-ganitel-paper transition-colors hover:bg-ganitel-text-subtitle"
            >
              {t("nav.browse")}
            </Link>
            <UserButton />
          </>
        ) : (
          <>
            <Link
              to="/sign-up"
              className="inline-flex items-center rounded-full border border-[rgba(20,20,14,0.18)] px-4 py-2.5 text-[13px] font-medium tracking-tight text-ganitel-text-title transition-colors hover:border-ganitel-text-title hover:bg-[rgba(20,20,14,0.05)]"
            >
              {t("common.signup")}
            </Link>
            <Link
              to="/sign-in"
              className="inline-flex items-center rounded-full bg-ganitel-text-title px-4 py-2.5 text-[13px] font-medium tracking-tight text-ganitel-paper transition-colors hover:bg-ganitel-text-subtitle"
            >
              {t("common.signin")}
            </Link>
          </>
        )}
      </div>
    </motion.header>
  );
}

function NavItem({
  to,
  active,
  children,
}: {
  to: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={
        "group relative pb-1 pt-1.5 text-sm tracking-tight transition-colors duration-200 " +
        (active
          ? "font-semibold text-ganitel-text-title"
          : "font-medium text-ganitel-text-placeholder hover:text-ganitel-text-title")
      }
    >
      {children}
      {active ? (
        <span
          aria-hidden
          className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-ganitel-text-title"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-ganitel-text-title transition-transform duration-300 ease-out group-hover:scale-x-100"
        />
      )}
    </Link>
  );
}

const HEADLINE_STYLE: CSSProperties = {
  fontSize: "clamp(2.75rem, 5.6vw, 5.75rem)",
};

function HeroPanel() {
  const t = useT();
  return (
    <motion.main
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.15, ease: ENTRANCE_EASE }}
      className="absolute bottom-[38px] left-[38px] z-10 w-[min(720px,calc(100%-480px))] rounded-[22px] bg-ganitel-paper p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_40px_80px_-40px_rgba(0,0,0,0.55)] max-md:inset-x-5 max-md:bottom-5 max-md:w-auto max-md:p-7"
    >
      <div className="mb-7 grid grid-cols-[88px_1px_1fr] items-start gap-6 border-b border-dashed border-ganitel-stroke-neutral pb-7 max-sm:grid-cols-1 max-sm:gap-3">
        <span className="font-display pt-1 text-[12px] font-semibold uppercase leading-snug tracking-[0.18em] text-ganitel-text-title">
          {t("landing.tag.line1")}
          <br />
          {t("landing.tag.line2")}
        </span>
        <span aria-hidden className="block h-full min-h-[38px] w-px bg-[rgba(20,20,14,0.18)] max-sm:hidden" />
        <p className="m-0 max-w-[44ch] text-sm leading-[1.6] text-ganitel-text-subtitle">
          {t("landing.lede")}
        </p>
      </div>

      <h1
        style={HEADLINE_STYLE}
        className="font-display mb-9 mt-0 font-bold leading-[0.96] tracking-[-0.045em] text-balance text-ganitel-text-title"
      >
        {t("landing.title.line1")}
        <br />
        {t("landing.title.line2_pre")}{" "}
        <em className="font-italic-serif text-ganitel-secondary">
          {t("landing.title.line2_em")}
        </em>
      </h1>

      <div className="flex flex-wrap items-center gap-5">
        <Link
          to="/browse"
          className="group inline-flex items-center gap-3.5 rounded-full bg-ganitel-text-title px-7 py-4 text-sm font-medium tracking-tight text-ganitel-paper shadow-[0_18px_36px_-16px_rgba(20,20,14,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-ganitel-moss"
        >
          <span>{t("landing.cta")}</span>
          <ArrowRight
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
        <span className="text-xs tracking-tight text-ganitel-text-placeholder">
          {t("landing.cta.hint")} ·{" "}
          <b className="font-semibold text-ganitel-text-title">fr</b> /{" "}
          <b className="font-semibold text-ganitel-text-title">en</b>
        </span>
      </div>
    </motion.main>
  );
}

function FeatureCard() {
  const t = useT();
  return (
    <motion.aside
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.35, ease: ENTRANCE_EASE }}
      className="absolute bottom-[38px] right-[38px] z-10 w-80 rounded-[22px] bg-ganitel-paper p-3.5 pb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_40px_80px_-40px_rgba(0,0,0,0.55)] max-lg:hidden"
      aria-label="Featured stay"
    >
      <div className="relative mb-4 aspect-[4/3.1] overflow-hidden rounded-[14px] bg-[#1c2218]">
        <img
          src={FEATURE_IMAGE}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.currentTarget.src = FEATURE_FALLBACK;
          }}
          className="absolute inset-0 size-full object-cover saturate-[0.95] contrast-[1.05]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgba(0,0,0,0.55))]"
        />

        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white backdrop-blur">
          <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-[#f0c97a]" />
          {t("landing.feature.tour")}
        </span>

        <button
          type="button"
          aria-label={t("landing.play")}
          className="absolute bottom-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-ganitel-paper shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-transform hover:scale-110"
        >
          <Play className="ml-0.5 size-3.5 text-ganitel-text-title" fill="currentColor" strokeWidth={0} aria-hidden />
        </button>
      </div>

      <div className="px-1.5">
        <h3 className="font-display m-0 mb-2 inline-flex items-center gap-2 text-[19px] font-bold tracking-[-0.025em] text-ganitel-text-title">
          {t("landing.feature.title")}
          <span
            title={t("landing.info")}
            className="font-italic-serif grid size-4 cursor-help place-items-center rounded-full border border-[rgba(20,20,14,0.18)] text-[11px] text-ganitel-text-placeholder"
          >
            i
          </span>
        </h3>
        <p className="m-0 max-w-[30ch] text-[13px] leading-[1.5] text-ganitel-text-subtitle">
          {t("landing.feature.caption")}
        </p>
      </div>
    </motion.aside>
  );
}
