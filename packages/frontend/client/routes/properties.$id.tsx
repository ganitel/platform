import { data } from "react-router";

import type { Route } from "./+types/properties.$id";

import { HostCard } from "@/features/properties/components/host-card";
import { PropertyGallery } from "@/features/properties/components/property-gallery";
import { BookingPanel } from "@/features/properties/components/booking-panel";
import { ErrorState } from "@/shared/components/error-state";
import { serverFetch, ServerApiError } from "@/shared/api/server";
import { useT } from "@/shared/lib/i18n";
import type { PropertyDetail } from "@/features/properties/types";

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.property) {
    return [{ title: "Logement introuvable — Ganitel" }];
  }
  const p = data.property;
  const title = `${p.title} — ${p.city} | Ganitel`;
  const description = p.description.slice(0, 160) || `${p.property_type} à ${p.city}`;
  const ogImage = p.cover_photo?.url;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    ...(ogImage
      ? [
          { property: "og:image", content: ogImage },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:image", content: ogImage },
        ]
      : []),
  ];
};

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const property = await serverFetch<PropertyDetail>(`/properties/${params.id}`);
    return { property };
  } catch (e) {
    if (e instanceof ServerApiError && e.status === 404) {
      throw data("Logement introuvable", { status: 404 });
    }
    throw e;
  }
}

export default function PropertyDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const { property } = loaderData;
  const t = useT();

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
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ganitel-text-subtitle">
            <li>{property.capacity} {t("property.guests")}</li>
            <li>{property.bedrooms} {t("property.bedrooms")}</li>
            <li>{property.beds} {t("property.beds")}</li>
            <li>{property.bathrooms} {t("property.bathrooms")}</li>
          </ul>

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
                  <li key={a} className="capitalize">
                    {a.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <HostCard host={property.host} />
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingPanel property={property} />
        </aside>
      </div>
    </article>
  );
}

export function ErrorBoundary() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <ErrorState />
    </div>
  );
}
