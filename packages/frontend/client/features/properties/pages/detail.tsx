import { useParams } from "react-router-dom";

import { useProperty } from "@/features/properties/hooks";
import { PropertyGallery } from "@/features/properties/components/property-gallery";
import { HostCard } from "@/features/properties/components/host-card";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/components/error-state";
import { PageSpinner } from "@/shared/components/page-spinner";
import { formatMoney } from "@/shared/lib/format";
import { useLocale, useT } from "@/shared/lib/i18n";

export function PropertyDetailPage() {
  const { id } = useParams();
  const locale = useLocale();
  const t = useT();
  const { data: property, isLoading, isError, refetch } = useProperty(id);

  if (isLoading) return <PageSpinner />;
  if (isError || !property) return <ErrorState onRetry={() => refetch()} />;

  const price = formatMoney(property.base_price, locale);

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ganitel-secondary">
            {property.property_type}
          </p>
          <h1 className="mt-2 font-infoma text-3xl text-ganitel-text-title md:text-4xl">
            {property.title}
          </h1>
          <p className="mt-1 text-sm text-ganitel-text-subtitle">
            {property.city}, {property.country_code}
          </p>
        </div>
      </header>

      <PropertyGallery photos={property.photos} title={property.title} />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <section className="space-y-10">
          <div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ganitel-text-subtitle">
              <li>{property.capacity} {t("property.guests")}</li>
              <li>{property.bedrooms} {t("property.bedrooms")}</li>
              <li>{property.beds} {t("property.beds")}</li>
              <li>{property.bathrooms} {t("property.bathrooms")}</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-ganitel-text-title">
              {t("property.description")}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ganitel-text-subtitle">
              {property.description || "—"}
            </p>
          </div>

          {property.amenities.length > 0 ? (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-ganitel-text-title">
                {t("property.amenities")}
              </h2>
              <ul className="grid grid-cols-2 gap-y-2 text-sm text-ganitel-text-subtitle md:grid-cols-3">
                {property.amenities.map((a) => (
                  <li key={a} className="capitalize">{a.replace(/_/g, " ")}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <HostCard host={property.host} />
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary p-6 shadow-sm">
            <p className="text-sm text-ganitel-text-subtitle">
              <span className="text-2xl font-semibold text-ganitel-text-title">{price}</span>
              <span> · {t("property.per_night")}</span>
            </p>
            <Button
              type="button"
              className="mt-5 h-12 w-full rounded-xl bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90"
            >
              {t("property.book")}
            </Button>
          </div>
        </aside>
      </div>
    </article>
  );
}
