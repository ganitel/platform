import { useMutation, useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";

import { createExperience } from "@/features/experiences/api";
import type {
  ExperienceCancellationPolicy,
  ExperienceCreateInput,
} from "@/features/experiences/types";
import {
  listCancellationPolicies,
  listExperienceTypes,
} from "@/features/reference/api";
import { AdminGuard } from "@/shared/components/admin-guard";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";
import type { Route } from "./+types/admin.experiences.new";

export const meta: Route.MetaFunction = () => [
  { title: "Admin — Nouvelle expérience" },
  { name: "robots", content: "noindex" },
];

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

const INITIAL: FormState = {
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

export default function AdminExperiencesNewRoute() {
  return (
    <AdminGuard>
      <AdminExperiencesNewPage />
    </AdminGuard>
  );
}

function AdminExperiencesNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);

  const experienceTypes = useQuery({
    queryKey: ["reference", "experience-types"],
    queryFn: listExperienceTypes,
  });
  const policies = useQuery({
    queryKey: ["reference", "cancellation-policies"],
    queryFn: listCancellationPolicies,
  });

  const create = useMutation({
    mutationFn: (body: ExperienceCreateInput) => createExperience(body),
    onSuccess: () => navigate("/admin/experiences"),
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
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
    create.mutate(payload);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            Nouvelle expérience
          </h1>
          <p className="mt-1 text-sm text-ganitel-text-body">
            Création d’un brouillon. Les photos sont attachées séparément avant
            publication.
          </p>
        </div>
        <Link
          to="/admin/experiences"
          className="text-sm text-ganitel-text-body hover:underline"
        >
          ← Retour
        </Link>
      </header>

      <form onSubmit={onSubmit} className="space-y-8">
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

        {create.isError && (
          <p className="text-sm text-red-600">Erreur: {String(create.error)}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link
            to="/admin/experiences"
            className="text-sm text-ganitel-text-body hover:underline"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-xl bg-ganitel-secondary px-6 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {create.isPending ? "Création…" : "Créer le brouillon"}
          </button>
        </div>
      </form>
    </div>
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
