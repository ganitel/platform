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
  listHotelCategories,
} from "@/features/reference/api";
import { LocationPicker } from "@/shared/components/location-picker";
import { MarkdownEditor } from "@/shared/components/markdown-editor";
import { MediaUploader } from "@/shared/components/media-uploader";
import type {
  UploaderItem,
  UploaderOnChange,
} from "@/shared/components/media-uploader.types";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";
import { type TranslationKey, useLocale, useT } from "@/shared/lib/i18n";
import type { LocationPick } from "@/shared/lib/location";

const k = (key: string) => key as TranslationKey;

interface FormState {
  title: string;
  description: string;
  hotel_category: string;
  location: LocationPick | null;
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
  content_language: "fr" | "en";
}

const BLANK: FormState = {
  title: "",
  description: "",
  hotel_category: "",
  location: null,
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
  content_language: "fr",
};

function fromDetail(d: PropertyDetail): FormState {
  const trimTime = (timeValue: string | null) =>
    timeValue ? timeValue.slice(0, 5) : "";
  return {
    title: d.title,
    description: d.description ?? "",
    hotel_category: d.property_type,
    location: {
      address: d.address ?? `${d.city}, ${d.country_code}`,
      city: d.city,
      country: d.country_code,
      country_code: d.country_code,
      lat: d.location.lat,
      lng: d.location.lng,
    },
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
    content_language: (d.content_language as "fr" | "en") ?? "fr",
  };
}

interface HotelFormMediaState {
  mode: "draft" | "listing";
  draftId?: string;
  listingId?: string;
  items: UploaderItem[];
  setItems: UploaderOnChange;
}

interface HotelFormProps {
  initial: PropertyDetail | null;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (payload: PropertyCreateInput) => void;
  mediaState: HotelFormMediaState;
}

export function HotelForm({
  initial,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  onSubmit,
  mediaState,
}: HotelFormProps) {
  const tr = useT();
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromDetail(initial) : BLANK,
  );

  const hotelCategories = useQuery({
    queryKey: ["reference", "hotel-categories"],
    queryFn: listHotelCategories,
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
    if (!form.location) return;
    const payload: PropertyCreateInput = {
      kind: "hotel",
      title: form.title,
      description: form.description,
      property_type: form.hotel_category,
      address: form.location.address,
      city: form.location.city,
      country_code: form.location.country_code,
      location: { lat: form.location.lat, lng: form.location.lng },
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
      prices: [],
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
        <Field label={tr(k("admin.hotels.form.category.label"))}>
          <select
            required
            value={form.hotel_category}
            onChange={(e) => update("hotel_category", e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">{tr("admin.form.select.placeholder")}</option>
            {hotelCategories.data?.map((category) => (
              <option key={category.code} value={category.code}>
                {labelOf(category)}
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

      <Section title={tr("admin.form.section.amenities")}>
        {amenities.data && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.data.map((a) => (
              <label key={a.code} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.amenities.has(a.code)}
                  onChange={() => toggleAmenity(a.code)}
                />
                {labelOf(a)}
              </label>
            ))}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label={tr("admin.form.parking.label")}>
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
              <option value="none">{tr("admin.form.parking.none")}</option>
              <option value="free">{tr("admin.form.parking.free")}</option>
              <option value="paid">{tr("admin.form.parking.paid")}</option>
            </select>
          </Field>
          <Field label={tr("admin.form.kitchen.label")}>
            <select
              value={form.kitchen_type}
              onChange={(e) =>
                update("kitchen_type", e.target.value as KitchenType)
              }
              className={INPUT_CLASS}
            >
              <option value="none">{tr("admin.form.kitchen.none")}</option>
              <option value="kitchenette">
                {tr("admin.form.kitchen.kitchenette")}
              </option>
              <option value="full">{tr("admin.form.kitchen.full")}</option>
            </select>
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <BoolField
            label={tr("admin.form.bool.elevator")}
            checked={form.elevator}
            onChange={(v) => update("elevator", v)}
          />
          <BoolField
            label={tr("admin.form.bool.accessible")}
            checked={form.accessible}
            onChange={(v) => update("accessible", v)}
          />
          <BoolField
            label={tr("admin.form.bool.private_bathroom")}
            checked={form.private_bathroom}
            onChange={(v) => update("private_bathroom", v)}
          />
        </div>
      </Section>

      <Section title={tr("admin.form.section.rules")}>
        <div className="grid grid-cols-2 gap-4">
          <Field label={tr("admin.form.check_in.label")}>
            <input
              type="time"
              value={form.check_in_time}
              onChange={(e) => update("check_in_time", e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label={tr("admin.form.check_out.label")}>
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
            label={tr("admin.form.bool.pets")}
            checked={form.pets_allowed}
            onChange={(v) => update("pets_allowed", v)}
          />
          <BoolField
            label={tr("admin.form.bool.smoking")}
            checked={form.smoking_allowed}
            onChange={(v) => update("smoking_allowed", v)}
          />
          <BoolField
            label={tr("admin.form.bool.events")}
            checked={form.events_allowed}
            onChange={(v) => update("events_allowed", v)}
          />
          <BoolField
            label={tr("admin.form.bool.family_friendly")}
            checked={form.family_friendly}
            onChange={(v) => update("family_friendly", v)}
          />
          <BoolField
            label={tr("admin.form.bool.child_friendly")}
            checked={form.child_friendly}
            onChange={(v) => update("child_friendly", v)}
          />
        </div>
        <Field label={tr("admin.form.house_rules.label")}>
          <textarea
            rows={3}
            maxLength={4000}
            value={form.house_rules}
            onChange={(e) => update("house_rules", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label={tr("admin.form.cancellation.label")}>
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
                {labelOf(p)}
              </option>
            ))}
          </select>
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
                listingKind: "property",
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
