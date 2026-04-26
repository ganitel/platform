import { Link } from "react-router";

import type { PropertyPublic } from "@/features/properties/types";
import { formatMoney } from "@/shared/lib/format";
import { useLocale, useT } from "@/shared/lib/i18n";

const PLACEHOLDER_COVER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><rect fill='%23EDECEC' width='4' height='5'/></svg>";

export function PropertyCard({ property }: { property: PropertyPublic }) {
  const locale = useLocale();
  const t = useT();

  const cover = property.cover_photo?.url ?? PLACEHOLDER_COVER;
  const price = formatMoney(property.base_price, locale);

  return (
    <Link to={`/properties/${property.id}`} className="group flex flex-col">
      <div className="relative mb-5 aspect-[4/5] overflow-hidden rounded-[18px] bg-ganitel-background-neutral2">
        <img
          src={cover}
          alt={property.cover_photo?.alt ?? property.title}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-ganitel-paper/95 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ganitel-text-title shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur">
          {property.property_type}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-1">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display line-clamp-2 flex-1 text-balance text-[20px] font-semibold leading-[1.1] tracking-[-0.025em] text-ganitel-text-title transition-colors group-hover:text-ganitel-text-subtitle">
            {property.title}
          </h3>
          <span className="font-italic-serif shrink-0 text-[15px] leading-tight text-ganitel-text-placeholder">
            {property.city}
          </span>
        </div>

        <p className="text-[11px] uppercase tracking-[0.14em] text-ganitel-text-placeholder">
          {property.capacity} {t("property.guests")}
          <span aria-hidden className="mx-1.5">
            ·
          </span>
          {property.bedrooms} {t("property.bedrooms")}
        </p>

        <p className="font-display text-[15px] leading-snug">
          <span className="font-semibold text-ganitel-text-title">{price}</span>
          <span className="text-ganitel-text-placeholder">
            {" · "}
            {t("property.per_night")}
          </span>
        </p>
      </div>
    </Link>
  );
}
