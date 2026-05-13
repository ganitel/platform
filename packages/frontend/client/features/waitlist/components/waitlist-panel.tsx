import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Mail, Phone, Sparkles } from "lucide-react";

import { joinWaitlist } from "@/features/waitlist/api";
import { WAITLIST_FIELD_ERROR_KEYS } from "@/features/waitlist/error-keys";
import {
  ApiError,
  extractErrorCode,
  extractFieldErrors,
} from "@/shared/api/client";
import { useLocale, useT } from "@/shared/lib/i18n";
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
      const fieldErrs = extractFieldErrors(error);
      if (fieldErrs && fieldErrs.length > 0) {
        const first = fieldErrs[0];
        const key =
          WAITLIST_FIELD_ERROR_KEYS[`${first.field}.${first.type}`] ??
          WAITLIST_FIELD_ERROR_KEYS[`${first.field}.missing`];
        setErrorMessage(key ? t(key) : `${first.field}: ${first.msg}`);
      } else if (error instanceof ApiError) {
        if (error.status === 0) {
          setErrorMessage(t("join.error.network"));
          setErrorDetail(error.message);
        } else {
          const code = extractErrorCode(error);
          setErrorMessage(error.message || t("waitlist.error"));
          setErrorDetail(
            code ? `${error.status} · ${code}` : `${error.status}`,
          );
        }
      } else {
        setErrorMessage(t("waitlist.error"));
        setErrorDetail(error instanceof Error ? error.message : String(error));
      }
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ganitel-stroke-neutral bg-white shadow-sm">
      {/* Price header */}
      <div className="border-b border-ganitel-stroke-neutral px-6 py-5">
        <p className="text-xs uppercase tracking-[0.18em] text-ganitel-text-placeholder">
          {t("waitlist.price_note")}
        </p>
        <p className="mt-1 font-infoma text-2xl text-ganitel-text-title">
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
        <AnimatePresence mode="wait">
          {state === "done" ? (
            <SuccessState kind={kind} emailSent={emailSent} />
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <p className="font-display text-xl font-bold leading-tight text-ganitel-text-title">
                  {t("waitlist.headline")}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ganitel-text-subtitle">
                  {t("waitlist.sub")}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
                    aria-hidden
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("waitlist.email")}
                    className="w-full rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 py-3 pl-10 pr-4 text-base text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/20 transition-all md:text-sm"
                  />
                </div>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("waitlist.name")}
                  className="w-full rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-3 text-base text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/20 transition-all md:text-sm"
                />

                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
                    aria-hidden
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("waitlist.phone")}
                    className="w-full rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 py-3 pl-10 pr-4 text-base text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/20 transition-all md:text-sm"
                  />
                </div>
              </div>

              {state === "error" && errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  <p>{errorMessage}</p>
                  {errorDetail && (
                    <p className="mt-1 font-mono text-[11px] opacity-70">
                      {errorDetail}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={state === "submitting" || !email}
                className="w-full rounded-xl bg-ganitel-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-ganitel-primary/90 active:scale-[0.98] disabled:opacity-60"
              >
                {state === "submitting"
                  ? t("waitlist.submitting")
                  : t("waitlist.submit")}
              </button>

              <p className="text-center text-xs text-ganitel-text-placeholder">
                {title}
              </p>
            </motion.form>
          )}
        </AnimatePresence>
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
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-6 text-center"
    >
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-ganitel-accent-green">
        <CheckCircle2 className="size-7 text-ganitel-moss" aria-hidden />
      </div>
      <p className="font-display text-xl font-bold text-ganitel-text-title">
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
    </motion.div>
  );
}
