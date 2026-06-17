import { useState } from "react";
import { Link } from "react-router";
import { useSession } from "@/lib/supabase";
import { CheckCircle2 } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/shared/ui/calendar";
import { Button } from "@/shared/ui/button";
import { ApiError } from "@/shared/api/client";
import { formatMoney, formatDate } from "@/shared/lib/format";
import type { TranslationKey } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n";
import { pickPriceForLocale } from "@/shared/lib/price";
import {
  completePaymentAction,
  createBooking,
  initiateConfiguredPayment,
} from "@/features/bookings/api";
import type { PropertyDetail } from "@/features/properties/types";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Step = "pick" | "booking" | "done" | "error";

interface Props {
  property: PropertyDetail;
}

export function BookingPanel({ property }: Props) {
  const locale = useLocale();
  const t = useT();
  const { session } = useSession();
  const isSignedIn = !!session;

  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [step, setStep] = useState<Step>("pick");
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  const checkin = range?.from;
  const checkout = range?.to;
  const nights =
    checkin && checkout
      ? Math.round((checkout.getTime() - checkin.getTime()) / 86_400_000)
      : 0;
  const pickedPrice = pickPriceForLocale(property.prices, locale);
  const subtotal = nights * Number(pickedPrice?.amount ?? "0");
  const currency = pickedPrice?.currency ?? "XAF";
  const datesReady = Boolean(checkin && checkout && nights > 0);

  async function reserve() {
    if (!checkin || !checkout) return;
    setStep("booking");
    setErrorKey(null);
    try {
      const booking = await createBooking({
        property_id: property.id,
        check_in_date: toIsoDate(checkin),
        check_out_date: toIsoDate(checkout),
        guest_count: guests,
        currency,
      });
      const payment = await initiateConfiguredPayment(booking.id);
      const paymentResult = await completePaymentAction(payment);
      if (paymentResult === "redirected") {
        return;
      }
      setStep("done");
    } catch (e) {
      // Map known backend error patterns to localized strings rather than
      // forwarding the raw English API message directly to the user.
      const key: TranslationKey =
        e instanceof ApiError &&
        e.message.toLowerCase().includes("no longer available")
          ? "booking.conflict"
          : "common.error.generic";
      setErrorKey(key);
      setStep("error");
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{t("booking.confirmed")}</span>
        </div>
        <p className="text-sm text-ganitel-text-subtitle">
          {t("booking.confirmed.detail")}
        </p>
        {checkin && checkout && (
          <p className="text-sm text-ganitel-text-subtitle">
            {formatDate(checkin, locale)} → {formatDate(checkout, locale)} ·{" "}
            {nights} {t("booking.nights")} · {guests} {t("property.guests")}
          </p>
        )}
        <Link
          to="/bookings"
          className="block w-full rounded-xl bg-ganitel-primary py-3 text-center text-sm font-medium text-ganitel-text-button hover:bg-ganitel-primary/90"
        >
          {t("nav.bookings")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary p-6 shadow-sm space-y-4">
      <p className="text-sm text-ganitel-text-subtitle">
        <span className="text-2xl font-semibold text-ganitel-text-title">
          {pickedPrice ? formatMoney(pickedPrice, locale) : ""}
        </span>
        <span> · {t("property.per_night")}</span>
      </p>

      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        disabled={{ before: new Date() }}
        numberOfMonths={1}
        className="-mx-2"
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-ganitel-text-subtitle">
          {t("property.guests")}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("booking.remove_guest")}
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            disabled={guests <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ganitel-stroke-neutral text-base disabled:opacity-40"
          >
            −
          </button>
          <span className="w-4 text-center text-sm font-medium">{guests}</span>
          <button
            type="button"
            aria-label={t("booking.add_guest")}
            onClick={() =>
              setGuests((g) => Math.min(property.capacity ?? Infinity, g + 1))
            }
            disabled={property.capacity != null && guests >= property.capacity}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ganitel-stroke-neutral text-base disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      {datesReady && (
        <div className="space-y-1 border-t border-ganitel-stroke-neutral pt-4 text-sm text-ganitel-text-subtitle">
          <div className="flex justify-between">
            <span>
              {pickedPrice ? formatMoney(pickedPrice, locale) : ""} × {nights}{" "}
              {t("booking.nights")}
            </span>
            <span>
              {formatMoney({ amount: String(subtotal), currency }, locale)}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-ganitel-text-title">
            <span>{t("booking.total")}</span>
            <span>
              {formatMoney({ amount: String(subtotal), currency }, locale)}
            </span>
          </div>
        </div>
      )}

      {step === "error" && errorKey && (
        <p className="text-xs text-red-500">{t(errorKey)}</p>
      )}

      {isSignedIn ? (
        <Button
          type="button"
          onClick={reserve}
          disabled={!datesReady || step === "booking"}
          className="h-12 w-full rounded-xl bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90 disabled:opacity-50"
        >
          {step === "booking" ? t("common.loading") : t("property.book")}
        </Button>
      ) : (
        <Link
          to="/sign-in"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-ganitel-primary text-sm font-medium text-ganitel-text-button hover:bg-ganitel-primary/90"
        >
          {t("booking.signin_to_book")}
        </Link>
      )}
    </div>
  );
}
