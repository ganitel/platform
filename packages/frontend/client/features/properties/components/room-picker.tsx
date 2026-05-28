import { useMemo, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";

import {
  confirmNoopPayment,
  createBooking,
  initiatePayment,
} from "@/features/bookings/api";
import { listPropertyRooms } from "@/features/properties/api";
import { RoomCard } from "@/features/properties/components/room-card";
import type {
  PropertyDetail,
  RoomTypePublic,
} from "@/features/properties/types";
import { useSession } from "@/lib/supabase";
import { ApiError } from "@/shared/api/client";
import { formatDate } from "@/shared/lib/format";
import type { TranslationKey } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";

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

export function RoomPicker({ property }: Props) {
  const locale = useLocale();
  const t = useT();
  const { session } = useSession();
  const isSignedIn = !!session;

  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("pick");
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);

  const checkIn = range?.from;
  const checkOut = range?.to;
  const datesReady = Boolean(checkIn && checkOut && checkOut > checkIn);
  const currency = property.summary?.min_price?.currency ?? "XAF";

  const roomsQuery = useQuery({
    queryKey: [
      "property-rooms",
      property.id,
      datesReady ? toIsoDate(checkIn!) : null,
      datesReady ? toIsoDate(checkOut!) : null,
      guests,
      currency,
    ],
    queryFn: () =>
      listPropertyRooms(property.id, {
        check_in: datesReady ? toIsoDate(checkIn!) : undefined,
        check_out: datesReady ? toIsoDate(checkOut!) : undefined,
        guests,
        currency,
      }),
    initialData: property.rooms,
  });

  const rooms = useMemo<RoomTypePublic[]>(
    () => (roomsQuery.data ?? []).filter((r) => r.active),
    [roomsQuery.data],
  );

  const effectiveSelectedRoomId = useMemo(() => {
    if (!selectedRoomId) return null;
    const match = rooms.find((r) => r.id === selectedRoomId);
    if (!match) return null;
    if (match.availability?.available === false) return null;
    return selectedRoomId;
  }, [rooms, selectedRoomId]);

  async function reserve() {
    if (!checkIn || !checkOut || !effectiveSelectedRoomId) return;
    setStep("booking");
    setErrorKey(null);
    try {
      const booking = await createBooking({
        property_id: property.id,
        room_type_id: effectiveSelectedRoomId,
        check_in_date: toIsoDate(checkIn),
        check_out_date: toIsoDate(checkOut),
        guest_count: guests,
        currency,
      });
      const payment = await initiatePayment(booking.id, "noop");
      if (payment.client_action.kind === "auto_capture") {
        await confirmNoopPayment(payment.provider_intent_id);
      }
      setStep("done");
    } catch (e) {
      const code: TranslationKey =
        e instanceof ApiError &&
        e.message.toLowerCase().includes("no longer available")
          ? "booking.conflict"
          : "common.error.generic";
      setErrorKey(code);
      setStep("error");
    }
  }

  if (step === "done") {
    return (
      <div className="space-y-4 rounded-2xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary p-6 shadow-sm">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{t("booking.confirmed")}</span>
        </div>
        <p className="text-sm text-ganitel-text-subtitle">
          {t("booking.confirmed.detail")}
        </p>
        {checkIn && checkOut && (
          <p className="text-sm text-ganitel-text-subtitle">
            {formatDate(checkIn, locale)} → {formatDate(checkOut, locale)} ·{" "}
            {guests} {t("property.guests")}
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
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary p-6 shadow-sm">
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
            <span className="w-4 text-center text-sm font-medium">
              {guests}
            </span>
            <button
              type="button"
              aria-label={t("booking.add_guest")}
              onClick={() =>
                setGuests((g) =>
                  Math.min(property.summary?.max_capacity ?? 1, g + 1),
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ganitel-stroke-neutral text-base disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ganitel-text-title">
          {t("hotels.room.choose_yours")}
        </h2>
        <div className="space-y-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              selected={effectiveSelectedRoomId === room.id}
              onSelect={() => setSelectedRoomId(room.id)}
              showAvailability={datesReady}
            />
          ))}
          {rooms.length === 0 && (
            <p className="rounded-2xl border border-dashed border-ganitel-stroke-neutral p-6 text-center text-sm text-ganitel-text-subtitle">
              {t("hotels.empty")}
            </p>
          )}
        </div>
      </div>

      {step === "error" && errorKey && (
        <p className="text-xs text-red-500">{t(errorKey)}</p>
      )}

      {isSignedIn ? (
        <Button
          type="button"
          onClick={reserve}
          disabled={
            !datesReady || !effectiveSelectedRoomId || step === "booking"
          }
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
