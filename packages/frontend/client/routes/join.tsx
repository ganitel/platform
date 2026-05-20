import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MapPin } from "lucide-react";
import type { Route } from "./+types/join";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { joinWaitlist } from "@/features/waitlist/api";
import { PhoneInput } from "@/shared/components/phone-input";
import { WAITLIST_FIELD_ERROR_KEYS } from "@/features/waitlist/error-keys";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { FieldError } from "@/shared/components/field-error";
import { FormErrorAlert } from "@/shared/components/form-error-alert";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { FormSuccessIcon } from "@/shared/components/form-success-icon";
import { IconInput } from "@/shared/components/icon-input";
import { cn } from "@/shared/lib/cn";
import { translateFormError } from "@/shared/lib/form-error";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";
import { seo } from "@/shared/lib/seo";

export const meta: Route.MetaFunction = () =>
  seo({
    title: "Rejoindre Ganitel — liste d'attente",
    description:
      "Rejoignez la liste d'attente de Ganitel. Soyez parmi les premiers à découvrir nos logements et expériences au Cameroun, Sénégal et Côte d'Ivoire.",
    pathname: "/join",
    ogImage: { url: "/og/default.png", alt: "Rejoindre Ganitel" },
    noindex: true,
  });

type Role = "traveler" | "host";
type Interest = "renting" | "experiences";
type InterestOption = Interest | "both";
type BudgetRange =
  | "under_50k"
  | "50k_150k"
  | "150k_300k"
  | "300k_500k"
  | "over_500k";
type BudgetCurrency = "xaf" | "eur" | "usd";
type HostInventory = "1" | "2_5" | "6_10" | "10_plus";
type HostStatus =
  | "ready"
  | "under_construction"
  | "planning"
  | "just_exploring";
type State = "idle" | "submitting" | "done" | "error";

const ROLES: Role[] = ["traveler", "host"];
const ROLE_LABEL_KEY = {
  traveler: "join.role.traveler",
  host: "join.role.host",
} as const;

const INTEREST_OPTIONS: InterestOption[] = ["renting", "experiences", "both"];
const INTEREST_LABEL_KEY = {
  renting: "join.interest.renting",
  experiences: "join.interest.experiences",
  both: "join.interest.both",
} as const;

const BUDGET_CURRENCIES: BudgetCurrency[] = ["xaf", "eur", "usd"];
const BUDGET_CURRENCY_LABEL_KEY = {
  xaf: "join.budget.currency.xaf",
  eur: "join.budget.currency.eur",
  usd: "join.budget.currency.usd",
} as const;

const BUDGET_LABEL_KEYS: Record<
  BudgetCurrency,
  Record<BudgetRange, TranslationKey>
> = {
  xaf: {
    under_50k: "join.budget.xaf.under_50k",
    "50k_150k": "join.budget.xaf.50k_150k",
    "150k_300k": "join.budget.xaf.150k_300k",
    "300k_500k": "join.budget.xaf.300k_500k",
    over_500k: "join.budget.xaf.over_500k",
  },
  eur: {
    under_50k: "join.budget.eur.under_50k",
    "50k_150k": "join.budget.eur.50k_150k",
    "150k_300k": "join.budget.eur.150k_300k",
    "300k_500k": "join.budget.eur.300k_500k",
    over_500k: "join.budget.eur.over_500k",
  },
  usd: {
    under_50k: "join.budget.usd.under_50k",
    "50k_150k": "join.budget.usd.50k_150k",
    "150k_300k": "join.budget.usd.150k_300k",
    "300k_500k": "join.budget.usd.300k_500k",
    over_500k: "join.budget.usd.over_500k",
  },
};

const BUDGET_RANGES: BudgetRange[] = [
  "under_50k",
  "50k_150k",
  "150k_300k",
  "300k_500k",
  "over_500k",
];

const HOST_INVENTORIES: HostInventory[] = ["1", "2_5", "6_10", "10_plus"];
const HOST_INVENTORY_LABEL_KEY = {
  "1": "join.host.inventory.1",
  "2_5": "join.host.inventory.2_5",
  "6_10": "join.host.inventory.6_10",
  "10_plus": "join.host.inventory.10_plus",
} as const;

const HOST_STATUSES: HostStatus[] = [
  "ready",
  "under_construction",
  "planning",
  "just_exploring",
];
const HOST_STATUS_LABEL_KEY = {
  ready: "join.host.status.ready",
  under_construction: "join.host.status.under_construction",
  planning: "join.host.status.planning",
  just_exploring: "join.host.status.just_exploring",
} as const;

