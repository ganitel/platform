import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router";
import { ImagePlus, User } from "lucide-react";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { submitTeamMember } from "@/features/team/api";
import {
  TEAM_ERROR_CODE_KEYS,
  TEAM_FIELD_ERROR_KEYS,
} from "@/features/team/error-keys";
import { LocationAutocomplete } from "@/features/team/location-autocomplete";
import type { LocationPick } from "@/features/team/types";
import { useT } from "@/shared/lib/i18n";
import { FieldError } from "@/shared/components/field-error";
import { FormErrorAlert } from "@/shared/components/form-error-alert";
import { FormSubmitButton } from "@/shared/components/form-submit-button";
import { FormSuccessIcon } from "@/shared/components/form-success-icon";
import { IconInput } from "@/shared/components/icon-input";
import { cn } from "@/shared/lib/cn";
import { translateFormError } from "@/shared/lib/form-error";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";

type State = "idle" | "submitting" | "done" | "error";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

export function AddTeamForm() {
  const t = useT();
  // Render the form only on the client — sidesteps SSR/client tree drift on
  // this unlinked admin page where event handlers were failing to bind.
  // SEO-irrelevant (noindex meta), so SSR carries no value here.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearFieldError(...fields: string[]) {
    setFieldErrors((prev) => {
      if (fields.every((f) => !(f in prev))) return prev;
      const next = { ...prev };
      for (const f of fields) delete next[f];
      return next;
    });
  }
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState<LocationPick | null>(null);
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");

  // Ref-tracked so revocation is explicit and not tangled with React state.
  // The previous version used a useEffect with [imagePreview] dep, which made
  // the cleanup run on every change — including the change that produced the
  // URL we were about to render. Worked by happy accident; this is clearer.
  const previousObjectUrl = useRef<string | null>(null);
  function setPreview(next: string | null) {
    if (previousObjectUrl.current) {
      URL.revokeObjectURL(previousObjectUrl.current);
    }
    previousObjectUrl.current = next;
    setImagePreview(next);
  }
  // Final cleanup on unmount: free whatever URL is still parked in the ref.
  useEffect(() => {
    return () => {
      if (previousObjectUrl.current) {
        URL.revokeObjectURL(previousObjectUrl.current);
        previousObjectUrl.current = null;
      }
    };
  }, []);

  function onPickImage(file: File | null) {
    if (!file) {
      setImage(null);
      setPreview(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMessage(t("add_team.error.image_too_big"));
      setImage(null);
      setPreview(null);
      return;
    }
    if (!ACCEPTED_TYPES.split(",").includes(file.type)) {
      setErrorMessage(
        `${t("add_team.error.image_type")} (got: ${file.type || "unknown"})`,
      );
      setImage(null);
      setPreview(null);
      return;
    }
    setErrorMessage("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
    clearFieldError("image");
  }

  const ageNumber = Number(age);
  const submitDisabled =
    state === "submitting" ||
    !image ||
    !name.trim() ||
    !location ||
    !bio.trim() ||
    bio.length < 10 ||
    !Number.isFinite(ageNumber) ||
    ageNumber < 16 ||
    ageNumber > 100;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!image || !location) return;
    setState("submitting");
    setErrorMessage("");
    setErrorDetail("");
    setFieldErrors({});
    try {
      await submitTeamMember({
        image,
        name: name.trim(),
        bio_fr: bio.trim(),
        city: location.city,
        country: location.country,
        age: ageNumber,
      });
      setState("done");
    } catch (error) {
      setState("error");
      const translated = translateFormError(error, t, {
        fieldKeys: TEAM_FIELD_ERROR_KEYS,
        codeKeys: TEAM_ERROR_CODE_KEYS,
        generic: "add_team.error.generic",
        network: "add_team.error.network",
        timeout: "add_team.error.timeout",
      });
      setFieldErrors(translated.fieldErrors);
      setErrorMessage(translated.message);
      setErrorDetail(translated.detail);
    }
  }

  if (!mounted) {
    return (
      <AuthLayout title={t("add_team.title")} subtitle={t("add_team.subtitle")}>
        <div className="h-96" aria-hidden />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("add_team.title")} subtitle={t("add_team.subtitle")}>
      {state === "done" ? (
        <div className="flex flex-col items-center py-8 text-center">
          <FormSuccessIcon />
          <p className="font-display text-2xl font-bold text-ganitel-text-title">
            {t("add_team.success.title")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ganitel-text-subtitle">
            {t("add_team.success.detail")}
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center rounded-full bg-ganitel-text-title px-6 py-3 text-sm font-semibold text-ganitel-paper transition-all hover:bg-ganitel-moss"
          >
            {t("add_team.success.back")}
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="add-team-image" className={LABEL_CLASS}>
                {t("add_team.image.label")}
              </label>
              <label
                htmlFor="add-team-image"
                className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-4 text-sm text-ganitel-text-subtitle hover:border-ganitel-secondary"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt=""
                    className="size-14 rounded-full object-cover"
                  />
                ) : (
                  <ImagePlus
                    className="size-6 text-ganitel-text-placeholder"
                    aria-hidden
                  />
                )}
                <span className="truncate">
                  {image ? image.name : t("add_team.image.placeholder")}
                </span>
              </label>
              <input
                id="add-team-image"
                type="file"
                accept={ACCEPTED_TYPES}
                className="sr-only"
                onChange={(event) =>
                  onPickImage(event.target.files?.[0] ?? null)
                }
              />
              <p className="mt-1.5 text-xs text-ganitel-text-placeholder">
                {t("add_team.image.hint")}
              </p>
              <FieldError message={fieldErrors.image} />
            </div>

            <div>
              <label htmlFor="add-team-name" className={LABEL_CLASS}>
                {t("add_team.name.label")}
              </label>
              <IconInput
                id="add-team-name"
                icon={User}
                type="text"
                required
                maxLength={120}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clearFieldError("name");
                }}
                placeholder={t("add_team.name.placeholder")}
              />
              <FieldError message={fieldErrors.name} />
            </div>

            <LocationAutocomplete
              inputId="add-team-location"
              label={t("add_team.location.label")}
              placeholder={t("add_team.location.placeholder")}
              initialCity=""
              initialCountry=""
              onChange={(pick) => {
                setLocation(pick);
                clearFieldError("city", "country");
              }}
            />
            <FieldError
              message={fieldErrors.city || fieldErrors.country}
              className="-mt-3"
            />

            <div>
              <label htmlFor="add-team-age" className={LABEL_CLASS}>
                {t("add_team.age.label")}
              </label>
              <input
                id="add-team-age"
                type="number"
                inputMode="numeric"
                required
                min={16}
                max={100}
                value={age}
                onChange={(event) => {
                  setAge(event.target.value);
                  clearFieldError("age");
                }}
                placeholder={t("add_team.age.placeholder")}
                className={INPUT_CLASS}
              />
              <FieldError message={fieldErrors.age} />
            </div>

            <div>
              <label htmlFor="add-team-bio" className={LABEL_CLASS}>
                {t("add_team.bio.label")}
              </label>
              <textarea
                id="add-team-bio"
                rows={5}
                required
                maxLength={2000}
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                  clearFieldError("bio_fr");
                }}
                placeholder={t("add_team.bio.placeholder")}
                className={cn(INPUT_CLASS, "resize-none")}
              />
              <p className="mt-1.5 text-xs text-ganitel-text-placeholder">
                {t("add_team.bio.hint")}
              </p>
              <FieldError message={fieldErrors.bio_fr} />
            </div>

            <FormErrorAlert message={errorMessage} detail={errorDetail} />

            <FormSubmitButton
              disabled={submitDisabled}
              isSubmitting={state === "submitting"}
              submittingLabel={t("add_team.submitting")}
            >
              {t("add_team.submit")}
            </FormSubmitButton>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
