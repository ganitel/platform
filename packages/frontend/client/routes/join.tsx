import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Mail } from "lucide-react";
import type { Route } from "./+types/join";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { joinWaitlist } from "@/features/waitlist/api";
import { useT } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/cn";

export const meta: Route.MetaFunction = () => [
  { title: "Rejoindre Ganitel" },
  { name: "robots", content: "noindex" },
];

type Interest = "renting" | "experiences";
type BudgetRange = "under_50k" | "50k_150k" | "150k_300k" | "300k_500k" | "over_500k";
type State = "idle" | "submitting" | "done" | "error";

const BUDGET_RANGES: BudgetRange[] = [
  "under_50k",
  "50k_150k",
  "150k_300k",
  "300k_500k",
  "over_500k",
];

const INPUT_CLASS =
  "w-full rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-3 text-sm text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/20 transition-all";

const LABEL_CLASS = "block text-sm font-medium text-ganitel-text-title mb-1.5";

export default function JoinPage() {
  const t = useT();
  const [state, setState] = useState<State>("idle");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<Set<Interest>>(new Set());
  const [headcount, setHeadcount] = useState("");
  const [budgetRange, setBudgetRange] = useState<BudgetRange | "">("");
  const [notes, setNotes] = useState("");

  function toggleInterest(val: Interest) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  }

  function resolveInterest(): "renting" | "experiences" | "both" | undefined {
    const hasRenting = interests.has("renting");
    const hasExperiences = interests.has("experiences");
    if (hasRenting && hasExperiences) return "both";
    if (hasRenting) return "renting";
    if (hasExperiences) return "experiences";
    return undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    try {
      await joinWaitlist({
        email,
        interest: resolveInterest(),
        headcount: headcount ? Number(headcount) : undefined,
        budget_range: budgetRange || undefined,
        notes: notes || undefined,
      });
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
                  placeholder="vous@exemple.com"
                  className={cn(INPUT_CLASS, "pl-10")}
                />
              </div>
            </div>

            {/* Interest toggle */}
            <div>
              <p className={LABEL_CLASS}>{t("join.interest.label")}</p>
              <div className="flex gap-3">
                {(["renting", "experiences"] as Interest[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggleInterest(val)}
                    className={cn(
                      "flex-1 rounded-xl border py-3 text-sm font-medium transition-all",
                      interests.has(val)
                        ? "border-ganitel-secondary bg-ganitel-secondary/10 text-ganitel-secondary"
                        : "border-ganitel-stroke-neutral bg-ganitel-neutral-1 text-ganitel-text-subtitle hover:border-ganitel-text-title hover:text-ganitel-text-title",
                    )}
                  >
                    {t(val === "renting" ? "join.interest.renting" : "join.interest.experiences")}
                  </button>
                ))}
              </div>
            </div>

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
              <select
                id="join-budget"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value as BudgetRange | "")}
                className={cn(INPUT_CLASS, "appearance-none cursor-pointer")}
              >
                <option value="">{t("join.budget.placeholder")}</option>
                {BUDGET_RANGES.map((r) => (
                  <option key={r} value={r}>
                    {t(`join.budget.${r}` as Parameters<typeof t>[0])}
                  </option>
                ))}
              </select>
            </div>

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
              disabled={state === "submitting" || !email}
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
