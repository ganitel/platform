import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Compass,
  Headset,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useT } from "@/shared/lib/i18n";
import { useSearchExperiences } from "@/features/experiences/hooks";
import { ExperienceRailCard } from "@/features/experiences/components/experience-rail-card";
import { Rail } from "@/shared/components/rail";
import { SectionHeading } from "@/shared/components/section-heading";
import { CitySheet } from "@/shared/components/city-sheet";
import { Button } from "@/shared/ui/button";
import { useReveal } from "@/shared/hooks/use-reveal";
import { fallbackOnError } from "@/shared/lib/image";
import { POPULAR_CITIES } from "./popular-cities";
import { HERO_FALLBACK, HERO_MOBILE_SRC, HERO_SRCSET } from "./hero-source";
import { CityCard } from "./components/city-card";
import { HeroSeal } from "./components/hero-seal";
import { TrustCard } from "./components/trust-card";
import { QuoteCard } from "./components/quote-card";

const HERO_STATS = [
  {
    key: "guides",
    icon: ShieldCheck,
    labelKey: "landing.hero.stat.guides" as const,
  },
  {
    key: "cities",
    icon: MapPin,
    labelKey: "landing.hero.stat.cities" as const,
  },
  {
    key: "cancel",
    icon: CalendarCheck,
    labelKey: "landing.hero.stat.cancel" as const,
  },
];

const TRUST_CARDS = [
  {
    key: "security",
    icon: ShieldCheck,
    tone: "olive" as const,
    titleKey: "landing.confidence.security.title" as const,
    bodyKey: "landing.confidence.security.body" as const,
  },
  {
    key: "guides",
    icon: Users,
    tone: "tan" as const,
    titleKey: "landing.confidence.guides.title" as const,
    bodyKey: "landing.confidence.guides.body" as const,
  },
  {
    key: "verified",
    icon: BadgeCheck,
    tone: "brown" as const,
    titleKey: "landing.confidence.verified.title" as const,
    bodyKey: "landing.confidence.verified.body" as const,
  },
  {
    key: "support",
    icon: Headset,
    tone: "sage" as const,
    titleKey: "landing.confidence.support.title" as const,
    bodyKey: "landing.confidence.support.body" as const,
  },
];

const STORIES = [
  {
    key: "q1",
    bodyKey: "landing.stories.q1.body" as const,
    nameKey: "landing.stories.q1.name" as const,
    placeKey: "landing.stories.q1.place" as const,
  },
  {
    key: "q2",
    bodyKey: "landing.stories.q2.body" as const,
    nameKey: "landing.stories.q2.name" as const,
    placeKey: "landing.stories.q2.place" as const,
  },
  {
    key: "q3",
    bodyKey: "landing.stories.q3.body" as const,
    nameKey: "landing.stories.q3.name" as const,
    placeKey: "landing.stories.q3.place" as const,
  },
];

