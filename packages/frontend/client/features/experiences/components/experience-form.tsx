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
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";

interface FormState {
  title: string;
  description: string;
  experience_type: string;
  city: string;
  country_code: string;
  lat: string;
  lng: string;
  capacity: string;
  duration_minutes: string;
  cancellation_policy: ExperienceCancellationPolicy;
  base_price_amount: string;
  base_price_currency: string;
  content_language: "fr" | "en";
}

const BLANK: FormState = {
  title: "",
  description: "",
  experience_type: "",
  city: "",
  country_code: "CM",
  lat: "",
  lng: "",
  capacity: "8",
  duration_minutes: "120",
  cancellation_policy: "moderate",
  base_price_amount: "",
  base_price_currency: "XAF",
  content_language: "fr",
};

function fromDetail(d: ExperienceDetail): FormState {
  return {
    title: d.title,
    description: d.description ?? "",
    experience_type: d.experience_type,
    city: d.city,
    country_code: d.country_code,
    lat: String(d.location.lat),
    lng: String(d.location.lng),
    capacity: String(d.capacity),
    duration_minutes: String(d.duration_minutes),
    cancellation_policy: d.cancellation_policy,
    base_price_amount: d.base_price.amount,
    base_price_currency: d.base_price.currency,
    content_language: (d.content_language as "fr" | "en") ?? "fr",
  };
}

interface ExperienceFormProps {
  initial: ExperienceDetail | null;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (payload: ExperienceCreateInput) => void;
}

export function ExperienceForm({
  initial,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  onSubmit,
}: ExperienceFormProps) {
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
    const payload: ExperienceCreateInput = {
      title: form.title,
      description: form.description,
      experience_type: form.experience_type,
      city: form.city,
      country_code: form.country_code.toUpperCase(),
      location: { lat: Number(form.lat), lng: Number(form.lng) },
      capacity: Number(form.capacity),
      duration_minutes: Number(form.duration_minutes),
      cancellation_policy: form.cancellation_policy,
      base_price: {
        amount: form.base_price_amount,
        currency: form.base_price_currency,
      },
      content_language: form.content_language,
    };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title="Informations">
        <Field label="Titre">
          <input
            required
            minLength={3}
            maxLength={180}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={4}
            maxLength={10000}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Type">
          <select
            required
            value={form.experience_type}
            onChange={(e) => update("experience_type", e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">— Choisir —</option>
            {experienceTypes.data?.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label_fr}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Langue du contenu">
          <select
            value={form.content_language}
            onChange={(e) =>
              update("content_language", e.target.value as "fr" | "en")
            }
            className={INPUT_CLASS}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </Field>
      </Section>

      <Section title="Localisation">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ville">
            <input
              required
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Pays (ISO 2 lettres)">
            <input
              required
              minLength={2}
              maxLength={2}
              value={form.country_code}
              onChange={(e) =>
                update("country_code", e.target.value.toUpperCase())
              }
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Latitude">
            <input
              required
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => update("lat", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Longitude">
            <input
              required
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => update("lng", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </Section>

      <Section title="Format">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Participants max">
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
          <Field label="Durée (minutes)">
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
        <Field label="Politique d’annulation">
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
                {p.label_fr}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Tarif">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prix par participant">
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.base_price_amount}
              onChange={(e) => update("base_price_amount", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Devise">
            <select
              value={form.base_price_currency}
              onChange={(e) => update("base_price_currency", e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="XAF">XAF</option>
              <option value="XOF">XOF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </Field>
        </div>
      </Section>

      {error != null && (
        <p className="text-sm text-red-600">
          Erreur: {error instanceof Error ? error.message : String(error)}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isPending}
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
