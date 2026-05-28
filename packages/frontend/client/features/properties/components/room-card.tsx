import { BedDouble, Users } from "lucide-react";

import type { RoomTypePublic } from "@/features/properties/types";
import { formatMoney } from "@/shared/lib/format";
import type { TranslationKey } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n";
import { transformImage } from "@/shared/lib/image";
import { thumbnailUrl } from "@/shared/lib/media";
import { pickPriceForLocale } from "@/shared/lib/price";

const BED_TYPE_KEYS = {
  single: "reference.bed_type.single",
  double: "reference.bed_type.double",
  queen: "reference.bed_type.queen",
  king: "reference.bed_type.king",
  sofa_bed: "reference.bed_type.sofa_bed",
  bunk: "reference.bed_type.bunk",
  crib: "reference.bed_type.crib",
} as const satisfies Record<string, TranslationKey>;

interface Props {
  room: RoomTypePublic;
  selected: boolean;
  onSelect: () => void;
  showAvailability: boolean;
}

export function RoomCard({
  room,
  selected,
  onSelect,
  showAvailability,
}: Props) {
  const locale = useLocale();
  const t = useT();
  const cover = room.media[0]
    ? transformImage(thumbnailUrl(room.media[0]), { width: 480, quality: 70 })
    : null;
  const fallbackPrice = pickPriceForLocale(room.prices, locale);
  const nightly = room.availability?.nightly ?? fallbackPrice ?? null;
  const total = room.availability?.total ?? null;
  const isSoldOut = showAvailability && room.availability?.available === false;
  const bedSummary = room.bed_config
    .map((b) => {
      const key = BED_TYPE_KEYS[b.type as keyof typeof BED_TYPE_KEYS];
      return `${b.count} ${key ? t(key) : b.type}`;
    })
    .join(" · ");

  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border p-4 transition md:flex-row ${
        selected
          ? "border-ganitel-primary bg-ganitel-background-secondary"
          : "border-ganitel-stroke-neutral bg-white"
      }`}
      data-selected={selected}
      data-room-id={room.id}
    >
      <div className="h-40 w-full overflow-hidden rounded-xl bg-ganitel-neutral-2 md:h-32 md:w-48 md:shrink-0">
        {cover ? (
          <img
            src={cover}
            alt={room.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ganitel-text-title">
              {room.title}
            </h3>
            {bedSummary && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ganitel-text-subtitle">
                <BedDouble className="size-3.5" />
                {bedSummary}
              </p>
            )}
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ganitel-text-subtitle">
              <Users className="size-3.5" />
              {t("hotels.room.sleeps").replace("{n}", String(room.max_guests))}
            </p>
          </div>
          <div className="text-right">
            {nightly && (
              <p className="text-sm font-semibold tabular-nums text-ganitel-text-title">
                {formatMoney(nightly, locale)}
              </p>
            )}
            <p className="text-[11px] uppercase tracking-[0.2em] text-ganitel-text-placeholder">
              {t("property.per_night")}
            </p>
            {total && (
              <p className="mt-1 text-xs text-ganitel-text-subtitle">
                {t("hotels.room.total").replace(
                  "{amount}",
                  formatMoney(total, locale),
                )}
              </p>
            )}
          </div>
        </header>

        {room.description && (
          <p className="line-clamp-2 text-sm text-ganitel-text-subtitle">
            {room.description}
          </p>
        )}

        <footer className="mt-auto flex items-center justify-end gap-2">
          {isSoldOut ? (
            <span className="rounded-full bg-ganitel-neutral-2 px-3 py-1 text-xs font-medium text-ganitel-text-placeholder">
              {t("hotels.room.sold_out")}
            </span>
          ) : (
            <button
              type="button"
              onClick={onSelect}
              className="rounded-xl bg-ganitel-primary px-4 py-2 text-sm font-medium text-ganitel-text-button hover:bg-ganitel-primary/90"
            >
              {selected ? t("hotels.room.selected") : t("hotels.room.choose")}
            </button>
          )}
        </footer>
      </div>
    </article>
  );
}
