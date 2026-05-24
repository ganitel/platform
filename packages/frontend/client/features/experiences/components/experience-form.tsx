import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import type {
  ExperienceCancellationPolicy,
  ExperienceCreateInput,
  ExperienceDetail,
} from "@/features/experiences/types";
import {
  listCancellationPolicies,
  listExperienceTypes,
} from "@/features/reference/api";
import { LocationPicker } from "@/shared/components/location-picker";
import { MarkdownEditor } from "@/shared/components/markdown-editor";
import { MediaUploader } from "@/shared/components/media-uploader";
import type {
  UploaderItem,
  UploaderOnChange,
} from "@/shared/components/media-uploader.types";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";
import { useLocale, useT } from "@/shared/lib/i18n";
import type { LocationPick } from "@/shared/lib/location";

interface FormState {
  title: string;
  description: string;
  experience_type: string;
  location: LocationPick | null;
  capacity: string;
  duration_minutes: string;
  cancellation_policy: ExperienceCancellationPolicy;
  prices: { amount: string; currency: string }[];
  content_language: "fr" | "en";
}

const BLANK: FormState = {
  title: "",
  description: "",
  experience_type: "",
  location: null,
  capacity: "8",
  duration_minutes: "120",
  cancellation_policy: "moderate",
  prices: [{ amount: "", currency: "XAF" }],
  content_language: "fr",
};

function fromDetail(d: ExperienceDetail): FormState {
  return {
    title: d.title,
    description: d.description ?? "",
    experience_type: d.experience_type,
    location: {
      address: d.address ?? `${d.city}, ${d.country_code}`,
      city: d.city,
      country: d.country_code,
      country_code: d.country_code,
      lat: d.location.lat,
      lng: d.location.lng,
    },
    capacity: String(d.capacity),
    duration_minutes: String(d.duration_minutes),
    cancellation_policy: d.cancellation_policy,
    prices: d.prices.map((p) => ({ amount: p.amount, currency: p.currency })),
    content_language: (d.content_language as "fr" | "en") ?? "fr",
  };
}

interface ExperienceFormMediaState {
  mode: "draft" | "listing";
  draftId?: string;
  listingId?: string;
  items: UploaderItem[];
  setItems: UploaderOnChange;
}

interface ExperienceFormProps {
  initial: ExperienceDetail | null;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (payload: ExperienceCreateInput) => void;
  mediaState: ExperienceFormMediaState;
}

