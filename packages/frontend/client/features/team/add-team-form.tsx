import { useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ImagePlus, MapPin, User } from "lucide-react";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { submitTeamMember } from "@/features/team/api";
import { useT } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/cn";

const INPUT_CLASS =
  "w-full rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-3 text-sm text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:border-ganitel-secondary focus:outline-none focus:ring-2 focus:ring-ganitel-secondary/20 transition-all";
const LABEL_CLASS = "block text-sm font-medium text-ganitel-text-title mb-1.5";

type State = "idle" | "submitting" | "done" | "error";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

export function AddTeamForm() {
  const t = useT();
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");

  function onPickImage(file: File | null) {
    if (!file) {
      setImage(null);
      setImagePreview(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMessage(t("add_team.error.image_too_big"));
      return;
    }
    if (!ACCEPTED_TYPES.split(",").includes(file.type)) {
      setErrorMessage(t("add_team.error.image_type"));
      return;
    }
    setErrorMessage("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  const ageNumber = Number(age);
  const submitDisabled =
    state === "submitting" ||
    !image ||
    !name.trim() ||
    !city.trim() ||
    !country.trim() ||
    !bio.trim() ||
    bio.length < 10 ||
    !Number.isFinite(ageNumber) ||
    ageNumber < 16 ||
    ageNumber > 100;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!image) return;
    setState("submitting");
    setErrorMessage("");
    try {
      await submitTeamMember({
        image,
        name: name.trim(),
        bio_fr: bio.trim(),
        city: city.trim(),
        country: country.trim(),
        age: ageNumber,
      });
      setState("done");
    } catch {
      setState("error");
      setErrorMessage(t("add_team.error.generic"));
    }
  }

  return (
    <AuthLayout title={t("add_team.title")} subtitle={t("add_team.subtitle")}>
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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="add-team-city" className={LABEL_CLASS}>
                  {t("add_team.city.label")}
                </label>
                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
                    aria-hidden
                  />
                  <input
                    id="add-team-city"
                    type="text"
                    required
                    maxLength={120}
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder={t("add_team.city.placeholder")}
                    className={cn(INPUT_CLASS, "pl-10")}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="add-team-country" className={LABEL_CLASS}>
                  {t("add_team.country.label")}
                </label>
                <input
                  id="add-team-country"
                  type="text"
                  required
                  maxLength={120}
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  placeholder={t("add_team.country.placeholder")}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

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
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
