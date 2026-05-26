import { data } from "react-router";

import type { Route } from "./+types/experiences.$id";

import { HostCard } from "@/features/properties/components/host-card";
import { PropertyGallery } from "@/features/properties/components/property-gallery";
import { useExperienceTypeLabel } from "@/features/reference/hooks";
import { WaitlistPanel } from "@/features/waitlist/components/waitlist-panel";
import { MobileDetailPanel } from "@/shared/components/mobile-detail-panel";
import { ErrorState } from "@/shared/components/error-state";
import { Markdown } from "@/shared/components/markdown";
import { serverFetch, ServerApiError } from "@/shared/api/server";
import { PRIVATE_NO_STORE_CACHE } from "@/shared/lib/cache";
import { formatMoney } from "@/shared/lib/format";
import {
  type Locale,
  localeFromAcceptLanguage,
  t as translate,
  useLocale,
  useT,
} from "@/shared/lib/i18n";
import { pickPriceForLocale } from "@/shared/lib/price";
import { seo, absoluteUrl } from "@/shared/lib/seo";
import type { ExperienceDetail } from "@/features/experiences/types";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PRIVATE_NO_STORE_CACHE,
});

export const meta: Route.MetaFunction = ({
  data,
  params,
}: {
  data: { experience: ExperienceDetail; locale: Locale } | null | undefined;
  params: { id?: string };
}) => {
  const locale = data?.locale ?? "fr";
  if (!data?.experience) {
    return seo({
      title: translate("experience.not_found.title", locale),
      description: translate("experience.not_found.description", locale),
      pathname: `/experiences/${params.id ?? ""}`,
      locale,
      noindex: true,
    });
  }
  const e = data.experience;
  const title = `${e.title} — ${e.city} | ganitel`;
  const description = (
    e.description?.slice(0, 160) ||
    translate("property.type_in_city", locale)
      .replace("{type}", e.experience_type)
      .replace("{city}", e.city)
      .replace("{country}", e.country_code)
  ).replace(/\s+/g, " ");
  const ogImage = e.cover_media?.url
    ? { url: e.cover_media.url, alt: e.title }
    : { url: "/og/experiences.png", alt: e.title };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "@id": absoluteUrl(`/experiences/${e.id}`),
    name: e.title,
    description: e.description || undefined,
    url: absoluteUrl(`/experiences/${e.id}`),
    image: e.media.map((m) => m.url),
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
    offers:
      e.prices.length > 0
        ? {
            "@type": "Offer",
            price: e.prices[0].amount,
            priceCurrency: e.prices[0].currency,
            url: absoluteUrl(`/experiences/${e.id}`),
            availability: "https://schema.org/InStock",
          }
        : undefined,
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

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  try {
    const experience = await serverFetch<ExperienceDetail>(
      `/experiences/${params.id}`,
    );
    return { experience, locale };
  } catch (e) {
    if (e instanceof ServerApiError && e.status === 404) {
      throw data(translate("experience.not_found.short", locale), {
        status: 404,
      });
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
  const experienceTypeLabel = useExperienceTypeLabel();

  const pickedPrice = pickPriceForLocale(experience.prices, locale);
  const priceText = pickedPrice ? formatMoney(pickedPrice, locale) : "";
  const priceLabel = t("experience.per_person");

  const panel = (
    <WaitlistPanel
      itemId={experience.id}
      kind="experience"
      title={experience.title}
      price={pickedPrice ?? { amount: "0", currency: "XAF" }}
      priceLabel={priceLabel}
    />
  );

  return (
    <>
      <article className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 md:px-8 md:pt-12 lg:pb-12">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4 md:mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ganitel-secondary">
              {experienceTypeLabel(experience.experience_type)}
            </p>
            <h1 className="mt-2 font-infoma text-[28px] leading-[1.05] text-ganitel-text-title sm:text-3xl md:text-4xl">
              {experience.title}
            </h1>
            <p className="mt-1.5 text-sm text-ganitel-text-subtitle">
              {experience.city}, {experience.country_code}
            </p>
          </div>
        </header>

        <PropertyGallery photos={experience.media} title={experience.title} />

        <div className="mt-8 grid grid-cols-1 gap-8 md:mt-10 md:gap-10 lg:grid-cols-[1fr_360px]">
          <section className="space-y-8 md:space-y-10">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ganitel-text-subtitle">
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
                <Markdown source={experience.description} />
              </div>
            ) : null}

            <HostCard host={experience.host} kind="guide" />
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
