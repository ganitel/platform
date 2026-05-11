import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Trash2 } from "lucide-react";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { approveTeamMember, rejectTeamMember } from "@/features/team/api";
import { useT } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/cn";
import type { TeamMember } from "@/features/about/types";

const INPUT_CLASS =
  "w-full rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-3 text-sm text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/20 transition-all";
const LABEL_CLASS = "block text-sm font-medium text-ganitel-text-title mb-1.5";

type State = "idle" | "submitting" | "approved" | "rejected" | "error";

export function ReviewForm({
  member,
  token,
}: {
  member: TeamMember;
  token: string;
}) {
  const t = useT();
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState(member.name);
  const [city, setCity] = useState(member.city ?? "");
  const [country, setCountry] = useState(member.country ?? "");
  const [age, setAge] = useState(member.age?.toString() ?? "");
  const [bio, setBio] = useState(member.bio_fr ?? "");
  const [titleFr, setTitleFr] = useState(member.title_fr);
  const [titleEn, setTitleEn] = useState(member.title_en);

  function diff(): Record<string, string | number> {
    const patch: Record<string, string | number> = {};
    if (name !== member.name) patch.name = name.trim();
    if (city !== (member.city ?? "")) patch.city = city.trim();
    if (country !== (member.country ?? "")) patch.country = country.trim();
    if (titleFr !== member.title_fr) patch.title_fr = titleFr.trim();
    if (titleEn !== member.title_en) patch.title_en = titleEn.trim();
    if (bio !== (member.bio_fr ?? "")) patch.bio_fr = bio.trim();
    const ageNumber = Number(age);
    if (Number.isFinite(ageNumber) && ageNumber !== member.age) {
      patch.age = ageNumber;
    }
    return patch;
  }

  async function handleApprove() {
    setState("submitting");
    setErrorMessage("");
    try {
      await approveTeamMember(member.id, token, diff());
      setState("approved");
    } catch {
      setState("error");
      setErrorMessage(t("review.error.generic"));
    }
  }

  async function handleReject() {
    if (!window.confirm(t("review.reject.confirm"))) return;
    setState("submitting");
    setErrorMessage("");
    try {
      await rejectTeamMember(member.id, token);
      setState("rejected");
    } catch {
      setState("error");
      setErrorMessage(t("review.error.generic"));
    }
  }

  if (state === "approved" || state === "rejected") {
    const isApproved = state === "approved";
    return (
      <AuthLayout title={t("review.title")} subtitle={t("review.subtitle")}>
        <div className="flex flex-col items-center py-8 text-center">
          <div
            className={cn(
              "mb-5 grid size-16 place-items-center rounded-full",
              isApproved ? "bg-ganitel-accent-green" : "bg-red-100",
            )}
          >
            {isApproved ? (
              <CheckCircle2 className="size-8 text-ganitel-moss" aria-hidden />
            ) : (
              <Trash2 className="size-8 text-red-600" aria-hidden />
            )}
          </div>
          <p className="font-display text-2xl font-bold text-ganitel-text-title">
            {isApproved
              ? t("review.approved.title")
              : t("review.rejected.title")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ganitel-text-subtitle">
            {isApproved
              ? t("review.approved.detail")
              : t("review.rejected.detail")}
          </p>
          <Link
            to="/about"
            className="mt-8 inline-flex items-center rounded-full bg-ganitel-text-title px-6 py-3 text-sm font-semibold text-ganitel-paper transition-all hover:bg-ganitel-moss"
          >
            {t("review.back")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("review.title")} subtitle={t("review.subtitle")}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleApprove();
        }}
      >
        {member.avatar_url && (
          <img
            src={member.avatar_url}
            alt=""
            className="size-24 rounded-full object-cover mx-auto"
          />
        )}

        <div>
          <label htmlFor="rv-name" className={LABEL_CLASS}>
            {t("add_team.name.label")}
          </label>
          <input
            id="rv-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rv-city" className={LABEL_CLASS}>
              {t("add_team.city.label")}
            </label>
            <input
              id="rv-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="rv-country" className={LABEL_CLASS}>
              {t("add_team.country.label")}
            </label>
            <input
              id="rv-country"
              type="text"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="rv-age" className={LABEL_CLASS}>
              {t("add_team.age.label")}
            </label>
            <input
              id="rv-age"
              type="number"
              min={16}
              max={100}
              value={age}
              onChange={(event) => setAge(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="rv-title-fr" className={LABEL_CLASS}>
              {t("review.title_fr.label")}
            </label>
            <input
              id="rv-title-fr"
              type="text"
              value={titleFr}
              onChange={(event) => setTitleFr(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="rv-title-en" className={LABEL_CLASS}>
              {t("review.title_en.label")}
            </label>
            <input
              id="rv-title-en"
              type="text"
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label htmlFor="rv-bio" className={LABEL_CLASS}>
            {t("add_team.bio.label")}
          </label>
          <textarea
            id="rv-bio"
            rows={6}
            maxLength={2000}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className={cn(INPUT_CLASS, "resize-none")}
          />
        </div>

        {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleReject}
            disabled={state === "submitting"}
            className="flex-1 rounded-xl border border-red-500 py-3.5 text-sm font-semibold text-red-500 transition-all hover:bg-red-50 disabled:opacity-60"
          >
            {t("review.reject")}
          </button>
          <button
            type="submit"
            disabled={state === "submitting"}
            className="flex-1 rounded-xl bg-ganitel-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-ganitel-primary/90 active:scale-[0.98] disabled:opacity-60"
          >
            {state === "submitting"
              ? t("review.submitting")
              : t("review.approve")}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
