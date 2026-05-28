import { ArrowDown } from "lucide-react";
import type { CSSProperties } from "react";

import { useT } from "@/shared/lib/i18n";
import {
  PropertyGrid,
  PropertyGridSkeleton,
} from "@/features/properties/components/property-grid";
import { useSearchProperties } from "@/features/properties/hooks";
import { PillLink } from "@/shared/ui/pill-link";
import { SectionHeader } from "@/shared/ui/section-header";
import { useCalmMode } from "@/shared/hooks/use-connection";
import { useReveal } from "@/shared/hooks/use-reveal";
import { fallbackOnError } from "@/shared/lib/image";
import {
  HERO_FALLBACK,
  HERO_MOBILE_SRC,
  HERO_SIZES,
  HERO_SRCSET,
} from "./hero-source";

export function Landing() {
  return (
    <>
      <Hero />
      <FeaturedSection />
      <FinalCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative h-[calc(100svh-4rem)] min-h-[560px] overflow-hidden p-3 md:p-5">
      <Stage />
      <HeroPanel />
      <FeatureCard />
      <ScrollHint />
    </section>
  );
}

function Stage() {
  const calm = useCalmMode();

  return (
    <div className="absolute inset-3 isolate overflow-hidden rounded-[18px] bg-[#14180f] md:inset-5 md:rounded-[22px]">
      <img
        src={HERO_MOBILE_SRC}
        srcSet={HERO_SRCSET}
        sizes={HERO_SIZES}
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width={1440}
        height={960}
        onError={fallbackOnError(HERO_FALLBACK)}
        className={
          "absolute inset-[-3%] h-[106%] w-[106%] object-cover object-[50%_35%] saturate-[0.92] contrast-[1.05] brightness-[0.92]" +
          (calm ? "" : " ganitel-anim-kenburns")
        }
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

const HEADLINE_STYLE: CSSProperties = {
  fontSize: "clamp(2.5rem, 5.6vw, 5.75rem)",
};

const HERO_PANEL_DELAY: CSSProperties = { animationDelay: "0.15s" };
const SCROLL_HINT_DELAY: CSSProperties = { animationDelay: "1.4s" };

function HeroPanel() {
  const t = useT();
  return (
    <div
      style={HERO_PANEL_DELAY}
      className="ganitel-anim-fade-up absolute bottom-[38px] left-[38px] z-10 w-[min(720px,calc(100%-480px))] rounded-[22px] bg-ganitel-paper p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_40px_80px_-40px_rgba(0,0,0,0.55)] max-md:inset-x-3 max-md:bottom-3 max-md:w-auto max-md:rounded-[18px] max-md:p-6"
    >
      <div className="mb-6 grid grid-cols-[104px_1px_1fr] items-start gap-6 border-b border-dashed border-ganitel-stroke-neutral pb-6 max-sm:grid-cols-1 max-sm:gap-2 max-sm:pb-5">
        <span className="font-display pt-1 text-[12px] font-semibold uppercase leading-snug tracking-[0.18em] text-ganitel-text-title break-normal">
          {t("landing.tag.line1")}
          <br />
          {t("landing.tag.line2")}
        </span>
        <span
          aria-hidden
          className="block h-full min-h-[38px] w-px bg-[rgba(20,20,14,0.18)] max-sm:hidden"
        />
        <p className="m-0 max-w-[44ch] text-sm leading-[1.6] text-ganitel-text-subtitle">
          {t("landing.lede")}
        </p>
      </div>

      <h1
        style={HEADLINE_STYLE}
        className="font-display mb-7 mt-0 font-bold leading-[0.96] tracking-[-0.045em] text-balance text-ganitel-text-title md:mb-9"
      >
        {t("landing.title.line1")}
        <br />
        {t("landing.title.line2_pre")}{" "}
        <em className="font-italic-serif text-ganitel-secondary">
          {t("landing.title.line2_em")}
        </em>
      </h1>

      <div className="flex flex-wrap items-center gap-5">
        <PillLink to="/browse" variant="solid" arrow>
          {t("landing.cta")}
        </PillLink>
        <span className="text-xs tracking-tight text-ganitel-text-placeholder">
          {t("landing.cta.hint")} ·{" "}
          <b className="font-semibold text-ganitel-text-title">fr</b> /{" "}
          <b className="font-semibold text-ganitel-text-title">en</b>
        </span>
      </div>
    </div>
  );
}

function FeatureCard() {
  return null;
}

function ScrollHint() {
  const t = useT();
  return (
    <div
      style={SCROLL_HINT_DELAY}
      className="ganitel-anim-fade-in pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 max-md:hidden"
    >
      <span className="ganitel-anim-scroll-hint inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/65">
        <ArrowDown className="size-3" strokeWidth={1.5} aria-hidden />
        {t("landing.scroll")}
      </span>
    </div>
  );
}

function FeaturedSection() {
  const t = useT();
  const { data, isLoading, isError } = useSearchProperties({ limit: 8 });
  const items = data?.items ?? [];
  const revealRef = useReveal<HTMLDivElement>();

  if (isError) return null;
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="px-6 py-24 md:px-12 md:py-32">
      <SectionHeader
        className="mx-auto max-w-7xl"
        tag={t("landing.featured.tag")}
        title={t("landing.featured.title")}
        emphasis={t("landing.featured.title_em")}
        lede={t("landing.featured.lede")}
      />

      <div
        ref={revealRef}
        data-reveal=""
        className="mx-auto mt-16 max-w-7xl md:mt-20"
      >
        {isLoading ? (
          <PropertyGridSkeleton count={6} />
        ) : (
          <PropertyGrid items={items} />
        )}
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl justify-center md:mt-16">
        <PillLink to="/browse" variant="ghost" arrow>
          {t("landing.featured.see_all")}
        </PillLink>
      </div>
    </section>
  );
}

function FinalCTA() {
  const t = useT();
  const revealRef = useReveal<HTMLDivElement>();
  return (
    <section className="px-6 pb-24 md:px-12 md:pb-32">
      <div
        ref={revealRef}
        data-reveal=""
        className="mx-auto max-w-7xl rounded-[28px] bg-ganitel-text-title px-8 py-20 md:px-16 md:py-28"
      >
        <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-end">
          <SectionHeader
            tag={t("landing.cta_section.tag")}
            title={t("landing.cta_section.title")}
            emphasis={t("landing.cta_section.title_em")}
            align="stacked"
            inverted
            animate={false}
          />
          <PillLink
            to="/browse"
            variant="paper"
            arrow
            className="self-start md:self-end"
          >
            {t("landing.cta")}
          </PillLink>
        </div>
      </div>
    </section>
  );
}
