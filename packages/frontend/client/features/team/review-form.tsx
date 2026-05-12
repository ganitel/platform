import { useRef, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { approveTeamMember, rejectTeamMember } from "@/features/team/api";
import { LocationAutocomplete } from "@/features/team/location-autocomplete";
import {
  ApiError,
  extractErrorCode,
  extractFieldErrors,
} from "@/shared/api/client";
import {
  TITLE_KEYS,
  TITLE_LABELS,
  type LocationPick,
  type TitleKey,
} from "@/features/team/types";
import { useT } from "@/shared/lib/i18n";
import type { TranslationKey } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/cn";
import type { TeamMember } from "@/features/about/types";

const INPUT_CLASS =
  "w-full rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-3 text-sm text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/20 transition-all";
const LABEL_CLASS = "block text-sm font-medium text-ganitel-text-title mb-1.5";

type State = "idle" | "submitting" | "approved" | "rejected" | "error";

function inferTitleKey(member: TeamMember): TitleKey {
  for (const key of TITLE_KEYS) {
    const labels = TITLE_LABELS[key];
    if (labels.fr === member.title_fr && labels.en === member.title_en) {
      return key;
    }
  }
  return "guide_touristique";
}

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(member.name);
  const [location, setLocation] = useState<LocationPick>({
    city: member.city ?? "",
    country: member.country ?? "",
  });
  const [age, setAge] = useState(member.age?.toString() ?? "");
  const [bio, setBio] = useState(member.bio_fr ?? "");
  const initialTitleKey = inferTitleKey(member);
  const [titleKey, setTitleKey] = useState<TitleKey>(initialTitleKey);

  function diff(): Record<string, string | number> {
    const patch: Record<string, string | number> = {};
    if (name !== member.name) patch.name = name.trim();
    if (location.city !== (member.city ?? "")) patch.city = location.city;
    if (location.country !== (member.country ?? ""))
      patch.country = location.country;
    if (titleKey !== initialTitleKey) patch.title_key = titleKey;
    if (bio !== (member.bio_fr ?? "")) patch.bio_fr = bio.trim();
    const ageNumber = Number(age);
    if (Number.isFinite(ageNumber) && ageNumber !== member.age) {
      patch.age = ageNumber;
    }
    return patch;
  }

  const FIELD_ERROR_KEYS: Record<string, TranslationKey> = {
    "name.missing": "add_team.error.name_required",
    "name.string_too_short": "add_team.error.name_required",
    "name.string_too_long": "add_team.error.name_too_long",
    "bio_fr.missing": "add_team.error.bio_required",
    "bio_fr.string_too_short": "add_team.error.bio_required",
    "bio_fr.string_too_long": "add_team.error.bio_too_long",
    "city.missing": "add_team.error.city_required",
    "city.string_too_short": "add_team.error.city_required",
    "country.missing": "add_team.error.country_required",
    "country.string_too_short": "add_team.error.country_required",
    "age.missing": "add_team.error.age_invalid",
    "age.greater_than_equal": "add_team.error.age_invalid",
    "age.less_than_equal": "add_team.error.age_invalid",
  };

  async function handleApprove() {
    setState("submitting");
    setErrorMessage("");
    setFieldErrors({});
    try {
      await approveTeamMember(member.id, token, diff());
      setState("approved");
    } catch (error) {
      setState("error");
      const fieldErrs = extractFieldErrors(error);
      if (fieldErrs) {
        const translated: Record<string, string> = {};
        for (const { field, type, msg } of fieldErrs) {
          const key =
            FIELD_ERROR_KEYS[`${field}.${type}`] ??
            FIELD_ERROR_KEYS[`${field}.missing`];
          translated[field] = key ? t(key) : msg;
        }
        setFieldErrors(translated);
      } else if (error instanceof ApiError && error.status === 422) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(t("review.error.generic"));
      }
    }
  }

  // Tracks "user clicked Reject inside the dialog and we're now waiting for
  // the close animation to finish before kicking off the API call". Without
  // this, calling setState("rejected") in handleReject races Radix's portal
  // cleanup and produces the React 19 "removeChild on <link>" error.
  const [rejectOpen, setRejectOpen] = useState(false);
  const pendingReject = useRef(false);

  async function handleReject() {
    setState("submitting");
    setErrorMessage("");
    try {
      await rejectTeamMember(member.id, token);
      setState("rejected");
    } catch (error) {
      setState("error");
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        extractErrorCode(error) === "team_member.already_active"
      ) {
        setErrorMessage(t("review.error.already_active"));
      } else {
        setErrorMessage(t("review.error.generic"));
      }
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
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
          )}
        </div>

        <LocationAutocomplete
          inputId="rv-location"
          label={t("add_team.location.label")}
          placeholder={t("add_team.location.placeholder")}
          initialCity={location.city}
          initialCountry={location.country}
          onChange={(pick) => setLocation(pick ?? { city: "", country: "" })}
        />
        {(fieldErrors.city || fieldErrors.country) && (
          <p className="-mt-3 text-xs text-red-500">
            {fieldErrors.city || fieldErrors.country}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            {fieldErrors.age && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.age}</p>
            )}
          </div>
          <div>
            <label htmlFor="rv-title-key" className={LABEL_CLASS}>
              {t("review.title.label")}
            </label>
            <select
              id="rv-title-key"
              value={titleKey}
              onChange={(event) => setTitleKey(event.target.value as TitleKey)}
              className={cn(INPUT_CLASS, "appearance-none cursor-pointer")}
            >
              {TITLE_KEYS.map((key) => {
                const labels = TITLE_LABELS[key];
                return (
                  <option key={key} value={key}>
                    {labels.fr} / {labels.en}
                  </option>
                );
              })}
            </select>
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
          {fieldErrors.bio_fr && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.bio_fr}</p>
          )}
        </div>

        {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}

        <div className="flex gap-3 pt-2">
          <AlertDialog
            open={rejectOpen}
            onOpenChange={(open) => {
              setRejectOpen(open);
              // onOpenChange fires AFTER Radix's close animation. By the time
              // it ticks to `false`, the portal has cleanly unmounted — safe
              // to swap the parent tree (state → "rejected") without React 19
              // racing Radix's <link> / portal cleanup.
              if (!open && pendingReject.current) {
                pendingReject.current = false;
                void handleReject();
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={state === "submitting"}
                className="flex-1 rounded-xl border border-red-500 py-3.5 text-sm font-semibold text-red-500 transition-all hover:bg-red-50 disabled:opacity-60"
              >
                {t("review.reject")}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("review.reject.confirm.title")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("review.reject.confirm.detail")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("review.reject.confirm.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    // Mark the intent; the actual reject fires from
                    // onOpenChange once Radix has fully closed.
                    pendingReject.current = true;
                  }}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  {t("review.reject.confirm.action")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
