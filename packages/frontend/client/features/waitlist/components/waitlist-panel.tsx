import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";

import { joinWaitlist } from "@/features/waitlist/api";
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
import type { Money } from "@/features/properties/types";

interface Props {
  itemId: string;
  kind: "property" | "experience";
  title: string;
  price: Money;
  priceLabel: string;
}

type State = "idle" | "submitting" | "done" | "error";

export function WaitlistPanel({
  itemId,
  kind,
  title,
  price,
  priceLabel,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("submitting");
    setErrorMessage("");
    setErrorDetail("");
    try {
      const result = await joinWaitlist({
        email,
        name: name || undefined,
        phone: phone || undefined,
        ...(kind === "property"
          ? { property_id: itemId }
          : { experience_id: itemId }),
      });
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
          <Sparkles className="size-3" aria-hidden />
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
              disabled={!email || !phoneValid}
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
