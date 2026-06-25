import { useState } from "react";
import { Link } from "react-router";
import { BadgeCheck, Compass, Headset, ShieldCheck, Users } from "lucide-react";

import { useT } from "@/shared/lib/i18n";
import { useSearchExperiences } from "@/features/experiences/hooks";
import { ExperienceRailCard } from "@/features/experiences/components/experience-rail-card";
import { Rail } from "@/shared/components/rail";
import { SectionHeading } from "@/shared/components/section-heading";
import { CitySheet } from "@/shared/components/city-sheet";
import { Button } from "@/shared/ui/button";
import { useReveal } from "@/shared/hooks/use-reveal";
import { POPULAR_CITIES } from "./popular-cities";
import { CityCard } from "./components/city-card";
import { TrustCard } from "./components/trust-card";
import { QuoteCard } from "./components/quote-card";

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
    <section className="px-5 pb-10 pt-12 md:px-12 md:pb-14 md:pt-20">
      <div className="max-w-2xl">
        <h1 className="text-balance text-[42px] font-semibold leading-[1.04] tracking-[-0.02em] text-ganitel-text-title md:text-6xl">
          {t("landing.hero.h2.title")}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ganitel-text-subtitle md:text-xl">
          {t("landing.hero.h2.lede")}
        </p>
        <Button
          onClick={onStart}
          size="cta"
          className="mt-8 w-full sm:w-auto sm:min-w-[280px]"
        >
          {t("landing.hero.cta.start")}
        </Button>
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
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} data-reveal="" className="px-5 py-10 md:px-12 md:py-16">
      <SectionHeading
        className="mb-6"
        title={t("landing.confidence.heading")}
        subtitle={t("landing.confidence.sub")}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
