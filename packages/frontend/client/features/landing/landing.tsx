import { BadgeCheck, Compass, ShieldCheck, Sparkles } from "lucide-react";

import type { TranslationKey } from "@/shared/lib/i18n";
import { useT } from "@/shared/lib/i18n";
import {
  PropertyGrid,
  PropertyGridSkeleton,
} from "@/features/properties/components/property-grid";
import { useSearchProperties } from "@/features/properties/hooks";
import { PillLink } from "@/shared/ui/pill-link";
import { SectionHeader } from "@/shared/ui/section-header";
import { useReveal } from "@/shared/hooks/use-reveal";
import { usePrelaunch } from "@/shared/hooks/use-prelaunch";
import {
  buildSrcSet,
  fallbackOnError,
  transformImage,
  CARD_WIDTHS,
} from "@/shared/lib/image";
import {
  DEST_EAST_FALLBACK,
  DEST_EAST_SOURCE,
  DEST_HIGHLANDS_FALLBACK,
  DEST_HIGHLANDS_SOURCE,
  DEST_LITTORAL_FALLBACK,
  DEST_LITTORAL_SOURCE,
  DEST_SIZES,
  DEST_SW_FALLBACK,
  DEST_SW_SOURCE,
  HERO_FALLBACK,
  HERO_MOBILE_SRC,
  HERO_SIZES,
  HERO_SRCSET,
  VISION_FALLBACK,
  VISION_SOURCE,
} from "./hero-source";

const HERO_CTA_DELAY = { animationDelay: "0.45s" };

const PROMISES = [
  { key: "security", labelKey: "about.promise.security", icon: ShieldCheck },
  { key: "convenience", labelKey: "about.promise.convenience", icon: Compass },
  { key: "verified", labelKey: "about.promise.verified", icon: BadgeCheck },
  { key: "premium", labelKey: "about.promise.premium", icon: Sparkles },
] as const satisfies ReadonlyArray<{
  key: string;
  labelKey: TranslationKey;
  icon: typeof ShieldCheck;
}>;

interface Destination {
  key: string;
  source: string;
  fallback: string;
  titleKey: TranslationKey;
  blurbKey: TranslationKey;
  altKey: TranslationKey;
}

const DESTINATIONS: ReadonlyArray<Destination> = [
  {
    key: "sw",
    source: DEST_SW_SOURCE,
    fallback: DEST_SW_FALLBACK,
    titleKey: "landing.destinations.sw.title",
    blurbKey: "landing.destinations.sw.blurb",
    altKey: "landing.alt.sw",
  },
  {
    key: "highlands",
    source: DEST_HIGHLANDS_SOURCE,
    fallback: DEST_HIGHLANDS_FALLBACK,
    titleKey: "landing.destinations.highlands.title",
    blurbKey: "landing.destinations.highlands.blurb",
    altKey: "landing.alt.highlands",
  },
  {
    key: "east",
    source: DEST_EAST_SOURCE,
    fallback: DEST_EAST_FALLBACK,
    titleKey: "landing.destinations.east.title",
    blurbKey: "landing.destinations.east.blurb",
    altKey: "landing.alt.east",
  },
  {
    key: "littoral",
    source: DEST_LITTORAL_SOURCE,
    fallback: DEST_LITTORAL_FALLBACK,
    titleKey: "landing.destinations.littoral.title",
    blurbKey: "landing.destinations.littoral.blurb",
    altKey: "landing.alt.littoral",
  },
];

interface ImpactCard {
  key: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

const IMPACT_CARDS: ReadonlyArray<ImpactCard> = [
  {
    key: "renewal",
    titleKey: "about.impact.card.renewal.title",
    bodyKey: "about.impact.card.renewal.body",
  },
  {
    key: "guides",
    titleKey: "about.impact.card.guides.title",
    bodyKey: "about.impact.card.guides.body",
  },
  {
    key: "transport",
    titleKey: "about.impact.card.transport.title",
    bodyKey: "about.impact.card.transport.body",
  },
];

export function Landing() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Destinations />
      <FeaturedStays />
      <WhyGanitel />
      <VisionMoment />
      <Closing />
    </>
  );
}

