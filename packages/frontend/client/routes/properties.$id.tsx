import { useState } from "react";
import { data } from "react-router";

import type { Route } from "./+types/properties.$id";

import { AMENITY_ICONS } from "@/features/reference/amenity-icons";
import { HostCard } from "@/features/properties/components/host-card";
import { PropertyGallery } from "@/features/properties/components/property-gallery";
import { BookingPanel } from "@/features/properties/components/booking-panel";
import { RoomCard } from "@/features/properties/components/room-card";
import { RoomPicker } from "@/features/properties/components/room-picker";
import {
  useAmenityLabel,
  useHotelCategoryLabel,
  usePropertyTypeLabel,
} from "@/features/reference/hooks";
import { WaitlistPanel } from "@/features/waitlist/components/waitlist-panel";
import { MobileDetailPanel } from "@/shared/components/mobile-detail-panel";
import { ErrorState } from "@/shared/components/error-state";
import { Markdown } from "@/shared/components/markdown";
import { serverFetch, ServerApiError } from "@/shared/api/server";
import { PRIVATE_NO_STORE_CACHE } from "@/shared/lib/cache";
import { formatMoney } from "@/shared/lib/format";
import {
  localeFromAcceptLanguage,
  t as translate,
  useLocale,
  useT,
} from "@/shared/lib/i18n";
import { pickPriceForLocale } from "@/shared/lib/price";
import { usePrelaunch } from "@/shared/hooks/use-prelaunch";
import { seo, absoluteUrl } from "@/shared/lib/seo";
import type {
  PropertyDetail,
  RoomTypePublic,
} from "@/features/properties/types";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PRIVATE_NO_STORE_CACHE,
});

