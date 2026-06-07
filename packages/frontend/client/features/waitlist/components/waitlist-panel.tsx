import { useState } from "react";
import { BadgeCheck, Mail } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { joinWaitlist } from "@/features/waitlist/api";
import { buildWaitlistPayload } from "@/features/waitlist/payload";
import { WAITLIST_FIELD_ERROR_KEYS } from "@/features/waitlist/error-keys";
import { FormErrorAlert } from "@/shared/components/form-error-alert";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { FormSuccessIcon } from "@/shared/components/form-success-icon";
import { IconInput } from "@/shared/components/icon-input";
import { PhoneInput } from "@/shared/components/phone-input";
import { useLocale, useT } from "@/shared/lib/i18n";
import { translateFormError } from "@/shared/lib/form-error";
import { INPUT_CLASS } from "@/shared/lib/form-styles";
import { formatMoney } from "@/shared/lib/format";
import { Calendar } from "@/shared/ui/calendar";
import type { Money, RoomTypePublic } from "@/features/properties/types";

interface Props {
  itemId: string;
  kind: "property" | "experience";
  title: string;
  price: Money;
  priceLabel: string;
  collectTravelDates?: boolean;
  room?: RoomTypePublic | null;
  maxGuests?: number;
}

type State = "idle" | "submitting" | "done" | "error";

export function WaitlistPanel({
  itemId,
  kind,
  title,
  price,
  priceLabel,
  collectTravelDates = false,
  room = null,
  maxGuests,
}: Props) {
  const locale = useLocale();
  const t = useT();
  const [state, setState] = useState<State>("idle");
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);

  const guestCap = room?.max_guests ?? maxGuests ?? 16;
  const datesReady = Boolean(range?.from && range?.to && range.to > range.from);
  const travelReady = !collectTravelDates || datesReady;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !travelReady) return;
    setState("submitting");
    setErrorMessage("");
    setErrorDetail("");
    try {
      const result = await joinWaitlist(
        buildWaitlistPayload({
          email,
          name,
          phone,
          kind,
          itemId,
          range: collectTravelDates ? range : undefined,
          guests: collectTravelDates ? guests : undefined,
          roomTypeId: room?.id,
        }),
      );
      setEmailSent(result.confirmation_email_sent);
      setState("done");
    } catch (error) {
      setState("error");
      const translated = translateFormError(error, t, {
        fieldKeys: WAITLIST_FIELD_ERROR_KEYS,
        generic: "waitlist.error",
        network: "join.error.network",
        timeout: "join.error.timeout",
      });
      const firstFieldError = Object.values(translated.fieldErrors)[0];
      setErrorMessage(firstFieldError ?? translated.message);
      setErrorDetail(firstFieldError ? "" : translated.detail);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ganitel-stroke-neutral bg-white shadow-sm">
      {/* Price header */}
      <div className="border-b border-ganitel-stroke-neutral px-6 py-5">
        <p className="text-xs uppercase tracking-[0.18em] text-ganitel-text-placeholder">
          {t("waitlist.price_note")}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-ganitel-text-title">
          {formatMoney(price, locale)}
          <span className="ml-1.5 text-sm font-normal text-ganitel-text-subtitle">
            / {priceLabel}
          </span>
        </p>
      </div>

      {/* Badge */}
      <div className="px-6 pt-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ganitel-secondary/15 px-3 py-1 text-xs font-medium text-ganitel-secondary">
          <BadgeCheck className="size-3" aria-hidden />
          {t("waitlist.badge")}
        </span>
      </div>

      {/* Body */}
      <div className="px-6 pb-6 pt-4">
        {state === "done" ? (
          <SuccessState kind={kind} emailSent={emailSent} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xl font-bold leading-tight tracking-tight text-ganitel-text-title">
                {t("waitlist.headline")}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ganitel-text-subtitle">
                {t("waitlist.sub")}
              </p>
            </div>

            {room && (
              <div className="rounded-xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-ganitel-text-placeholder">
                  {t("waitlist.room")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ganitel-text-title">
                  {room.title}
                </p>
              </div>
            )}

            {collectTravelDates && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-ganitel-text-placeholder">
                  {t("waitlist.dates")}
                </p>
                <div data-testid="waitlist-calendar">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    disabled={{ before: new Date() }}
                    numberOfMonths={1}
                    className="-mx-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ganitel-text-subtitle">
                    {t("property.guests")}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={t("booking.remove_guest")}
                      onClick={() =>
                        setGuests((current) => Math.max(1, current - 1))
                      }
                      disabled={guests <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-ganitel-stroke-neutral text-base disabled:opacity-40"
                    >
                      −
                    </button>
                    <span
                      data-testid="waitlist-guests"
                      className="w-4 text-center text-sm font-medium"
                    >
                      {guests}
                    </span>
                    <button
                      type="button"
                      aria-label={t("booking.add_guest")}
                      onClick={() =>
                        setGuests((current) => Math.min(guestCap, current + 1))
                      }
                      disabled={guests >= guestCap}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-ganitel-stroke-neutral text-base disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <IconInput
                icon={Mail}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("waitlist.email")}
              />

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("waitlist.name")}
                className={INPUT_CLASS}
              />

              <PhoneInput
                id="waitlist-phone"
                label={t("waitlist.phone")}
                hideLabel
                onChange={(value, isValid) => {
                  setPhone(value);
                  setPhoneValid(isValid);
                }}
              />
            </div>

            {state === "error" && (
              <FormErrorAlert message={errorMessage} detail={errorDetail} />
            )}

            <FormSubmitButton
              disabled={!email || !phoneValid || !travelReady}
              isSubmitting={state === "submitting"}
              submittingLabel={t("waitlist.submitting")}
            >
              {t("waitlist.submit")}
            </FormSubmitButton>

            <p className="text-center text-xs text-ganitel-text-placeholder">
              {title}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function SuccessState({
  kind,
  emailSent,
}: {
  kind: "property" | "experience";
  emailSent: boolean;
}) {
  const t = useT();
  return (
    <div className="ganitel-anim-fade-up flex flex-col items-center py-6 text-center">
      <FormSuccessIcon size="md" />
      <p className="text-xl font-bold tracking-tight text-ganitel-text-title">
        {t("waitlist.success.title")}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ganitel-text-subtitle">
        {kind === "property"
          ? t("waitlist.success.detail")
          : t("waitlist.success.detail.experience")}
      </p>
      {emailSent && (
        <p className="mt-3 text-xs text-ganitel-text-placeholder">
          {t("waitlist.success.email")}
        </p>
      )}
    </div>
  );
}
