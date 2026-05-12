import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router";
import { CheckCircle2, ImagePlus, User } from "lucide-react";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { submitTeamMember } from "@/features/team/api";
import { LocationAutocomplete } from "@/features/team/location-autocomplete";
import type { LocationPick } from "@/features/team/types";
import { useT } from "@/shared/lib/i18n";
import type { TranslationKey } from "@/shared/lib/i18n";
import {
  ApiError,
  extractErrorCode,
  extractFieldErrors,
} from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";

const INPUT_CLASS =
  "w-full rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-3 text-sm text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/20 transition-all";
const LABEL_CLASS = "block text-sm font-medium text-ganitel-text-title mb-1.5";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

  const ERROR_CODE_KEYS: Record<string, TranslationKey> = {
    "image.too_large": "add_team.error.image_too_big",
    "image.type_unsupported": "add_team.error.image_type",
    "image.empty": "add_team.error.image_empty",
  };

  const FIELD_ERROR_KEYS: Record<string, TranslationKey> = {
    name: "add_team.error.name_required",
    bio_fr: "add_team.error.bio_required",
    city: "add_team.error.city_required",
    country: "add_team.error.country_required",
    age: "add_team.error.age_invalid",
    image: "add_team.error.image_required",
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!image || !location) return;
    setState("submitting");
    setErrorMessage("");
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
      const fields = extractFieldErrors(error);
      if (fields) {
        const translated: Record<string, string> = {};
        for (const [field, _msg] of Object.entries(fields)) {
          const key = FIELD_ERROR_KEYS[field];
          translated[field] = key ? t(key) : _msg;
        }
        setFieldErrors(translated);
      } else if (error instanceof ApiError && error.status === 422) {
        const code = extractErrorCode(error);
        const key = code ? ERROR_CODE_KEYS[code] : undefined;
        setErrorMessage(key ? t(key) : error.message);
      } else {
        setErrorMessage(t("add_team.error.generic"));
      }
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
          <div className="mb-5 grid size-16 place-items-center rounded-full bg-ganitel-accent-green">
            <CheckCircle2 className="size-8 text-ganitel-moss" aria-hidden />
          </div>
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
              {fieldErrors.image && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.image}</p>
              )}
            </div>

            <div>
              <label htmlFor="add-team-name" className={LABEL_CLASS}>
                {t("add_team.name.label")}
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
                  aria-hidden
                />
                <input
                  id="add-team-name"
                  type="text"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("add_team.name.placeholder")}
                  className={cn(INPUT_CLASS, "pl-10")}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
              )}
            </div>

            <LocationAutocomplete
              inputId="add-team-location"
              label={t("add_team.location.label")}
              placeholder={t("add_team.location.placeholder")}
              initialCity=""
              initialCountry=""
              onChange={setLocation}
            />
            {(fieldErrors.city || fieldErrors.country) && (
              <p className="-mt-3 text-xs text-red-500">
                {fieldErrors.city || fieldErrors.country}
              </p>
            )}

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
                onChange={(event) => setAge(event.target.value)}
                placeholder={t("add_team.age.placeholder")}
                className={INPUT_CLASS}
              />
              {fieldErrors.age && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.age}</p>
              )}
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
                onChange={(event) => setBio(event.target.value)}
                placeholder={t("add_team.bio.placeholder")}
                className={cn(INPUT_CLASS, "resize-none")}
              />
              <p className="mt-1.5 text-xs text-ganitel-text-placeholder">
                {t("add_team.bio.hint")}
              </p>
              {fieldErrors.bio_fr && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.bio_fr}
                </p>
              )}
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full rounded-xl bg-ganitel-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-ganitel-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              {state === "submitting"
                ? t("add_team.submitting")
                : t("add_team.submit")}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
