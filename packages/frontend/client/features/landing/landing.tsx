import { motion } from "framer-motion";
import { ArrowDown, Play } from "lucide-react";
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
import {
  buildSrcSet,
  transformImage,
  HERO_WIDTHS,
  HERO_SIZES,
} from "@/shared/lib/image";

const HERO_SOURCE =
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=2000&q=80&auto=format&fit=crop";
const HERO_FALLBACK = "https://picsum.photos/seed/ganitelhero/1600/1067";
const FEATURE_SOURCE =
  "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=900&q=80&auto=format&fit=crop";
const FEATURE_FALLBACK = "https://picsum.photos/seed/ganitelfeat/720/560";

const ENTRANCE_EASE = [0.2, 0.7, 0.2, 1] as const;

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
  const heroSrcSet = buildSrcSet(HERO_SOURCE, HERO_WIDTHS, 70);
  const mobileSrc = transformImage(HERO_SOURCE, { width: 720, quality: 65 });

  return (
    <div className="absolute inset-3 isolate overflow-hidden rounded-[18px] bg-[#14180f] md:inset-5 md:rounded-[22px]">
      <motion.img
        src={mobileSrc}
        srcSet={heroSrcSet}
        sizes={HERO_SIZES}
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width={1440}
        height={960}
        onError={(event) => {
          event.currentTarget.srcset = "";
          event.currentTarget.src = HERO_FALLBACK;
        }}
        className="absolute inset-[-3%] h-[106%] w-[106%] object-cover object-[50%_35%] saturate-[0.92] contrast-[1.05] brightness-[0.92]"
        animate={
          calm
            ? undefined
            : {
                scale: [1, 1.055],
                x: ["0%", "-1%"],
                y: ["0%", "-1.2%"],
              }
        }
        transition={
          calm
            ? undefined
            : {
                duration: 16,
                ease: [0.4, 0, 0.4, 1],
                repeat: Infinity,
                repeatType: "mirror",
              }
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

function HeroPanel() {
  const t = useT();
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.15, ease: ENTRANCE_EASE }}
      className="absolute bottom-[38px] left-[38px] z-10 w-[min(720px,calc(100%-480px))] rounded-[22px] bg-ganitel-paper p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_40px_80px_-40px_rgba(0,0,0,0.55)] max-md:inset-x-3 max-md:bottom-3 max-md:w-auto max-md:rounded-[18px] max-md:p-6"
    >
      <div className="mb-6 grid grid-cols-[88px_1px_1fr] items-start gap-6 border-b border-dashed border-ganitel-stroke-neutral pb-6 max-sm:grid-cols-1 max-sm:gap-2 max-sm:pb-5">
        <span className="font-display pt-1 text-[12px] font-semibold uppercase leading-snug tracking-[0.18em] text-ganitel-text-title">
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
    </motion.div>
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
          src={FEATURE_SOURCE}
          srcSet={buildSrcSet(FEATURE_SOURCE, [400, 600, 900], 75)}
          sizes="320px"
          alt=""
          loading="lazy"
          decoding="async"
          width={900}
          height={700}
          onError={(event) => {
            event.currentTarget.srcset = "";
            event.currentTarget.src = FEATURE_FALLBACK;
          }}
          className="absolute inset-0 size-full object-cover saturate-[0.95] contrast-[1.05]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgba(0,0,0,0.55))]"
        />

        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white backdrop-blur">
          <span
            aria-hidden
            className="size-1.5 animate-pulse rounded-full bg-[#f0c97a]"
          />
          {t("landing.feature.tour")}
        </span>

        <button
          type="button"
          aria-label={t("landing.play")}
          className="absolute bottom-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-ganitel-paper shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-transform hover:scale-110"
        >
          <Play
            className="ml-0.5 size-3.5 text-ganitel-text-title"
            fill="currentColor"
            strokeWidth={0}
            aria-hidden
          />
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

function ScrollHint() {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 1 }}
      className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 max-md:hidden"
    >
      <motion.span
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/65"
      >
        <ArrowDown className="size-3" strokeWidth={1.5} aria-hidden />
        {t("landing.scroll")}
      </motion.span>
    </motion.div>
  );
}

function FeaturedSection() {
  const t = useT();
  const { data, isLoading, isError } = useSearchProperties({ limit: 8 });
  const items = data?.items ?? [];

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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8, delay: 0.1, ease: ENTRANCE_EASE }}
        className="mx-auto mt-16 max-w-7xl md:mt-20"
      >
        {isLoading ? (
          <PropertyGridSkeleton count={6} />
        ) : (
          <PropertyGrid items={items} />
        )}
      </motion.div>

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
  return (
    <section className="px-6 pb-24 md:px-12 md:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8, ease: ENTRANCE_EASE }}
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
      </motion.div>
    </section>
  );
}
