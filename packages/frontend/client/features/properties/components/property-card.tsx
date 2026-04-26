import { Link } from "react-router";

import type { PropertyPublic } from "@/features/properties/types";
import { formatMoney } from "@/shared/lib/format";
import { useLocale, useT } from "@/shared/lib/i18n";

const PLACEHOLDER_COVER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect fill='%23EDECEC' width='4' height='3'/></svg>";

export function PropertyCard({ property }: { property: PropertyPublic }) {
  const locale = useLocale();
  const t = useT();

  const cover = property.cover_photo?.url ?? PLACEHOLDER_COVER;
  const price = formatMoney(property.base_price, locale);

  return (
    <Link
      to={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-transparent bg-ganitel-background-secondary transition hover:border-ganitel-stroke-neutral"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ganitel-background-neutral2">
        <img
          src={cover}
          alt={property.cover_photo?.alt ?? property.title}
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 rounded-full bg-ganitel-background-secondary/90 px-2.5 py-1 text-xs font-medium text-ganitel-text-title shadow-sm backdrop-blur">
          {property.property_type}
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1 pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-ganitel-text-title">
            {property.title}
          </h3>
          <span className="shrink-0 text-xs uppercase tracking-wide text-ganitel-text-subtitle">
            {property.city}
          </span>
        </div>
        <p className="text-xs text-ganitel-text-subtitle">
          {property.capacity} {t("property.guests")} · {property.bedrooms} {t("property.bedrooms")}
        </p>
        <p className="mt-1 text-sm text-ganitel-text-title">
          <span className="font-semibold">{price}</span>
          <span className="text-ganitel-text-subtitle"> · {t("property.per_night")}</span>
        </p>
      </div>
    </Link>
  );
}