export function ExperienceForm({
  initial,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  onSubmit,
  mediaState,
}: ExperienceFormProps) {
  const tr = useT();
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromDetail(initial) : BLANK,
  );

  const experienceTypes = useQuery({
    queryKey: ["reference", "experience-types"],
    queryFn: listExperienceTypes,
  });
  const policies = useQuery({
    queryKey: ["reference", "cancellation-policies"],
    queryFn: listCancellationPolicies,
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.location) return;
    const payload: ExperienceCreateInput = {
      title: form.title,
      description: form.description,
      experience_type: form.experience_type,
      address: form.location.address,
      city: form.location.city,
      country_code: form.location.country_code,
      location: { lat: form.location.lat, lng: form.location.lng },
      capacity: Number(form.capacity),
      duration_minutes: Number(form.duration_minutes),
      cancellation_policy: form.cancellation_policy,
      prices: form.prices.map((p) => ({
        amount: p.amount,
        currency: p.currency,
      })),
      content_language: form.content_language,
      media_ids:
        mediaState.mode === "draft"
          ? mediaState.items
              .filter((it) => it.mediaId !== null)
              .map((it) => it.mediaId as string)
          : undefined,
    };
    onSubmit(payload);
  }

  const labelOf = (ref: { label_en: string; label_fr: string }) =>
    locale === "en" ? ref.label_en : ref.label_fr;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title={tr("admin.form.section.info")}>
        <Field label={tr("admin.form.title.label")}>
          <input
            required
            minLength={3}
            maxLength={180}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label={tr("admin.form.description.label")}>
          <MarkdownEditor
            rows={8}
            maxLength={10000}
            value={form.description}
            onChange={(v) => update("description", v)}
          />
        </Field>
        <Field label={tr("admin.form.type.label")}>
          <select
            required
            value={form.experience_type}
            onChange={(e) => update("experience_type", e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">{tr("admin.form.select.placeholder")}</option>
            {experienceTypes.data?.map((p) => (
              <option key={p.code} value={p.code}>
                {labelOf(p)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr("admin.form.content_language.label")}>
          <select
            value={form.content_language}
            onChange={(e) =>
              update("content_language", e.target.value as "fr" | "en")
            }
            className={INPUT_CLASS}
          >
            <option value="fr">{tr("admin.form.lang.fr")}</option>
            <option value="en">{tr("admin.form.lang.en")}</option>
          </select>
        </Field>
      </Section>

      <Section title={tr("admin.form.section.location")}>
        <LocationPicker
          initial={form.location}
          onChange={(pick) => update("location", pick)}
        />
      </Section>

      <Section title={tr("admin.form.section.format")}>
        <div className="grid grid-cols-2 gap-4">
          <Field label={tr("admin.form.participants.label")}>
            <input
              required
              type="number"
              min={1}
              max={64}
              value={form.capacity}
              onChange={(e) => update("capacity", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label={tr("admin.form.duration.label")}>
            <input
              required
              type="number"
              min={15}
              max={1440}
              value={form.duration_minutes}
              onChange={(e) => update("duration_minutes", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        <Field label={tr("admin.form.cancellation.label")}>
          <select
            value={form.cancellation_policy}
            onChange={(e) =>
              update(
                "cancellation_policy",
                e.target.value as ExperienceCancellationPolicy,
              )
            }
            className={INPUT_CLASS}
          >
            {policies.data?.map((p) => (
              <option key={p.code} value={p.code}>
                {labelOf(p)}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title={tr("admin.form.section.price")}>
        <div className="space-y-2">
          {form.prices.map((p, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <Field label={tr("admin.form.price.amount")}>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  value={p.amount}
                  onChange={(e) => {
                    const next = [...form.prices];
                    next[idx] = { ...next[idx], amount: e.target.value };
                    update("prices", next);
                  }}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label={tr("admin.form.price.currency")}>
                <select
                  value={p.currency}
                  onChange={(e) => {
                    const next = [...form.prices];
                    next[idx] = { ...next[idx], currency: e.target.value };
                    update("prices", next);
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="XAF">XAF</option>
                  <option value="XOF">XOF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </Field>
              {form.prices.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    update(
                      "prices",
                      form.prices.filter((_, i) => i !== idx),
                    );
                  }}
                  className="cursor-pointer rounded border px-3 py-2 text-sm"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              update("prices", [
                ...form.prices,
                { amount: "", currency: "XAF" },
              ]);
            }}
            className="cursor-pointer rounded-md border border-dashed px-4 py-2 text-sm"
          >
            {tr("admin.form.price.add")}
          </button>
        </div>
      </Section>

      {error != null && (
        <p className="text-sm text-red-600">
          {tr("common.error_prefix")}
          {": "}
          {error instanceof Error ? error.message : String(error)}
        </p>
      )}

      <Section title={tr("admin.form.section.media")}>
        <MediaUploader
          {...(mediaState.mode === "draft"
            ? {
                mode: "draft",
                draftId: mediaState.draftId as string,
                value: mediaState.items,
                onChange: mediaState.setItems,
              }
            : {
                mode: "listing",
                listingKind: "experience",
                listingId: mediaState.listingId as string,
                value: mediaState.items,
                onChange: mediaState.setItems,
              })}
        />
      </Section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isPending || !form.location}
          className="rounded-xl bg-ganitel-secondary px-6 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ganitel-stroke-neutral bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-ganitel-text-title">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={LABEL_CLASS}>{label}</span>
      {children}
    </label>
  );
}