export default function JoinPage() {
  const t = useT();
  const [state, setState] = useState<State>("idle");
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [role, setRole] = useState<Role>("traveler");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<Set<Interest>>(new Set());
  const [headcount, setHeadcount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState<BudgetCurrency>("xaf");
  const [budgetRange, setBudgetRange] = useState<BudgetRange | "">("");
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(true);
  const [notes, setNotes] = useState("");
  const [hostCity, setHostCity] = useState("");
  const [hostInventory, setHostInventory] = useState<HostInventory | "">("");
  const [hostStatus, setHostStatus] = useState<HostStatus | "">("");

  function toggleInterest(val: Interest) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  }

  function toggleBothShortcut() {
    setInterests((prev) => {
      const hasBoth = prev.has("renting") && prev.has("experiences");
      if (hasBoth) return new Set();
      return new Set<Interest>(["renting", "experiences"]);
    });
  }

  function interestOptionActive(val: InterestOption) {
    if (val === "both") {
      return interests.has("renting") && interests.has("experiences");
    }
    return interests.has(val);
  }

  function onInterestOptionClick(val: InterestOption) {
    if (val === "both") toggleBothShortcut();
    else toggleInterest(val);
  }

  function resolveInterest(): "renting" | "experiences" | "both" | undefined {
    const hasRenting = interests.has("renting");
    const hasExperiences = interests.has("experiences");
    if (hasRenting && hasExperiences) return "both";
    if (hasRenting) return "renting";
    if (hasExperiences) return "experiences";
    return undefined;
  }

  const isHost = role === "host";

  const submitDisabled =
    state === "submitting" ||
    !email.trim() ||
    !resolveInterest() ||
    !phoneValid ||
    (isHost
      ? !hostCity.trim() || !hostInventory || !hostStatus
      : !headcount || !budgetRange);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMessage("");
    setErrorDetail("");
    setFieldErrors({});
    try {
      const base = {
        email,
        phone: phone || undefined,
        role,
        notes: notes || undefined,
      };
      const payload = {
        ...base,
        interest: resolveInterest(),
        ...(isHost
          ? {
              host_city: hostCity || undefined,
              host_inventory: hostInventory || undefined,
              host_status: hostStatus || undefined,
            }
          : {
              headcount: headcount ? Number(headcount) : undefined,
              budget_range: budgetRange || undefined,
              budget_currency: budgetRange ? budgetCurrency : undefined,
            }),
      };
      const result = await joinWaitlist(payload);
      setEmailSent(result.confirmation_email_sent);
      setState("done");
    } catch (error) {
      setState("error");
      const translated = translateFormError(error, t, {
        fieldKeys: WAITLIST_FIELD_ERROR_KEYS,
        generic: "join.error",
        network: "join.error.network",
        timeout: "join.error.timeout",
      });
      setFieldErrors(translated.fieldErrors);
      const hasFieldErrors = Object.keys(translated.fieldErrors).length > 0;
      setErrorMessage(hasFieldErrors ? t("join.error") : translated.message);
      setErrorDetail(translated.detail);
    }
  }

  return (
    <AuthLayout title={t("join.title")} subtitle={t("join.subtitle")}>
      <AnimatePresence mode="wait">
        {state === "done" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center py-8 text-center"
          >
            <FormSuccessIcon />
            <p className="font-display text-2xl font-bold text-ganitel-text-title">
              {t("join.success.title")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ganitel-text-subtitle">
              {t("join.success.detail")}
            </p>
            {emailSent && (
              <p className="mt-3 text-xs text-ganitel-text-placeholder">
                {t("join.success.email")}
              </p>
            )}
            <Link
              to="/"
              className="mt-8 inline-flex items-center rounded-full bg-ganitel-text-title px-6 py-3 text-sm font-semibold text-ganitel-paper transition-all hover:bg-ganitel-moss"
            >
              {t("join.success.back")}
            </Link>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Role toggle */}
            <div>
              <p className={LABEL_CLASS}>{t("join.role.label")}</p>
              <div className="flex gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex-1 rounded-xl border py-3 text-sm font-medium transition-all",
                      role === r
                        ? "border-ganitel-secondary bg-ganitel-secondary/10 text-ganitel-secondary"
                        : "border-ganitel-stroke-neutral bg-ganitel-neutral-1 text-ganitel-text-subtitle hover:border-ganitel-text-title hover:text-ganitel-text-title",
                    )}
                  >
                    {t(ROLE_LABEL_KEY[r])}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="join-email" className={LABEL_CLASS}>
                {t("join.email")}
              </label>
              <IconInput
                id="join-email"
                icon={Mail}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@gmail.com"
              />
              <FieldError message={fieldErrors.email} />
            </div>

            <div>
              <PhoneInput
                id="join-phone"
                label={t("join.phone")}
                onChange={(value, isValid) => {
                  setPhone(value);
                  setPhoneValid(isValid);
                }}
              />
              <FieldError message={fieldErrors.phone} />
            </div>

            {/* Interest toggle */}
            <div>
              <p className={LABEL_CLASS}>
                {t(isHost ? "join.host.interest.label" : "join.interest.label")}
              </p>
              <div className="flex gap-3">
                {INTEREST_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onInterestOptionClick(val)}
                    className={cn(
                      "flex-1 rounded-xl border py-3 text-sm font-medium transition-all",
                      interestOptionActive(val)
                        ? "border-ganitel-secondary bg-ganitel-secondary/10 text-ganitel-secondary"
                        : "border-ganitel-stroke-neutral bg-ganitel-neutral-1 text-ganitel-text-subtitle hover:border-ganitel-text-title hover:text-ganitel-text-title",
                    )}
                  >
                    {t(INTEREST_LABEL_KEY[val])}
                  </button>
                ))}
              </div>
            </div>

            {isHost ? (
              <>
                {/* Host city */}
                <div>
                  <label htmlFor="join-host-city" className={LABEL_CLASS}>
                    {t("join.host.city.label")}
                  </label>
                  <IconInput
                    id="join-host-city"
                    icon={MapPin}
                    type="text"
                    maxLength={120}
                    value={hostCity}
                    onChange={(e) => setHostCity(e.target.value)}
                    placeholder={t("join.host.city.placeholder")}
                  />
                  <FieldError message={fieldErrors.host_city} />
                </div>

                {/* Host inventory */}
                <div>
                  <label htmlFor="join-host-inventory" className={LABEL_CLASS}>
                    {t("join.host.inventory.label")}
                  </label>
                  <select
                    id="join-host-inventory"
                    value={hostInventory}
                    onChange={(e) =>
                      setHostInventory(e.target.value as HostInventory | "")
                    }
                    className={cn(
                      INPUT_CLASS,
                      "appearance-none cursor-pointer",
                    )}
                  >
                    <option value="">
                      {t("join.host.inventory.placeholder")}
                    </option>
                    {HOST_INVENTORIES.map((inv) => (
                      <option key={inv} value={inv}>
                        {t(HOST_INVENTORY_LABEL_KEY[inv])}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Host status */}
                <div>
                  <label htmlFor="join-host-status" className={LABEL_CLASS}>
                    {t("join.host.status.label")}
                  </label>
                  <select
                    id="join-host-status"
                    value={hostStatus}
                    onChange={(e) =>
                      setHostStatus(e.target.value as HostStatus | "")
                    }
                    className={cn(
                      INPUT_CLASS,
                      "appearance-none cursor-pointer",
                    )}
                  >
                    <option value="">
                      {t("join.host.status.placeholder")}
                    </option>
                    {HOST_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(HOST_STATUS_LABEL_KEY[s])}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Headcount */}
                <div>
                  <label htmlFor="join-headcount" className={LABEL_CLASS}>
                    {t("join.headcount.label")}
                  </label>
                  <input
                    id="join-headcount"
                    type="number"
                    min={1}
                    max={500}
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                    placeholder={t("join.headcount.placeholder")}
                    className={INPUT_CLASS}
                  />
                  <FieldError message={fieldErrors.headcount} />
                </div>

                {/* Budget range */}
                <div>
                  <label htmlFor="join-budget" className={LABEL_CLASS}>
                    {t("join.budget.label")}
                  </label>
                  <p className="mb-2 text-xs text-ganitel-text-subtitle">
                    {t("join.budget.currency.label")}
                  </p>
                  <div className="mb-3 flex gap-2">
                    {BUDGET_CURRENCIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBudgetCurrency(c)}
                        className={cn(
                          "flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all",
                          budgetCurrency === c
                            ? "border-ganitel-secondary bg-ganitel-secondary/10 text-ganitel-secondary"
                            : "border-ganitel-stroke-neutral bg-ganitel-neutral-1 text-ganitel-text-subtitle hover:border-ganitel-text-title hover:text-ganitel-text-title",
                        )}
                      >
                        {t(BUDGET_CURRENCY_LABEL_KEY[c])}
                      </button>
                    ))}
                  </div>
                  <select
                    id="join-budget"
                    value={budgetRange}
                    onChange={(e) =>
                      setBudgetRange(e.target.value as BudgetRange | "")
                    }
                    className={cn(
                      INPUT_CLASS,
                      "appearance-none cursor-pointer",
                    )}
                  >
                    <option value="">{t("join.budget.placeholder")}</option>
                    {BUDGET_RANGES.map((r) => (
                      <option key={r} value={r}>
                        {t(BUDGET_LABEL_KEYS[budgetCurrency][r])}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="join-notes" className={LABEL_CLASS}>
                {t("join.notes.label")}
              </label>
              <textarea
                id="join-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("join.notes.placeholder")}
                className={cn(INPUT_CLASS, "resize-none")}
              />
              <FieldError message={fieldErrors.notes} />
            </div>

            {state === "error" && (
              <FormErrorAlert message={errorMessage} detail={errorDetail} />
            )}

            <FormSubmitButton
              disabled={submitDisabled}
              isSubmitting={state === "submitting"}
              submittingLabel={t("join.submitting")}
            >
              {t("join.submit")}
            </FormSubmitButton>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
