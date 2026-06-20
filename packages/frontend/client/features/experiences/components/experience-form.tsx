import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import type {
  ExperienceCancellationPolicy,
  ExperienceCreateInput,
  ExperienceDetail,
  ExperiencePriceEntry,
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
  start_time: string;
  cancellation_policy: ExperienceCancellationPolicy;
  prices: ExperiencePriceEntry[];
  what_is_included: string;
  eligibility: string;
  itinerary: string;
  content_language: "fr" | "en";
}

const BLANK: FormState = {
  title: "",
  description: "",
  experience_type: "",
  location: null,
  capacity: "8",
  duration_minutes: "120",
  start_time: "",
  cancellation_policy: "moderate",
  prices: [{ amount: "", currency: "XAF", group_size: 1 }],
  what_is_included: "",
  eligibility: "",
  itinerary: "",
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
    start_time: d.start_time ?? "",
    cancellation_policy: d.cancellation_policy,
    prices: d.prices.map((p) => ({
      amount: p.amount,
      currency: p.currency,
      group_size: p.group_size,
    })),
    what_is_included: d.what_is_included ?? "",
    eligibility: d.eligibility ?? "",
    itinerary: d.itinerary ?? "",
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
      start_time: form.start_time || null,
      cancellation_policy: form.cancellation_policy,
      prices: form.prices.map((p) => ({
        amount: p.amount,
        currency: p.currency,
        group_size: p.group_size,
      })),
      what_is_included: form.what_is_included,
      eligibility: form.eligibility,
      itinerary: form.itinerary,
      content_language: form.content_language,
      media_ids:
        mediaState.mode === "draft"
          ? mediaState.items
              .filter((it) => it.mediaId != null)
              .map((it) => it.mediaId as string)
          : undefined,
    };
    onSubmit(payload);
  }

  const labelOf = (ref: { label_en: string; label_fr: string }) =>
    locale === "en" ? ref.label_en : ref.label_fr;

  const basePrices = form.prices.filter((p) => p.group_size === 1);
  const groupPrices = form.prices.filter((p) => p.group_size > 1);

  function updateBasePrice(idx: number, patch: Partial<ExperiencePriceEntry>) {
    const next = form.prices.map((p) =>
      p.group_size === 1 && basePrices.indexOf(p) === idx
        ? { ...p, ...patch }
        : p,
    );
    update("prices", next);
  }

  function updateGroupPrice(idx: number, patch: Partial<ExperiencePriceEntry>) {
    const next = form.prices.map((p) =>
      p.group_size > 1 && groupPrices.indexOf(p) === idx
        ? { ...p, ...patch }
        : p,
    );
    update("prices", next);
  }

  function addGroupPrice() {
    const usedSizes = new Set(groupPrices.map((p) => p.group_size));
    const nextSize = [2, 3, 4, 5, 6, 7, 8, 9, 10].find(
      (s) => !usedSizes.has(s),
    );
    if (!nextSize) return;
    const defaultCurrency = basePrices[0]?.currency ?? "XAF";
    update("prices", [
      ...form.prices,
      { amount: "", currency: defaultCurrency, group_size: nextSize },
    ]);
  }

  function removeGroupPrice(idx: number) {
    const target = groupPrices[idx];
    update(
      "prices",
      form.prices.filter((p) => p !== target),
    );
  }

  function removeBasePrice(idx: number) {
    const target = basePrices[idx];
    update(
      "prices",
      form.prices.filter((p) => p !== target),
    );
  }

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
        <Field label={tr("admin.form.start_time.label")}>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => update("start_time", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
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
        <p className="text-sm font-medium text-ganitel-text-subtitle">
          {tr("admin.form.price.base_label")}
        </p>
        <div className="space-y-2">
          {basePrices.map((p, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <Field label={tr("admin.form.price.amount")}>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  value={p.amount}
                  onChange={(e) =>
                    updateBasePrice(idx, { amount: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label={tr("admin.form.price.currency")}>
                <select
                  value={p.currency}
                  onChange={(e) =>
                    updateBasePrice(idx, { currency: e.target.value })
                  }
                  className={INPUT_CLASS}
                >
                  <option value="XAF">XAF</option>
                  <option value="XOF">XOF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </Field>
              {basePrices.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBasePrice(idx)}
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
                { amount: "", currency: "XAF", group_size: 1 },
              ]);
            }}
            className="cursor-pointer rounded-md border border-dashed px-4 py-2 text-sm"
          >
            {tr("admin.form.price.add")}
          </button>
        </div>

        {groupPrices.length > 0 && (
          <div className="mt-6 space-y-2">
            {groupPrices.map((p, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <Field label={tr("admin.form.price.group_size")}>
                  <select
                    value={p.group_size}
                    onChange={(e) =>
                      updateGroupPrice(idx, {
                        group_size: Number(e.target.value),
                      })
                    }
                    className={INPUT_CLASS}
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={tr("admin.form.price.amount")}>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={p.amount}
                    onChange={(e) =>
                      updateGroupPrice(idx, { amount: e.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label={tr("admin.form.price.currency")}>
                  <select
                    value={p.currency}
                    onChange={(e) =>
                      updateGroupPrice(idx, { currency: e.target.value })
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="XAF">XAF</option>
                    <option value="XOF">XOF</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </Field>
                <button
                  type="button"
                  onClick={() => removeGroupPrice(idx)}
                  className="cursor-pointer rounded border px-3 py-2 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {groupPrices.length < 9 && (
          <button
            type="button"
            onClick={addGroupPrice}
            className="mt-4 cursor-pointer rounded-md border border-dashed px-4 py-2 text-sm"
          >
            {tr("admin.form.price.add_group")}
          </button>
        )}
      </Section>

      <Section title={tr("admin.form.section.what_is_included")}>
        <Field label={tr("admin.form.what_is_included.label")}>
          <MarkdownEditor
            rows={6}
            maxLength={5000}
            value={form.what_is_included}
            onChange={(v) => update("what_is_included", v)}
          />
        </Field>
      </Section>

      <Section title={tr("admin.form.section.eligibility")}>
        <Field label={tr("admin.form.eligibility.label")}>
          <MarkdownEditor
            rows={4}
            maxLength={2000}
            value={form.eligibility}
            onChange={(v) => update("eligibility", v)}
          />
        </Field>
      </Section>

      <Section title={tr("admin.form.section.itinerary")}>
        <Field label={tr("admin.form.itinerary.label")}>
          <MarkdownEditor
            rows={10}
            maxLength={10000}
            value={form.itinerary}
            onChange={(v) => update("itinerary", v)}
          />
        </Field>
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
