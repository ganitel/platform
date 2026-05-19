import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import type {
  CancellationPolicy,
  KitchenType,
  ParkingAvailability,
  PropertyCreateInput,
  PropertyDetail,
} from "@/features/properties/types";
import {
  listAmenities,
  listCancellationPolicies,
  listPropertyTypes,
} from "@/features/reference/api";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";

interface FormState {
  title: string;
  description: string;
  property_type: string;
  city: string;
  country_code: string;
  lat: string;
  lng: string;
  capacity: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  amenities: Set<string>;
  parking_available: ParkingAvailability;
  elevator: boolean;
  accessible: boolean;
  private_bathroom: boolean;
  kitchen_type: KitchenType;
  events_allowed: boolean;
  family_friendly: boolean;
  child_friendly: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  check_in_time: string;
  check_out_time: string;
  house_rules: string;
  cancellation_policy: CancellationPolicy;
  base_price_amount: string;
  base_price_currency: string;
  content_language: "fr" | "en";
}

const BLANK: FormState = {
  title: "",
  description: "",
  property_type: "",
  city: "",
  country_code: "CM",
  lat: "",
  lng: "",
  capacity: "2",
  bedrooms: "1",
  beds: "1",
  bathrooms: "1",
  amenities: new Set(),
  parking_available: "none",
  elevator: false,
  accessible: false,
  private_bathroom: false,
  kitchen_type: "none",
  events_allowed: false,
  family_friendly: false,
  child_friendly: false,
  pets_allowed: false,
  smoking_allowed: false,
  check_in_time: "",
  check_out_time: "",
  house_rules: "",
  cancellation_policy: "moderate",
  base_price_amount: "",
  base_price_currency: "XAF",
  content_language: "fr",
};

function fromDetail(d: PropertyDetail): FormState {
  // Time values come back as "HH:MM:SS" from a Python `time`; the <input type="time">
  // expects "HH:MM". Strip the trailing seconds so the picker pre-fills correctly.
  const trimTime = (t: string | null) => (t ? t.slice(0, 5) : "");
  return {
    title: d.title,
    description: d.description ?? "",
    property_type: d.property_type,
    city: d.city,
    country_code: d.country_code,
    lat: String(d.location.lat),
    lng: String(d.location.lng),
    capacity: String(d.capacity),
    bedrooms: String(d.bedrooms),
    beds: String(d.beds),
    bathrooms: String(d.bathrooms),
    amenities: new Set(d.amenities),
    parking_available: d.listing_metadata.parking_available,
    elevator: d.listing_metadata.elevator,
    accessible: d.listing_metadata.accessible,
    private_bathroom: d.listing_metadata.private_bathroom,
    kitchen_type: d.listing_metadata.kitchen_type,
    events_allowed: d.listing_metadata.events_allowed,
    family_friendly: d.listing_metadata.family_friendly,
    child_friendly: d.listing_metadata.child_friendly,
    pets_allowed: d.listing_metadata.pets_allowed,
    smoking_allowed: d.listing_metadata.smoking_allowed,
    check_in_time: trimTime(d.listing_metadata.check_in_time),
    check_out_time: trimTime(d.listing_metadata.check_out_time),
    house_rules: d.house_rules ?? "",
    cancellation_policy: d.cancellation_policy,
    base_price_amount: d.base_price.amount,
    base_price_currency: d.base_price.currency,
    content_language: (d.content_language as "fr" | "en") ?? "fr",
  };
}

interface RentalFormProps {
  initial: PropertyDetail | null;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (payload: PropertyCreateInput) => void;
}

