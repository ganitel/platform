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

function HeroPanel() {
  return null;
}

function FeatureCard() {
  return null;
}

function ScrollHint() {
  return null;
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