export const meta: Route.MetaFunction = ({ data, params }) => {
  const locale = data?.locale ?? "fr";
  if (!data?.property) {
    return seo({
      title: translate("property.not_found.title", locale),
      description: translate("property.not_found.description", locale),
      pathname: `/properties/${params.id ?? ""}`,
      locale,
      noindex: true,
    });
  }
  const p = data.property;
  const title = `${p.title} — ${p.city} | Ganitel`;
  const description = (
    p.description?.trim().slice(0, 160) ||
    translate("property.type_in_city", locale)
      .replace("{type}", p.property_type)
      .replace("{city}", p.city)
      .replace("{country}", p.country_code)
  ).replace(/\s+/g, " ");
  const ogImage = p.cover_media?.url
    ? { url: p.cover_media.url, alt: p.title }
    : { url: "/og/stays.png", alt: p.title };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": p.kind === "hotel" ? "Hotel" : "LodgingBusiness",
    "@id": absoluteUrl(`/properties/${p.id}`),
    name: p.title,
    description: p.description || undefined,
    url: absoluteUrl(`/properties/${p.id}`),
    image: p.media.map((m) => m.url),
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
    priceRange:
      p.kind === "hotel"
        ? p.summary?.min_price
          ? `${p.summary.min_price.amount} ${p.summary.min_price.currency}`
          : undefined
        : p.prices.length > 0
          ? `${p.prices[0].amount} ${p.prices[0].currency}`
          : undefined,
    numberOfRooms:
      p.kind === "hotel"
        ? (p.summary?.total_inventory ?? undefined)
        : (p.bedrooms ?? undefined),
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

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  try {
    const property = await serverFetch<PropertyDetail>(
      `/properties/${params.id}`,
    );
    return { property, locale };
  } catch (e) {
    if (e instanceof ServerApiError && e.status === 404) {
      throw data(translate("property.not_found.short", locale), {
        status: 404,
      });
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
  const propertyTypeLabel = usePropertyTypeLabel();
  const hotelCategoryLabel = useHotelCategoryLabel();
  const amenityLabel = useAmenityLabel();
  const isPrelaunch = usePrelaunch();
  const [selectedRoom, setSelectedRoom] = useState<RoomTypePublic | null>(null);

  const activeRooms =
    property.kind === "hotel"
      ? property.rooms.filter((room) => room.active)
      : [];
  const selectedRoomPrice = selectedRoom
    ? pickPriceForLocale(selectedRoom.prices, locale)
    : null;
  const pickedPrice =
    property.kind === "hotel"
      ? (selectedRoomPrice ?? property.summary?.min_price ?? null)
      : pickPriceForLocale(property.prices, locale);
  const priceText = pickedPrice ? formatMoney(pickedPrice, locale) : "";
  const priceLabel =
    property.kind === "hotel" && !selectedRoomPrice
      ? t("hotels.price.from")
      : t("property.per_night");
  const eyebrow =
    property.kind === "hotel"
      ? hotelCategoryLabel(property.property_type)
      : propertyTypeLabel(property.property_type);

  const mustPickRoom =
    isPrelaunch &&
    property.kind === "hotel" &&
    activeRooms.length > 0 &&
    !selectedRoom;

  const panel = isPrelaunch ? (
    mustPickRoom ? (
      <PickRoomPrompt />
    ) : (
      <WaitlistPanel
        itemId={property.id}
        kind="property"
        title={property.title}
        price={pickedPrice ?? { amount: "0", currency: "XAF" }}
        priceLabel={priceLabel}
        collectTravelDates
        room={selectedRoom}
        maxGuests={property.capacity ?? undefined}
      />
    )
  ) : property.kind === "hotel" ? (
    <RoomPicker property={property} />
  ) : (
    <BookingPanel property={property} />
  );

  return (
    <>
      <article className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 md:px-8 md:pt-12 lg:pb-12">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4 md:mb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-ganitel-brown">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl leading-[1.04] tracking-[-0.01em] text-ganitel-text-title md:text-5xl">
              {property.title}
            </h1>
            <p className="mt-1.5 text-sm text-ganitel-text-subtitle">
              {property.city}, {property.country_code}
            </p>
          </div>
        </header>

        <PropertyGallery photos={property.media} title={property.title} />

        <div className="mt-8 grid grid-cols-1 gap-8 md:mt-10 md:gap-10 lg:grid-cols-[1fr_360px]">
          <section className="space-y-8 md:space-y-10">
            {property.kind === "rental" && (
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
            )}

            <div>
              <h2 className="mb-3 text-xl text-ganitel-text-title">
                {t("property.description")}
              </h2>
              {property.description ? (
                <Markdown source={property.description} />
              ) : (
                <p className="text-sm text-ganitel-text-subtitle">
                  {t("common.dash")}
                </p>
              )}
            </div>

            {isPrelaunch &&
              property.kind === "hotel" &&
              activeRooms.length > 0 && (
                <div>
                  <h2 className="mb-3 text-xl text-ganitel-text-title">
                    {t("hotels.room.choose_yours")}
                  </h2>
                  <div className="space-y-3">
                    {activeRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        selected={selectedRoom?.id === room.id}
                        onSelect={() => setSelectedRoom(room)}
                        showAvailability={false}
                      />
                    ))}
                  </div>
                </div>
              )}

            {property.amenities.length > 0 ? (
              <div>
                <h2 className="mb-3 text-xl text-ganitel-text-title">
                  {t("property.amenities")}
                </h2>
                <ul className="grid grid-cols-2 gap-y-2 text-sm text-ganitel-text-subtitle md:grid-cols-3">
                  {property.amenities.map((a) => {
                    const Icon = AMENITY_ICONS[a];
                    return (
                      <li key={a} className="flex items-center gap-2">
                        {Icon ? (
                          <Icon
                            className="size-4 shrink-0 text-ganitel-text-placeholder"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        ) : null}
                        <span>{amenityLabel(a)}</span>
                      </li>
                    );
                  })}
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

function PickRoomPrompt() {
  const t = useT();
  return (
    <div className="rounded-2xl border border-ganitel-stroke-neutral bg-white p-6 shadow-sm">
      <p className="text-xl font-bold leading-tight tracking-tight text-ganitel-text-title">
        {t("waitlist.pick_room.title")}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ganitel-text-subtitle">
        {t("waitlist.pick_room.sub")}
      </p>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <ErrorState />
    </div>
  );
}
