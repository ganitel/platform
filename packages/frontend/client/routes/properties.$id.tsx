import { data } from "react-router";

import type { Route } from "./+types/properties.$id";

import { HostCard } from "@/features/properties/components/host-card";
import { PropertyGallery } from "@/features/properties/components/property-gallery";
import { BookingPanel } from "@/features/properties/components/booking-panel";
import { WaitlistPanel } from "@/features/waitlist/components/waitlist-panel";
import { MobileDetailPanel } from "@/shared/components/mobile-detail-panel";
import { ErrorState } from "@/shared/components/error-state";
import { Markdown } from "@/shared/components/markdown";
import { serverFetch, ServerApiError } from "@/shared/api/server";
import { PRIVATE_NO_STORE_CACHE } from "@/shared/lib/cache";
import { formatMoney } from "@/shared/lib/format";
import { useLocale, useT } from "@/shared/lib/i18n";
import { usePrelaunch } from "@/shared/hooks/use-prelaunch";
import { seo, absoluteUrl } from "@/shared/lib/seo";
import type { PropertyDetail } from "@/features/properties/types";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PRIVATE_NO_STORE_CACHE,
});

export const meta: Route.MetaFunction = ({ data, params }) => {
  if (!data?.property) {
    return seo({
      title: "Logement introuvable — Ganitel",
      description:
        "Cette annonce n'est pas disponible. Découvrez nos autres logements sur Ganitel.",
      pathname: `/properties/${params.id ?? ""}`,
      noindex: true,
    });
  }
  const p = data.property;
  const title = `${p.title} — ${p.city} | Ganitel`;
  const description = (
    p.description?.trim().slice(0, 160) ||
    `${p.property_type} à ${p.city}, ${p.country_code}.`
  ).replace(/\s+/g, " ");
  const ogImage = p.cover_photo?.url
    ? { url: p.cover_photo.url, alt: p.title }
    : { url: "/og/stays.png", alt: p.title };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": absoluteUrl(`/properties/${p.id}`),
    name: p.title,
    description: p.description || undefined,
    url: absoluteUrl(`/properties/${p.id}`),
    image: p.photos.map((m) => m.url),
    address: {
      "@type": "PostalAddress",
      addressLocality: p.city,
      addressCountry: p.country_code,
    },
    geo:
      p.location &&
      Number.isFinite(p.location.lat) &&
      Number.isFinite(p.location.lng)
        ? {
            "@type": "GeoCoordinates",
            latitude: p.location.lat,
            longitude: p.location.lng,
          }
        : undefined,
    priceRange: `${p.base_price.amount} ${p.base_price.currency}`,
    numberOfRooms: p.bedrooms,
    petsAllowed: undefined,
    amenityFeature: p.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a.replace(/_/g, " "),
    })),
    additionalType: p.property_type,
  };

  return seo({
    title,
    description,
    pathname: `/properties/${p.id}`,
    ogImage,
    ogType: "place",
    jsonLd,
  });
};

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const property = await serverFetch<PropertyDetail>(
      `/properties/${params.id}`,
    );
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
  const locale = useLocale();
  const isPrelaunch = usePrelaunch();

  const priceText = formatMoney(property.base_price, locale);
  const priceLabel = t("property.per_night");

  const panel = isPrelaunch ? (
    <WaitlistPanel
      itemId={property.id}
      kind="property"
      title={property.title}
      price={property.base_price}
      priceLabel={priceLabel}
    />
  ) : (
    <BookingPanel property={property} />
  );

  return (
    <>
      <article className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 md:px-8 md:pt-12 lg:pb-12">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4 md:mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ganitel-secondary">
              {property.property_type}
            </p>
            <h1 className="mt-2 font-infoma text-[28px] leading-[1.05] text-ganitel-text-title sm:text-3xl md:text-4xl">
              {property.title}
            </h1>
            <p className="mt-1.5 text-sm text-ganitel-text-subtitle">
              {property.city}, {property.country_code}
            </p>
          </div>
        </header>

        <PropertyGallery photos={property.photos} title={property.title} />

        <div className="mt-8 grid grid-cols-1 gap-8 md:mt-10 md:gap-10 lg:grid-cols-[1fr_360px]">
          <section className="space-y-8 md:space-y-10">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ganitel-text-subtitle">
              <li>
                {property.capacity} {t("property.guests")}
              </li>
              <li>
                {property.bedrooms} {t("property.bedrooms")}
              </li>
              <li>
                {property.beds} {t("property.beds")}
              </li>
              <li>
                {property.bathrooms} {t("property.bathrooms")}
              </li>
            </ul>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-ganitel-text-title">
                {t("property.description")}
              </h2>
              {property.description ? (
                <Markdown source={property.description} />
              ) : (
                <p className="text-sm text-ganitel-text-subtitle">—</p>
              )}
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

          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            {panel}
          </aside>
        </div>
      </article>

      {/* Sticky bottom bar on mobile / tablet */}
      <MobileDetailPanel
        priceText={priceText}
        priceLabel={priceLabel}
        ctaLabel={isPrelaunch ? t("waitlist.submit") : t("property.book")}
        drawerTitle={property.title}
      >
        {panel}
      </MobileDetailPanel>
    </>
  );
}

export function ErrorBoundary() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <ErrorState />
    </div>
  );
}
