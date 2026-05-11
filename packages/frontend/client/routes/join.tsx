import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import type { Route } from "./+types/join";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { joinWaitlist } from "@/features/waitlist/api";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/cn";

export const meta: Route.MetaFunction = () => [
  { title: "Rejoindre Ganitel" },
  { name: "robots", content: "noindex" },
];

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

const INPUT_CLASS =
  "w-full rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-3 text-sm text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/20 transition-all";

const LABEL_CLASS = "block text-sm font-medium text-ganitel-text-title mb-1.5";

export default function JoinPage() {
  const t = useT();
  const [state, setState] = useState<State>("idle");
  const [role, setRole] = useState<Role>("traveler");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<Set<Interest>>(new Set());
  const [headcount, setHeadcount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState<BudgetCurrency>("xaf");
  const [budgetRange, setBudgetRange] = useState<BudgetRange | "">("");
  const [phone, setPhone] = useState("");
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
    !email ||
    (isHost &&
      (!resolveInterest() || !hostCity || !hostInventory || !hostStatus));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    try {
      const base = {
        email,
        phone: phone || undefined,
        role,
        notes: notes || undefined,
      };
      const payload = isHost
        ? {
            ...base,
            interest: resolveInterest(),
            host_city: hostCity || undefined,
            host_inventory: hostInventory || undefined,
            host_status: hostStatus || undefined,
          }
        : {
            ...base,
            interest: resolveInterest(),
            headcount: headcount ? Number(headcount) : undefined,
            budget_range: budgetRange || undefined,
            budget_currency: budgetRange ? budgetCurrency : undefined,
          };
      await joinWaitlist(payload);
      setState("done");
    } catch {
      setState("error");
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
            <div className="mb-5 grid size-16 place-items-center rounded-full bg-ganitel-accent-green">
              <CheckCircle2 className="size-8 text-ganitel-moss" aria-hidden />
            </div>
            <p className="font-display text-2xl font-bold text-ganitel-text-title">
              {t("join.success.title")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ganitel-text-subtitle">
              {t("join.success.detail")}
            </p>
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
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
                  aria-hidden
                />
                <input
                  id="join-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@gmail.com"
                  className={cn(INPUT_CLASS, "pl-10")}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="join-phone" className={LABEL_CLASS}>
                {t("join.phone")}
              </label>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
                  aria-hidden
                />
                <input
                  id="join-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className={cn(INPUT_CLASS, "pl-10")}
                />
              </div>
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
                  <div className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
                      aria-hidden
                    />
                    <input
                      id="join-host-city"
                      type="text"
                      maxLength={120}
                      value={hostCity}
                      onChange={(e) => setHostCity(e.target.value)}
                      placeholder={t("join.host.city.placeholder")}
                      className={cn(INPUT_CLASS, "pl-10")}
                    />
                  </div>
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
                    className={cn(INPUT_CLASS, "appearance-none cursor-pointer")}
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
                    className={cn(INPUT_CLASS, "appearance-none cursor-pointer")}
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
                    className={cn(INPUT_CLASS, "appearance-none cursor-pointer")}
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
            </div>

            {state === "error" && (
              <p className="text-xs text-red-500">{t("join.error")}</p>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full rounded-xl bg-ganitel-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-ganitel-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              {state === "submitting" ? t("join.submitting") : t("join.submit")}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
