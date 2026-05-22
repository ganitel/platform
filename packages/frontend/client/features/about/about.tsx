import { BadgeCheck, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import type { TranslationKey } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n";
import type { TeamMember } from "@/features/about/types";
import { PillLink } from "@/shared/ui/pill-link";
import { SectionHeader } from "@/shared/ui/section-header";

const ENTRANCE_EASE = [0.2, 0.7, 0.2, 1] as const;

const PROMISES = [
  { key: "security", labelKey: "about.promise.security", icon: ShieldCheck },
  {
    key: "convenience",
    labelKey: "about.promise.convenience",
    icon: Compass,
  },
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
      <Body />
      <Team members={team} />
      <Closing />
    </>
  );
}

function Hero() {
  const t = useT();
  return (
    <section className="px-6 pb-8 pt-16 md:px-12 md:pb-12 md:pt-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          level="h1"
          align="stacked"
          tag={t("about.tag")}
          title={t("about.title")}
          emphasis={t("about.title_em")}
          lede={t("about.lede")}
        />
      </div>
    </section>
  );
}

function Body() {
  const t = useT();
  return (
    <section className="px-6 pb-12 md:px-12 md:pb-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8, ease: ENTRANCE_EASE }}
        className="mx-auto flex max-w-7xl flex-col items-center gap-12 text-center md:gap-16"
      >
        <p className="m-0 max-w-3xl text-[15px] leading-[1.7] text-ganitel-text-subtitle md:text-base">
          {t("about.statement")}
        </p>

        <PromiseBadges />

        <hr
          aria-hidden
          className="m-0 h-px w-16 border-0 bg-ganitel-stroke-neutral"
        />

        <Pillar title={t("about.impact.title")} body={t("about.impact.body")} />

        <Pillar title={t("about.vision.title")} body={t("about.vision.body")} />
      </motion.div>
    </section>
  );
}

function PromiseBadges() {
  const t = useT();
  return (
    <ul className="m-0 flex list-none flex-wrap justify-center gap-3 p-0">
      {PROMISES.map(({ key, labelKey, icon: Icon }) => (
        <li
          key={key}
          className="inline-flex items-center gap-2 rounded-full border border-ganitel-stroke-neutral bg-ganitel-background-secondary px-4 py-2"
        >
          <Icon
            className="size-4 text-ganitel-secondary"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="font-display text-sm font-semibold text-ganitel-text-title">
            {t(labelKey)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex max-w-3xl flex-col items-center gap-4">
      <h3 className="font-display m-0 text-2xl font-bold leading-tight tracking-[-0.02em] text-ganitel-text-title md:text-3xl">
        {title}
      </h3>
      <p className="m-0 text-[15px] leading-[1.7] text-ganitel-text-subtitle md:text-base">
        {body}
      </p>
    </div>
  );
}

function Team({ members }: { members: TeamMember[] }) {
  const t = useT();
  if (members.length === 0) return null;
  return (
    <section className="px-6 pb-12 md:px-12 md:pb-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
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
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
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
    <li className="flex flex-col gap-4 rounded-2xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary p-6">
      <div className="flex items-center gap-4">
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

function Closing() {
  const t = useT();
  return (
    <section className="px-6 pb-16 md:px-12 md:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8, ease: ENTRANCE_EASE }}
        className="mx-auto max-w-7xl rounded-[28px] bg-ganitel-text-title px-8 py-12 md:px-16 md:py-16"
      >
        <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-end">
          <SectionHeader
            tag={t("about.closing.tag")}
            title={t("about.closing")}
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
            {t("about.cta")}
          </PillLink>
        </div>
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