function Hero() {
  const t = useT();
  const isPrelaunch = usePrelaunch();
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
      <img
        src={HERO_MOBILE_SRC}
        srcSet={HERO_SRCSET}
        sizes={HERO_SIZES}
        alt={t("landing.alt.hero")}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width={1440}
        height={960}
        onError={fallbackOnError(HERO_FALLBACK)}
        className="ganitel-anim-kenburns absolute inset-[-3%] h-[106%] w-[106%] object-cover saturate-[0.92] brightness-[0.92]"
      />
      <div aria-hidden className="absolute inset-0 bg-ganitel-primary/45" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 text-center">
        <SectionHeader
          level="h1"
          align="center"
          inverted
          animate={false}
          tag={t("landing.hero.tag")}
          title={t("landing.hero.title")}
          emphasis={t("landing.hero.title_em")}
          lede={t("landing.hero.lede")}
        />
        <div
          style={HERO_CTA_DELAY}
          className="ganitel-anim-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {isPrelaunch ? (
            <>
              <PillLink to="/join" variant="paper" arrow>
                {t("join.submit")}
              </PillLink>
              <PillLink to="/browse" variant="ghost-inverted">
                {t("landing.hero.cta.browse")}
              </PillLink>
            </>
          ) : (
            <PillLink to="/browse" variant="paper" arrow>
              {t("landing.hero.cta.browse")}
            </PillLink>
          )}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const t = useT();
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="bg-ganitel-surface px-6 py-20 md:px-12 md:py-24">
      <div ref={ref} data-reveal="" className="mx-auto max-w-7xl">
        <SectionHeader
          align="center"
          tag={t("landing.trust.tag")}
          title={t("landing.trust.title")}
          emphasis={t("landing.trust.title_em")}
        />
        <ul className="m-0 mt-12 grid list-none grid-cols-2 gap-8 p-0 sm:grid-cols-4">
          {PROMISES.map(({ key, labelKey, icon: Icon }) => (
            <li
              key={key}
              className="flex flex-col items-center gap-3 text-center"
            >
              <span className="grid size-14 place-items-center rounded-full bg-ganitel-sage-soft">
                <Icon
                  className="size-6 text-ganitel-sage"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <span className="text-base font-semibold tracking-tight text-ganitel-text-title">
                {t(labelKey)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Destinations() {
  const t = useT();
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="px-6 py-20 md:px-12 md:py-28">
      <div ref={ref} data-reveal="" className="mx-auto max-w-7xl">
        <SectionHeader
          tag={t("landing.destinations.tag")}
          title={t("landing.destinations.title")}
          emphasis={t("landing.destinations.title_em")}
          lede={t("landing.destinations.lede")}
        />
        <ul className="m-0 mt-12 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((dest) => (
            <li key={dest.key} className="m-0 p-0">
              <a
                href="/browse"
                className="group block overflow-hidden rounded-2xl bg-ganitel-surface-2"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={transformImage(dest.source, {
                      width: 600,
                      quality: 75,
                    })}
                    srcSet={buildSrcSet(dest.source, CARD_WIDTHS, 75)}
                    sizes={DEST_SIZES}
                    alt={t(dest.altKey)}
                    loading="lazy"
                    decoding="async"
                    width={900}
                    height={1125}
                    onError={fallbackOnError(dest.fallback)}
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col gap-2 p-6">
                  <h3 className="m-0 text-xl font-bold leading-tight tracking-[-0.02em] text-ganitel-text-title">
                    {t(dest.titleKey)}
                  </h3>
                  <p className="m-0 text-sm leading-[1.5] text-ganitel-text-subtitle">
                    {t(dest.blurbKey)}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FeaturedStays() {
  const t = useT();
  const { data, isLoading, isError } = useSearchProperties({ limit: 8 });
  const items = data?.items ?? [];
  const revealRef = useReveal<HTMLDivElement>();

  if (isError) return null;
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="bg-ganitel-surface px-6 py-20 md:px-12 md:py-28">
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
        className="mx-auto mt-12 max-w-7xl md:mt-16"
      >
        {isLoading ? (
          <PropertyGridSkeleton count={6} />
        ) : (
          <PropertyGrid items={items} />
        )}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl justify-center md:mt-14">
        <PillLink to="/browse" variant="ghost" arrow>
          {t("landing.featured.see_all")}
        </PillLink>
      </div>
    </section>
  );
}

function WhyGanitel() {
  const t = useT();
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="px-6 py-20 md:px-12 md:py-28">
      <div ref={ref} data-reveal="" className="mx-auto max-w-7xl">
        <SectionHeader
          align="center"
          tag={t("landing.why.tag")}
          title={t("landing.why.title")}
          emphasis={t("landing.why.title_em")}
        />
        <ul className="m-0 mt-12 grid list-none gap-6 p-0 md:grid-cols-3">
          {IMPACT_CARDS.map((card) => (
            <li
              key={card.key}
              className="flex flex-col gap-3 rounded-2xl bg-ganitel-surface-2 p-8"
            >
              <h3 className="m-0 text-xl font-bold tracking-tight text-ganitel-text-title">
                {t(card.titleKey)}
              </h3>
              <p className="m-0 text-sm leading-[1.6] text-ganitel-text-subtitle">
                {t(card.bodyKey)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function VisionMoment() {
  const t = useT();
  return (
    <section
      id="vision"
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden scroll-mt-16"
    >
      <img
        src={transformImage(VISION_SOURCE, { width: 1440, quality: 70 })}
        srcSet={buildSrcSet(VISION_SOURCE, [640, 960, 1440], 70)}
        sizes={HERO_SIZES}
        alt={t("landing.alt.vision")}
        loading="lazy"
        decoding="async"
        width={1440}
        height={810}
        onError={fallbackOnError(VISION_FALLBACK)}
        className="absolute inset-0 size-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-ganitel-primary/55" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p className="m-0 text-lg font-medium italic text-ganitel-paper-warm">
          {t("about.vision.title")}
        </p>
        <p className="m-0 mt-6 text-balance text-3xl font-bold leading-tight tracking-[-0.03em] text-ganitel-paper md:text-5xl">
          {t("about.vision.body")}
        </p>
      </div>
    </section>
  );
}

function Closing() {
  const t = useT();
  const isPrelaunch = usePrelaunch();
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="px-6 pb-20 pt-8 md:px-12 md:pb-28">
      <div
        ref={ref}
        data-reveal=""
        className="mx-auto flex max-w-7xl flex-col items-center gap-7 rounded-[28px] bg-ganitel-tan-soft px-8 py-14 text-center md:px-16 md:py-20"
      >
        <SectionHeader
          align="center"
          tag={t("landing.cta_section.tag")}
          title={t("landing.cta_section.title")}
          emphasis={t("landing.cta_section.title_em")}
        />
        <PillLink to={isPrelaunch ? "/join" : "/browse"} variant="solid" arrow>
          {t(isPrelaunch ? "join.submit" : "landing.cta")}
        </PillLink>
      </div>
    </section>
  );
}
