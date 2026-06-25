import { Link } from "react-router";
import { Clock, MapPin } from "lucide-react";

import type { ExperiencePublic } from "@/features/experiences/types";
import { formatMoney } from "@/shared/lib/format";
import { useLocale, useT } from "@/shared/lib/i18n";
import { pickPriceForLocale } from "@/shared/lib/price";
import { thumbnailUrl } from "@/shared/lib/media";
import { buildSrcSet, transformImage, CARD_WIDTHS } from "@/shared/lib/image";
import { cn } from "@/shared/lib/cn";

const PLACEHOLDER_COVER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'><rect fill='%23f0edec' width='16' height='10'/></svg>";

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins.toString().padStart(2, "0")}`;
}

interface Props {
  experience: ExperiencePublic;
  /** Render inside a horizontal Rail (fixed width + snap) vs. a fluid grid. */
  inRail?: boolean;
  priority?: boolean;
}

/**
 * Editorial experience card from the Heritage & Horizon mockups: image-top
 * with an over-image category chip, location eyebrow, title, and a footer
 * (duration · price) separated by a hairline rule.
 */
export function ExperienceRailCard({ experience, inRail, priority }: Props) {
  const locale = useLocale();
  const t = useT();

  const rawCover = experience.cover_media
    ? thumbnailUrl(experience.cover_media)
    : PLACEHOLDER_COVER;
  const cover = transformImage(rawCover, { width: 600, quality: 75 });
  const srcSet = buildSrcSet(rawCover, CARD_WIDTHS, 75);
  const priceEntry = pickPriceForLocale(experience.prices, locale);
  const price = priceEntry ? formatMoney(priceEntry, locale) : "";

  return (
    <Link
      to={`/experiences/${experience.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border border-ganitel-outline-soft/50 bg-ganitel-surface-card transition-shadow duration-300 hover:shadow-[0_14px_40px_-12px_rgba(128,85,45,0.18)]",
        inRail && "w-[280px] shrink-0 snap-start md:w-[320px]",
      )}
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <img
          src={cover}
          srcSet={srcSet}
          sizes={inRail ? "320px" : "(min-width: 1024px) 33vw, 100vw"}
          alt={experience.title}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          width={600}
          height={413}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ganitel-text-title shadow-sm backdrop-blur-md">
          {experience.experience_type}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center gap-1 text-ganitel-text-placeholder">
          <MapPin className="size-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
            {experience.city}
          </span>
        </div>
        <h3 className="text-balance text-xl font-semibold leading-snug tracking-[-0.01em] text-ganitel-text-title">
          {experience.title}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ganitel-outline-soft/40 pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ganitel-text-subtitle">
            <Clock className="size-4 text-ganitel-accent" />
            {formatDuration(experience.duration_minutes)}
          </span>
          {price && (
            <span className="text-right text-sm text-ganitel-text-placeholder">
              {t("experience.per_person")}
              <span className="ml-1 text-base font-semibold text-ganitel-olive">
                {price}
              </span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
