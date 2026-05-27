import { BadgeCheck, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { SyntheticEvent } from "react";

import type { TranslationKey } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n";
import type { TeamMember } from "@/features/about/types";
import { PillLink } from "@/shared/ui/pill-link";
import { SectionHeader } from "@/shared/ui/section-header";
import {
  buildSrcSet,
  transformImage,
  CARD_WIDTHS,
  HERO_WIDTHS,
  HERO_SIZES,
} from "@/shared/lib/image";

const ENTRANCE_EASE = [0.2, 0.7, 0.2, 1] as const;

// Placeholder Cameroon/African imagery — replace with owned photography before
// launch. picsum fallback keeps the page intact if an Unsplash URL fails.
const HERO_SOURCE =
  "https://images.unsplash.com/photo-1741850819375-5de72125719e?w=2000&q=80&auto=format&fit=crop";
const HERO_FALLBACK = "https://picsum.photos/seed/ganitelabouthero/1600/900";
const TRUST1_SOURCE =
  "https://images.unsplash.com/photo-1570742544137-3a469196c32b?w=900&q=80&auto=format&fit=crop";
const TRUST1_FALLBACK = "https://picsum.photos/seed/ganiteltrust1/800/1000";
const TRUST2_SOURCE =
  "https://images.unsplash.com/photo-1515657834497-26509e295154?w=900&q=80&auto=format&fit=crop";
const TRUST2_FALLBACK = "https://picsum.photos/seed/ganiteltrust2/800/1000";
const IMPACT_SOURCE =
  "https://images.unsplash.com/photo-1614531341773-3bff8b7cb3fc?w=900&q=80&auto=format&fit=crop";
const IMPACT_FALLBACK = "https://picsum.photos/seed/ganitelimpact/800/600";
const VISION_SOURCE =
  "https://images.unsplash.com/photo-1756475471671-48813cf5ea5b?w=2000&q=80&auto=format&fit=crop";
const VISION_FALLBACK = "https://picsum.photos/seed/ganitelvision/1600/900";

const TILE_SIZES = "(min-width: 1024px) 25vw, 50vw";
const IMPACT_PHOTO_SIZES = "(min-width: 768px) 33vw, 100vw";

function fallbackOnError(fallback: string) {
  return (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.srcset = "";
    event.currentTarget.src = fallback;
  };
}

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

export function About({ team }: { team: TeamMember[] }) {
  return (
    <>
      <Hero />
      <Trust />
      <Impact />
      <Team members={team} />
      <Vision />
      <Closing />
    </>
  );
}

function Hero() {
  const t = useT();
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
      <img
        src={transformImage(HERO_SOURCE, { width: 1440, quality: 70 })}
        srcSet={buildSrcSet(HERO_SOURCE, HERO_WIDTHS, 70)}
        sizes={HERO_SIZES}
        alt={t("about.alt.hero")}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width={1440}
        height={810}
        onError={fallbackOnError(HERO_FALLBACK)}
        className="absolute inset-0 size-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-ganitel-primary/45" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 text-center">
        <SectionHeader
          level="h1"
          align="center"
          inverted
          tag={t("about.tag")}
          title={t("about.title")}
          emphasis={t("about.title_em")}
          lede={t("about.lede")}
        />
        <div className="mt-8 flex justify-center">
          <PillLink
            to="#vision"
            variant="paper"
            arrow
            onClick={(event) => {
              event.preventDefault();
              document
                .getElementById("vision")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {t("about.hero.cta")}
          </PillLink>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const t = useT();
  return (
    <section className="px-6 py-20 md:px-12 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8, ease: ENTRANCE_EASE }}
        className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2"
      >
        <div className="grid grid-cols-2 gap-4">
          <img
            src={transformImage(TRUST1_SOURCE, { width: 600, quality: 75 })}
            srcSet={buildSrcSet(TRUST1_SOURCE, CARD_WIDTHS, 75)}
            sizes={TILE_SIZES}
            alt={t("about.alt.trust1")}
            loading="lazy"
            decoding="async"
            width={800}
            height={1000}
            onError={fallbackOnError(TRUST1_FALLBACK)}
            className="mt-10 h-full w-full rounded-2xl object-cover"
          />
          <img
            src={transformImage(TRUST2_SOURCE, { width: 600, quality: 75 })}
            srcSet={buildSrcSet(TRUST2_SOURCE, CARD_WIDTHS, 75)}
            sizes={TILE_SIZES}
            alt={t("about.alt.trust2")}
            loading="lazy"
            decoding="async"
            width={800}
            height={1000}
            onError={fallbackOnError(TRUST2_FALLBACK)}
            className="h-full w-full rounded-2xl object-cover"
          />
        </div>
        <div className="flex flex-col gap-7">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-ganitel-brown break-normal">
            {t("about.trust.tag")}
          </span>
          <p className="font-display m-0 text-2xl leading-snug tracking-[-0.01em] text-ganitel-text-title md:text-3xl">
            {t("about.statement")}
          </p>
          <p className="m-0 text-sm text-ganitel-text-placeholder">
            {t("about.trust.caption")}
          </p>
          <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2">
            {PROMISES.map(({ key, labelKey, icon: Icon }) => (
              <li key={key} className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ganitel-sage-soft">
                  <Icon
                    className="size-5 text-ganitel-sage"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <span className="font-display text-base font-semibold text-ganitel-text-title">
                  {t(labelKey)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}

function Impact() {
  const t = useT();
  return (
    <section className="bg-ganitel-olive-soft px-6 py-20 md:px-12 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8, ease: ENTRANCE_EASE }}
        className="mx-auto max-w-7xl"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display m-0 text-3xl font-bold leading-tight tracking-[-0.03em] text-ganitel-olive md:text-4xl">
            {t("about.impact.title")}
          </h2>
          <p className="m-0 mt-6 text-[15px] leading-[1.7] text-ganitel-text-subtitle md:text-base">
            {t("about.impact.body")}
          </p>
        </div>
        <ul className="m-0 mt-14 grid list-none gap-6 p-0 md:grid-cols-3">
          <li className="flex flex-col overflow-hidden rounded-2xl bg-ganitel-surface md:col-span-2 md:flex-row">
            <img
              src={transformImage(IMPACT_SOURCE, { width: 600, quality: 75 })}
              srcSet={buildSrcSet(IMPACT_SOURCE, CARD_WIDTHS, 75)}
              sizes={IMPACT_PHOTO_SIZES}
              alt={t("about.alt.impact")}
              loading="lazy"
              decoding="async"
              width={800}
              height={600}
              onError={fallbackOnError(IMPACT_FALLBACK)}
              className="h-56 w-full object-cover md:h-auto md:w-1/2"
            />
            <div className="flex flex-col gap-3 p-8">
              <h3 className="font-display m-0 text-xl font-bold text-ganitel-text-title">
                {t("about.impact.card.renewal.title")}
              </h3>
              <p className="m-0 text-sm leading-[1.6] text-ganitel-text-subtitle">
                {t("about.impact.card.renewal.body")}
              </p>
            </div>
          </li>
          <li className="flex flex-col gap-3 rounded-2xl bg-ganitel-surface p-8">
            <h3 className="font-display m-0 text-xl font-bold text-ganitel-text-title">
              {t("about.impact.card.guides.title")}
            </h3>
            <p className="m-0 text-sm leading-[1.6] text-ganitel-text-subtitle">
              {t("about.impact.card.guides.body")}
            </p>
          </li>
          <li className="flex flex-col gap-3 rounded-2xl bg-ganitel-surface p-8 md:col-span-3">
            <h3 className="font-display m-0 text-xl font-bold text-ganitel-text-title">
              {t("about.impact.card.transport.title")}
            </h3>
            <p className="m-0 text-sm leading-[1.6] text-ganitel-text-subtitle">
              {t("about.impact.card.transport.body")}
            </p>
          </li>
        </ul>
      </motion.div>
    </section>
  );
}

function Team({ members }: { members: TeamMember[] }) {
  const t = useT();
  if (members.length === 0) return null;
  return (
    <section className="px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          align="center"
          tag={t("about.team.tag")}
          title={t("about.team.title")}
          emphasis={t("about.team.title_em")}
          lede={t("about.team.lede")}
        />
        <motion.ul
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, delay: 0.1, ease: ENTRANCE_EASE }}
          className="m-0 mt-12 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3"
        >
          {members.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const locale = useLocale();
  const title = locale === "fr" ? member.title_fr : member.title_en;
  const bio = locale === "fr" ? member.bio_fr : member.bio_en;
  const initials = getInitials(member.name);

  return (
    <li className="flex flex-col items-center gap-4 rounded-2xl border border-ganitel-outline bg-ganitel-surface p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-14 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="font-display grid size-14 place-items-center rounded-full bg-ganitel-text-title text-base font-bold text-ganitel-paper"
          >
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-display m-0 text-lg font-bold leading-tight tracking-[-0.02em] text-ganitel-text-title">
            {member.name}
          </p>
          <p className="m-0 text-[13px] uppercase tracking-[0.12em] text-ganitel-text-placeholder">
            {title}
          </p>
        </div>
      </div>
      {bio ? (
        <p className="m-0 text-sm leading-[1.6] text-ganitel-text-subtitle">
          {bio}
        </p>
      ) : null}
    </li>
  );
}

function Vision() {
  const t = useT();
  return (
    <section
      id="vision"
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden scroll-mt-16"
    >
      <img
        src={transformImage(VISION_SOURCE, { width: 1440, quality: 70 })}
        srcSet={buildSrcSet(VISION_SOURCE, HERO_WIDTHS, 70)}
        sizes={HERO_SIZES}
        alt={t("about.alt.vision")}
        loading="lazy"
        decoding="async"
        width={1440}
        height={810}
        onError={fallbackOnError(VISION_FALLBACK)}
        className="absolute inset-0 size-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-ganitel-primary/45" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p className="font-italic-serif m-0 text-lg text-ganitel-paper-warm">
          {t("about.vision.title")}
        </p>
        <p className="font-display m-0 mt-6 text-balance text-3xl font-bold leading-tight tracking-[-0.03em] text-ganitel-paper md:text-5xl">
          {t("about.vision.body")}
        </p>
      </div>
    </section>
  );
}

function Closing() {
  const t = useT();
  return (
    <section className="px-6 pb-20 pt-8 md:px-12 md:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8, ease: ENTRANCE_EASE }}
        className="mx-auto flex max-w-7xl flex-col items-center gap-7 rounded-[28px] bg-ganitel-tan-soft px-8 py-14 text-center md:px-16 md:py-20"
      >
        <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-ganitel-brown">
          {t("about.closing.tag")}
        </span>
        <h2 className="font-display m-0 max-w-2xl text-3xl font-bold leading-tight tracking-[-0.03em] text-ganitel-on-tan md:text-4xl">
          {t("about.closing")}
        </h2>
        <PillLink to="/browse" variant="solid" arrow>
          {t("about.cta")}
        </PillLink>
      </motion.div>
    </section>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
