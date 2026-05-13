import { useRef, useState } from "react";
import { Link } from "react-router";
import { Trash2 } from "lucide-react";

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
import { ApiError, extractErrorCode } from "@/shared/api/client";
import { TEAM_FIELD_ERROR_KEYS } from "@/features/team/error-keys";
import {
  TITLE_KEYS,
  TITLE_LABELS,
  type LocationPick,
  type TitleKey,
} from "@/features/team/types";
import { useT } from "@/shared/lib/i18n";
import { FieldError } from "@/shared/components/field-error";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { FormSuccessIcon } from "@/shared/components/form-success-icon";
import { cn } from "@/shared/lib/cn";
import { translateFormError } from "@/shared/lib/form-error";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";
import type { TeamMember } from "@/features/about/types";

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

  function clearFieldError(...fields: string[]) {
    setFieldErrors((prev) => {
      if (fields.every((f) => !(f in prev))) return prev;
      const next = { ...prev };
      for (const f of fields) delete next[f];
      return next;
    });
  }
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

  async function handleApprove() {
    setState("submitting");
    setErrorMessage("");
    setFieldErrors({});
    try {
      await approveTeamMember(member.id, token, diff());
      setState("approved");
    } catch (error) {
      setState("error");
      const translated = translateFormError(error, t, {
        fieldKeys: TEAM_FIELD_ERROR_KEYS,
        generic: "review.error.generic",
      });
      setFieldErrors(translated.fieldErrors);
      if (Object.keys(translated.fieldErrors).length === 0) {
        setErrorMessage(translated.message);
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
          {isApproved ? (
            <FormSuccessIcon />
          ) : (
            <div className="mb-5 grid size-16 place-items-center rounded-full bg-red-100">
              <Trash2 className="size-8 text-red-600" aria-hidden />
            </div>
          )}
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
            onChange={(event) => {
              setName(event.target.value);
              clearFieldError("name");
            }}
            className={INPUT_CLASS}
          />
          <FieldError message={fieldErrors.name} />
        </div>

        <LocationAutocomplete
          inputId="rv-location"
          label={t("add_team.location.label")}
          placeholder={t("add_team.location.placeholder")}
          initialCity={location.city}
          initialCountry={location.country}
          onChange={(pick) => {
            setLocation(pick ?? { city: "", country: "" });
            clearFieldError("city", "country");
          }}
        />
        <FieldError
          message={fieldErrors.city || fieldErrors.country}
          className="-mt-3"
        />

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
              onChange={(event) => {
                setAge(event.target.value);
                clearFieldError("age");
              }}
              className={INPUT_CLASS}
            />
            <FieldError message={fieldErrors.age} />
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
            onChange={(event) => {
              setBio(event.target.value);
              clearFieldError("bio_fr");
            }}
            className={cn(INPUT_CLASS, "resize-none")}
          />
          <FieldError message={fieldErrors.bio_fr} />
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
          <FormSubmitButton
            disabled={state === "submitting"}
            isSubmitting={state === "submitting"}
            submittingLabel={t("review.submitting")}
            className="w-auto flex-1"
          >
            {t("review.approve")}
          </FormSubmitButton>
        </div>
      </form>
    </AuthLayout>
  );
}