export function RentalForm({
  initial,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  onSubmit,
}: RentalFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromDetail(initial) : BLANK,
  );

  const propertyTypes = useQuery({
    queryKey: ["reference", "property-types"],
    queryFn: listPropertyTypes,
  });
  const amenities = useQuery({
    queryKey: ["reference", "amenities"],
    queryFn: listAmenities,
  });
  const policies = useQuery({
    queryKey: ["reference", "cancellation-policies"],
    queryFn: listCancellationPolicies,
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(code: string) {
    setForm((prev) => {
      const next = new Set(prev.amenities);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return { ...prev, amenities: next };
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload: PropertyCreateInput = {
      title: form.title,
      description: form.description,
      property_type: form.property_type,
      city: form.city,
      country_code: form.country_code.toUpperCase(),
      location: { lat: Number(form.lat), lng: Number(form.lng) },
      capacity: Number(form.capacity),
      bedrooms: Number(form.bedrooms),
      beds: Number(form.beds),
      bathrooms: Number(form.bathrooms),
      amenities: Array.from(form.amenities),
      parking_available: form.parking_available,
      elevator: form.elevator,
      accessible: form.accessible,
      private_bathroom: form.private_bathroom,
      kitchen_type: form.kitchen_type,
      events_allowed: form.events_allowed,
      family_friendly: form.family_friendly,
      child_friendly: form.child_friendly,
      pets_allowed: form.pets_allowed,
      smoking_allowed: form.smoking_allowed,
      check_in_time: form.check_in_time || null,
      check_out_time: form.check_out_time || null,
      house_rules: form.house_rules || null,
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
            value={form.property_type}
            onChange={(e) => update("property_type", e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">— Choisir —</option>
            {propertyTypes.data?.map((p) => (
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

      <Section title="Capacité">
        <div className="grid grid-cols-4 gap-4">
          <Field label="Voyageurs">
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
          <Field label="Chambres">
            <input
              type="number"
              min={0}
              max={32}
              value={form.bedrooms}
              onChange={(e) => update("bedrooms", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Lits">
            <input
              type="number"
              min={0}
              max={64}
              value={form.beds}
              onChange={(e) => update("beds", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Salles de bain">
            <input
              type="number"
              min={0}
              max={32}
              value={form.bathrooms}
              onChange={(e) => update("bathrooms", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </Section>

      <Section title="Équipements">
        {amenities.data && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.data.map((a) => (
              <label key={a.code} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.amenities.has(a.code)}
                  onChange={() => toggleAmenity(a.code)}
                />
                {a.label_fr}
              </label>
            ))}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Parking">
            <select
              value={form.parking_available}
              onChange={(e) =>
                update(
                  "parking_available",
                  e.target.value as ParkingAvailability,
                )
              }
              className={INPUT_CLASS}
            >
              <option value="none">Aucun</option>
              <option value="free">Gratuit</option>
              <option value="paid">Payant</option>
            </select>
          </Field>
          <Field label="Cuisine">
            <select
              value={form.kitchen_type}
              onChange={(e) =>
                update("kitchen_type", e.target.value as KitchenType)
              }
              className={INPUT_CLASS}
            >
              <option value="none">Aucune</option>
              <option value="kitchenette">Kitchenette</option>
              <option value="full">Cuisine complète</option>
            </select>
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <BoolField
            label="Ascenseur"
            checked={form.elevator}
            onChange={(v) => update("elevator", v)}
          />
          <BoolField
            label="Accessible PMR"
            checked={form.accessible}
            onChange={(v) => update("accessible", v)}
          />
          <BoolField
            label="Salle de bain privée"
            checked={form.private_bathroom}
            onChange={(v) => update("private_bathroom", v)}
          />
        </div>
      </Section>

      <Section title="Règles">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Arrivée">
            <input
              type="time"
              value={form.check_in_time}
              onChange={(e) => update("check_in_time", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Départ">
            <input
              type="time"
              value={form.check_out_time}
              onChange={(e) => update("check_out_time", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <BoolField
            label="Animaux"
            checked={form.pets_allowed}
            onChange={(v) => update("pets_allowed", v)}
          />
          <BoolField
            label="Fumeur"
            checked={form.smoking_allowed}
            onChange={(v) => update("smoking_allowed", v)}
          />
          <BoolField
            label="Événements"
            checked={form.events_allowed}
            onChange={(v) => update("events_allowed", v)}
          />
          <BoolField
            label="Familles bienvenues"
            checked={form.family_friendly}
            onChange={(v) => update("family_friendly", v)}
          />
          <BoolField
            label="Enfants bienvenus"
            checked={form.child_friendly}
            onChange={(v) => update("child_friendly", v)}
          />
        </div>
        <Field label="Règles libres">
          <textarea
            rows={3}
            maxLength={4000}
            value={form.house_rules}
            onChange={(e) => update("house_rules", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Politique d’annulation">
          <select
            value={form.cancellation_policy}
            onChange={(e) =>
              update(
                "cancellation_policy",
                e.target.value as CancellationPolicy,
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
          <Field label="Prix par nuit">
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

function BoolField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