export function Landing() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const openSheet = () => setSheetOpen(true);

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <Hero onStart={openSheet} />
        <PopularCities />
        <FeaturedExperiences />
        <ExploreWithConfidence />
        <TravelerStories />
        <FinalCta onStart={openSheet} />
      </div>
      <CitySheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  const t = useT();
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="hero-atmosphere paper-grain pointer-events-none absolute inset-0 -z-10"
      />
      <div className="grid items-center gap-12 px-5 pb-14 pt-12 md:px-12 md:pb-20 md:pt-20 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6 xl:col-span-7">
          <span
            className="hero-rise flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-ganitel-olive"
            style={{ animationDelay: "0.05s" }}
          >
            <span aria-hidden className="h-px w-8 bg-ganitel-olive/50" />
            {t("landing.hero.eyebrow")}
          </span>
          <h1
            className="hero-rise mt-5 text-balance text-[clamp(2.75rem,7vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ganitel-text-title"
            style={{ animationDelay: "0.13s" }}
          >
            {t("landing.hero.h2.title")}
          </h1>
          <p
            className="hero-rise mt-6 max-w-md text-lg leading-relaxed text-ganitel-text-subtitle md:text-xl"
            style={{ animationDelay: "0.24s" }}
          >
            {t("landing.hero.h2.lede")}
          </p>
          <div
            className="hero-rise mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
            style={{ animationDelay: "0.34s" }}
          >
            <Button
              onClick={onStart}
              size="cta"
              className="w-full sm:w-auto sm:min-w-[260px]"
            >
              {t("landing.hero.cta.start")}
            </Button>
            <Link
              to="/browse?kind=experiences"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ganitel-text-title"
            >
              {t("landing.hero.secondary")}
              <ArrowRight className="size-4 text-ganitel-accent transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ul
            className="hero-rise mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-ganitel-outline-soft/40 pt-6"
            style={{ animationDelay: "0.44s" }}
          >
            {HERO_STATS.map((stat) => (
              <li
                key={stat.key}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-ganitel-text-subtitle"
              >
                <stat.icon className="size-4 text-ganitel-olive" />
                {t(stat.labelKey)}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="hero-rise relative lg:col-span-6 xl:col-span-5"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-ganitel-outline-soft/60 shadow-[0_30px_60px_-30px_rgba(24,16,12,0.5)]">
            <img
              src={HERO_MOBILE_SRC}
              srcSet={HERO_SRCSET}
              sizes="(min-width: 1024px) 40vw, 92vw"
              alt={t("landing.alt.hero")}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={720}
              height={900}
              onError={fallbackOnError(HERO_FALLBACK)}
              className="ganitel-anim-kenburns absolute inset-0 size-full object-cover"
            />
            <div aria-hidden className="image-scrim absolute inset-0" />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-ganitel-text-title backdrop-blur-md">
              <MapPin className="size-3.5 text-ganitel-accent" />
              {t("landing.hero.caption")}
            </span>
          </div>
          <div className="absolute -left-4 -top-4 md:-left-6 md:-top-6">
            <HeroSeal label={t("landing.hero.seal")} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PopularCities() {
  const t = useT();
  return (
    <section className="py-8 md:py-10">
      <div className="mb-4 px-5 md:px-12">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ganitel-text-title md:text-[28px]">
          {t("landing.cities.title")}
        </h2>
      </div>
      <Rail ariaLabel={t("landing.cities.title")}>
        {POPULAR_CITIES.map((city) => (
          <CityCard
            key={city.name}
            name={city.name}
            href={city.href}
            source={city.source}
            fallback={city.fallback}
            alt={t(city.altKey)}
          />
        ))}
      </Rail>
    </section>
  );
}

function FeaturedExperiences() {
  const t = useT();
  const { data, isLoading, isError } = useSearchExperiences({ limit: 12 });
  const items = data?.items ?? [];
  const featured = items.slice(0, 6);
  const unforgettable = items.slice(6, 12);

  if (isError) return null;

  return (
    <>
      <section className="py-8 md:py-12">
        <SectionHeading
          className="mb-5 px-5 md:px-12"
          eyebrow={t("landing.featured.experiences.eyebrow")}
          title={t("landing.featured.experiences.heading")}
          subtitle={t("landing.featured.experiences.sub")}
          action={{
            to: "/browse?kind=experiences",
            label: t("landing.see_all"),
          }}
        />
        {isLoading ? (
          <RailSkeleton ariaLabel={t("landing.featured.experiences.heading")} />
        ) : (
          featured.length > 0 && (
            <Rail ariaLabel={t("landing.featured.experiences.heading")}>
              {featured.map((experience, index) => (
                <ExperienceRailCard
                  key={experience.id}
                  experience={experience}
                  inRail
                  priority={index === 0}
                />
              ))}
            </Rail>
          )
        )}
      </section>

      {unforgettable.length > 0 && (
        <section className="bg-ganitel-surface-2 py-10 md:py-14">
          <SectionHeading
            className="mb-5 px-5 md:px-12"
            eyebrow={t("landing.unforgettable.eyebrow")}
            title={t("landing.unforgettable.heading")}
            subtitle={t("landing.unforgettable.sub")}
            action={{
              to: "/browse?kind=experiences",
              label: t("landing.see_all"),
            }}
          />
          <Rail ariaLabel={t("landing.unforgettable.heading")}>
            {unforgettable.map((experience) => (
              <ExperienceRailCard
                key={experience.id}
                experience={experience}
                inRail
              />
            ))}
          </Rail>
        </section>
      )}
    </>
  );
}

function ExploreWithConfidence() {
  const t = useT();
  const gridRef = useReveal<HTMLDivElement>({ rootMargin: "0px 0px -8% 0px" });
  return (
    <section className="px-5 py-10 md:px-12 md:py-16">
      <SectionHeading
        className="mb-6"
        eyebrow={t("landing.confidence.eyebrow")}
        title={t("landing.confidence.heading")}
        subtitle={t("landing.confidence.sub")}
      />
      <div
        ref={gridRef}
        data-reveal=""
        data-reveal-children=""
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {TRUST_CARDS.map((card) => (
          <TrustCard
            key={card.key}
            icon={card.icon}
            tone={card.tone}
            title={t(card.titleKey)}
            body={t(card.bodyKey)}
          />
        ))}
      </div>
    </section>
  );
}

function TravelerStories() {
  const t = useT();
  return (
    <section className="py-10 md:py-14">
      <SectionHeading
        className="mb-5 px-5 md:px-12"
        eyebrow={t("landing.stories.eyebrow")}
        title={t("landing.stories.heading")}
        subtitle={t("landing.stories.sub")}
      />
      <Rail ariaLabel={t("landing.stories.heading")}>
        {STORIES.map((story) => (
          <QuoteCard
            key={story.key}
            body={t(story.bodyKey)}
            name={t(story.nameKey)}
            place={t(story.placeKey)}
          />
        ))}
      </Rail>
    </section>
  );
}

function FinalCta({ onStart }: { onStart: () => void }) {
  const t = useT();
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="px-5 pb-16 pt-8 md:px-12 md:pb-24">
      <div
        ref={ref}
        data-reveal=""
        className="relative overflow-hidden rounded-[32px] bg-ganitel-olive-soft px-8 py-12 text-center md:px-16 md:py-16"
      >
        <div className="relative z-10 mx-auto max-w-xl">
          <h2 className="text-balance text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ganitel-text-title md:text-4xl">
            {t("landing.final.heading")}
          </h2>
          <p className="mt-3 text-ganitel-text-subtitle md:text-lg">
            {t("landing.final.sub")}
          </p>
          <Button
            onClick={onStart}
            variant="brand"
            size="cta"
            className="mt-8 w-full gap-2 sm:w-auto sm:min-w-[260px]"
          >
            {t("landing.hero.cta.start")}
            <Compass className="size-5" />
          </Button>
          <p className="mt-5 text-sm text-ganitel-text-subtitle">
            <Link
              to="/about"
              className="font-semibold text-ganitel-olive underline-offset-4 hover:underline"
            >
              {t("landing.final.about_link")}
            </Link>
          </p>
        </div>
        <div
          aria-hidden
          className="absolute -bottom-12 -right-12 size-48 rounded-full bg-ganitel-olive/10 blur-3xl"
        />
      </div>
    </section>
  );
}

function RailSkeleton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <Rail ariaLabel={ariaLabel}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="w-[280px] shrink-0 snap-start overflow-hidden rounded-card border border-ganitel-outline-soft/50 bg-ganitel-surface-card md:w-[320px]"
        >
          <div className="aspect-[16/11] animate-pulse bg-ganitel-surface-3" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-ganitel-surface-3" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-ganitel-surface-3" />
            <div className="h-px bg-ganitel-outline-soft/40" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-ganitel-surface-3" />
          </div>
        </div>
      ))}
    </Rail>
  );
}
