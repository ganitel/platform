import { redirect } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

import type { Route } from "./+types/bookings";
import { getServerToken } from "@/shared/api/server";
import { listMyBookings } from "@/features/bookings/api";
import type { BookingPublic } from "@/features/bookings/types";
import { formatMoney, formatDate } from "@/shared/lib/format";
import {
  localeFromAcceptLanguage,
  t,
  useLocale,
  useT,
  type TranslationKey,
} from "@/shared/lib/i18n";

export const meta: Route.MetaFunction = ({ data }) => [
  { title: t("bookings.meta.title", data?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export async function loader({ request }: Route.LoaderArgs) {
  if (import.meta.env.VITE_PRELAUNCH_MODE === "true") {
    return redirect("/");
  }
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  const token = await getServerToken(request);
  if (!token) {
    const url = new URL(request.url);
    return redirect(
      `/sign-in?redirect_url=${encodeURIComponent(url.pathname + url.search)}`,
    );
  }
  return { locale };
}

const STATUS_I18N_KEY: Record<BookingPublic["status"], TranslationKey> = {
  pending_payment: "booking.status.pending_payment",
  confirmed: "booking.status.confirmed",
  cancelled_by_guest: "booking.status.cancelled_by_guest",
  cancelled_by_host: "booking.status.cancelled_by_host",
  cancelled_expired: "booking.status.cancelled_expired",
  completed: "booking.status.completed",
  disputed: "booking.status.disputed",
};

const STATUS_COLOR: Record<BookingPublic["status"], string> = {
  pending_payment: "text-amber-600 bg-amber-50",
  confirmed: "text-green-700 bg-green-50",
  cancelled_by_guest:
    "text-ganitel-text-subtitle bg-ganitel-background-secondary",
  cancelled_by_host:
    "text-ganitel-text-subtitle bg-ganitel-background-secondary",
  cancelled_expired:
    "text-ganitel-text-subtitle bg-ganitel-background-secondary",
  completed: "text-ganitel-text-subtitle bg-ganitel-background-secondary",
  disputed: "text-red-600 bg-red-50",
};

function BookingCard({ booking }: { booking: BookingPublic }) {
  const locale = useLocale();
  const t = useT();
  const color = STATUS_COLOR[booking.status];
  const nightKey = booking.nights === 1 ? "booking.night" : "booking.nights";
  const guestKey =
    booking.guest_count === 1 ? "booking.guest" : "property.guests";

  return (
    <li className="rounded-2xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-ganitel-text-title">
            {formatDate(booking.check_in_date, locale)} →{" "}
            {formatDate(booking.check_out_date, locale)}
          </p>
          <p className="text-xs text-ganitel-text-subtitle">
            {booking.nights} {t(nightKey)} · {booking.guest_count} {t(guestKey)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
        >
          {t(STATUS_I18N_KEY[booking.status])}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-ganitel-stroke-neutral pt-3">
        <span className="text-sm font-semibold text-ganitel-text-title">
          {formatMoney(booking.total, locale)}
        </span>
        <Link
          to={`/properties/${booking.property_id}`}
          className="text-xs text-ganitel-secondary hover:underline"
        >
          {t("booking.view_property")} →
        </Link>
      </div>
    </li>
  );
}

export default function MyBookingsRoute() {
  const t = useT();
  const {
    data: bookings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: listMyBookings,
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-infoma text-3xl text-ganitel-text-title">
        {t("nav.bookings")}
      </h1>

      {isLoading && (
        <p className="mt-6 text-sm text-ganitel-text-subtitle">
          {t("common.loading")}
        </p>
      )}

      {isError && (
        <p className="mt-6 text-sm text-red-500">{t("common.error.generic")}</p>
      )}

      {bookings && bookings.length === 0 && (
        <div className="mt-10 space-y-4 text-center">
          <p className="text-sm text-ganitel-text-subtitle">
            {t("booking.empty")}
          </p>
          <Link
            to="/browse"
            className="inline-block rounded-xl bg-ganitel-primary px-5 py-2.5 text-sm font-medium text-ganitel-text-button hover:bg-ganitel-primary/90"
          >
            {t("landing.featured.see_all")}
          </Link>
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <ul className="mt-6 space-y-4">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </ul>
      )}
    </div>
  );
}
