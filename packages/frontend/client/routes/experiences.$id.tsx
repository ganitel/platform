import { data } from "react-router";

import type { Route } from "./+types/experiences.$id";

import { HostCard } from "@/features/properties/components/host-card";
import { PropertyGallery } from "@/features/properties/components/property-gallery";
import { WaitlistPanel } from "@/features/waitlist/components/waitlist-panel";
import { MobileDetailPanel } from "@/shared/components/mobile-detail-panel";
import { ErrorState } from "@/shared/components/error-state";
import { serverFetch, ServerApiError } from "@/shared/api/server";
import { PUBLIC_CDN_CACHE } from "@/shared/lib/cache";
import { formatMoney } from "@/shared/lib/format";
import { useLocale, useT } from "@/shared/lib/i18n";
import { seo, absoluteUrl } from "@/shared/lib/seo";
import type { ExperienceDetail } from "@/features/experiences/types";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PUBLIC_CDN_CACHE,
});

export const meta: Route.MetaFunction = ({
  data,
  params,
}: {
  data: { experience: ExperienceDetail } | null | undefined;
  params: { id?: string };
}) => {
  if (!data?.experience) {
    return seo({
      title: "Expérience introuvable — Ganitel",
      description:
        "Cette expérience n'est plus disponible. Découvrez nos autres expériences sur Ganitel.",
      pathname: `/experiences/${params.id ?? ""}`,
      noindex: true,
    });
  }
  const e = data.experience;
  const title = `${e.title} — ${e.city} | Ganitel`;
  const description = (
    e.description?.slice(0, 160) ||
    `${e.experience_type} à ${e.city}, ${e.country_code}.`
  ).replace(/\s+/g, " ");
  const ogImage = e.cover_photo?.url
    ? {
        url: e.cover_photo.url,
        alt: e.cover_photo.alt ?? e.title,
        width: e.cover_photo.width ?? undefined,
        height: e.cover_photo.height ?? undefined,
      }
    : { url: "/og/experiences.png", alt: e.title };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "@id": absoluteUrl(`/experiences/${e.id}`),
    name: e.title,
    description: e.description || undefined,
    url: absoluteUrl(`/experiences/${e.id}`),
    image: e.photos.map((m) => m.url),
    address: {
      "@type": "PostalAddress",
      addressLocality: e.city,
      addressCountry: e.country_code,
    },
    geo:
      e.location &&
      Number.isFinite(e.location.lat) &&
      Number.isFinite(e.location.lng)
        ? {
            "@type": "GeoCoordinates",
            latitude: e.location.lat,
            longitude: e.location.lng,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      price: e.base_price.amount,
      priceCurrency: e.base_price.currency,
      url: absoluteUrl(`/experiences/${e.id}`),
      availability: "https://schema.org/InStock",
    },
    duration: `PT${e.duration_minutes}M`,
    additionalType: e.experience_type,
  };

  return seo({
    title,
    description,
    pathname: `/experiences/${e.id}`,
    ogImage,
    ogType: "place",
    jsonLd,
  });
};

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const experience = await serverFetch<ExperienceDetail>(
      `/experiences/${params.id}`,
    );
    return { experience };
  } catch (e) {
    if (e instanceof ServerApiError && e.status === 404) {
      throw data("Expérience introuvable", { status: 404 });
    }
    throw e;
  }
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function ExperienceDetailRoute({
  loaderData,
}: Route.ComponentProps) {
  const { experience } = loaderData;
  const t = useT();
  const locale = useLocale();

  const priceText = formatMoney(experience.base_price, locale);
  const priceLabel = t("experience.per_person");

  const panel = (
    <WaitlistPanel
      itemId={experience.id}
      kind="experience"
      title={experience.title}
      price={experience.base_price}
      priceLabel={priceLabel}
    />
  );

  return (
    <>
      <article className="mx-auto w-full max-w-6xl px-4 pt-8 pb-8 md:px-8 md:pt-12 md:pb-32 lg:pb-12">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ganitel-secondary">
              {experience.experience_type}
            </p>
            <h1 className="mt-2 font-infoma text-3xl text-ganitel-text-title md:text-4xl">
              {experience.title}
            </h1>
            <p className="mt-1 text-sm text-ganitel-text-subtitle">
              {experience.city}, {experience.country_code}
            </p>
          </div>
        </header>

        <PropertyGallery photos={experience.photos} title={experience.title} />

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <section className="space-y-10">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ganitel-text-subtitle">
              <li>
                {experience.capacity} {t("property.guests")}
              </li>
              <li>{formatDuration(experience.duration_minutes)}</li>
            </ul>

            {experience.description ? (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-ganitel-text-title">
                  {t("property.description")}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ganitel-text-subtitle">
                  {experience.description}
                </p>
              </div>
            ) : null}

            <HostCard host={experience.host} />
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
        ctaLabel={t("waitlist.submit")}
        drawerTitle={experience.title}
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
