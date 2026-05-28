import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import type {
  BedSpec,
  RoomTypeCreateInput,
  RoomTypePublic,
} from "@/features/properties/types";
import { listAmenities, listBedTypes } from "@/features/reference/api";
import { MarkdownEditor } from "@/shared/components/markdown-editor";
import { MediaUploader } from "@/shared/components/media-uploader";
import type {
  UploaderItem,
  UploaderOnChange,
} from "@/shared/components/media-uploader.types";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";
import { useLocale, useT } from "@/shared/lib/i18n";

interface FormState {
  title: string;
  description: string;
  bed_config: BedSpec[];
  max_guests: string;
  amenities: Set<string>;
  private_bathroom: boolean;
  inventory_count: string;
  prices: { amount: string; currency: string }[];
  active: boolean;
  position: string;
}

const BLANK: FormState = {
  title: "",
  description: "",
  bed_config: [{ type: "double", count: 1 }],
  max_guests: "2",
  amenities: new Set(),
  private_bathroom: true,
  inventory_count: "1",
  prices: [{ amount: "", currency: "XAF" }],
  active: true,
  position: "0",
};

function fromRoom(room: RoomTypePublic): FormState {
  const beds = room.bed_config ?? [];
  return {
    title: room.title,
    description: room.description ?? "",
    bed_config:
      beds.length > 0
        ? beds.map((bed) => ({ type: bed.type, count: bed.count }))
        : [{ type: "double", count: 1 }],
    max_guests: String(room.max_guests),
    amenities: new Set(room.amenities),
    private_bathroom: room.private_bathroom,
    inventory_count: String(room.inventory_count),
    prices: room.prices.map((price) => ({
      amount: price.amount,
      currency: price.currency,
    })),
    active: room.active,
    position: String(room.position),
  };
}

interface RoomFormMediaState {
  mode: "draft" | "listing";
  draftId?: string;
  listingId?: string;
  items: UploaderItem[];
  setItems: UploaderOnChange;
}

interface RoomTypeFormProps {
  initial: RoomTypePublic | null;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (payload: RoomTypeCreateInput) => void;
  mediaState: RoomFormMediaState;
}

export function RoomTypeForm({
  initial,
  submitLabel,
  pendingLabel,
  isPending,
  error,
  onSubmit,
  mediaState,
}: RoomTypeFormProps) {
  const tr = useT();
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromRoom(initial) : BLANK,
  );

  const bedTypes = useQuery({
    queryKey: ["reference", "bed-types"],
    queryFn: listBedTypes,
  });
  const amenities = useQuery({
    queryKey: ["reference", "amenities"],
    queryFn: listAmenities,
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

  function updateBed(index: number, patch: Partial<BedSpec>) {
    setForm((prev) => {
      const next = [...prev.bed_config];
      next[index] = { ...next[index], ...patch };
      return { ...prev, bed_config: next };
    });
  }

  function addBed() {
    const defaultType = bedTypes.data?.[0]?.code ?? "double";
    setForm((prev) => ({
      ...prev,
      bed_config: [...prev.bed_config, { type: defaultType, count: 1 }],
    }));
  }

  function removeBed(index: number) {
    setForm((prev) => ({
      ...prev,
      bed_config: prev.bed_config.filter((_, idx) => idx !== index),
    }));
  }

  function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    const payload: RoomTypeCreateInput = {
      title: form.title,
      description: form.description,
      bed_config: form.bed_config.map((bed) => ({
        type: bed.type,
        count: Number(bed.count),
      })),
      max_guests: Number(form.max_guests),
      amenities: Array.from(form.amenities),
      private_bathroom: form.private_bathroom,
      inventory_count: Number(form.inventory_count),
      prices: form.prices
        .filter((price) => String(price.amount).trim() !== "")
        .map((price) => ({
          amount: String(price.amount),
          currency: price.currency,
        })),
      active: form.active,
      position: Number(form.position),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title={tr("admin.rooms.form.section.info")}>
        <Field label={tr("admin.rooms.form.title")}>
          <input
            required
            minLength={2}
            maxLength={180}
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label={tr("admin.rooms.form.description")}>
          <MarkdownEditor
            rows={6}
            maxLength={10000}
            value={form.description}
            onChange={(value) => update("description", value)}
          />
        </Field>
      </Section>

      <Section title={tr("admin.rooms.form.section.beds")}>
        <div className="space-y-2">
          {form.bed_config.map((bed, index) => (
            <div key={index} className="flex items-end gap-2">
              <Field label={tr("admin.rooms.form.bed_type")}>
                <select
                  value={bed.type}
                  onChange={(event) =>
                    updateBed(index, { type: event.target.value })
                  }
                  className={INPUT_CLASS}
                >
                  {bedTypes.data?.map((option) => (
                    <option key={option.code} value={option.code}>
                      {labelOf(option)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={tr("admin.rooms.form.bed_count")}>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={bed.count}
                  onChange={(event) =>
                    updateBed(index, {
                      count: Number(event.target.value) || 1,
                    })
                  }
                  className={INPUT_CLASS}
                />
              </Field>
              {form.bed_config.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBed(index)}
                  className="cursor-pointer rounded border border-ganitel-stroke-neutral px-3 py-2 text-sm"
                  aria-label={`${tr("admin.action.delete")}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addBed}
            className="cursor-pointer rounded-md border border-dashed border-ganitel-stroke-neutral px-4 py-2 text-sm text-ganitel-text-body"
          >
            {tr("admin.rooms.form.bed_config_add")}
          </button>
        </div>
      </Section>

      <Section title={tr("admin.rooms.form.section.capacity")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label={tr("admin.rooms.form.max_guests")}>
            <input
              required
              type="number"
              min={1}
              max={16}
              value={form.max_guests}
              onChange={(event) => update("max_guests", event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label={tr("admin.rooms.form.inventory_count")}>
            <input
              required
              type="number"
              min={1}
              max={500}
              value={form.inventory_count}
              onChange={(event) =>
                update("inventory_count", event.target.value)
              }
              className={INPUT_CLASS}
            />
          </Field>
          <Field label={tr("admin.rooms.form.position")}>
            <input
              type="number"
              min={0}
              max={1000}
              value={form.position}
              onChange={(event) => update("position", event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.private_bathroom}
            onChange={(event) =>
              update("private_bathroom", event.target.checked)
            }
          />
          {tr("admin.rooms.form.private_bathroom")}
        </label>
      </Section>

      <Section title={tr("admin.rooms.form.section.amenities")}>
        {amenities.data && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.data.map((amenity) => (
              <label
                key={amenity.code}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.amenities.has(amenity.code)}
                  onChange={() => toggleAmenity(amenity.code)}
                />
                {labelOf(amenity)}
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section title={tr("admin.rooms.form.section.price")}>
        <div className="space-y-2">
          {form.prices.map((price, index) => (
            <div key={index} className="flex items-end gap-2">
              <Field label={tr("admin.form.price.amount")}>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  value={price.amount}
                  onChange={(event) => {
                    const next = [...form.prices];
                    next[index] = {
                      ...next[index],
                      amount: event.target.value,
                    };
                    update("prices", next);
                  }}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label={tr("admin.form.price.currency")}>
                <select
                  value={price.currency}
                  onChange={(event) => {
                    const next = [...form.prices];
                    next[index] = {
                      ...next[index],
                      currency: event.target.value,
                    };
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
                      form.prices.filter((_, idx) => idx !== index),
                    );
                  }}
                  className="cursor-pointer rounded border border-ganitel-stroke-neutral px-3 py-2 text-sm"
                  aria-label={`${tr("admin.action.delete")}`}
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
            className="cursor-pointer rounded-md border border-dashed border-ganitel-stroke-neutral px-4 py-2 text-sm text-ganitel-text-body"
          >
            {tr("admin.form.price.add")}
          </button>
        </div>
      </Section>

      <Section title={tr("admin.rooms.form.section.status")}>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => update("active", event.target.checked)}
          />
          {tr("admin.rooms.form.active")}
        </label>
      </Section>

      <Section title={tr("admin.rooms.form.section.media")}>
        {mediaState.mode === "draft" ? (
          <MediaUploader
            mode="draft"
            draftId={mediaState.draftId as string}
            value={mediaState.items}
            onChange={mediaState.setItems}
          />
        ) : (
          <ReadOnlyMediaGrid
            items={mediaState.items}
            note={tr("admin.rooms.form.media.read_only_note")}
            emptyLabel={tr("admin.rooms.form.media.empty_existing")}
          />
        )}
      </Section>

      {error != null && (
        <p className="text-sm text-red-600">
          {tr("common.error_prefix")}
          {": "}
          {error instanceof Error ? error.message : String(error)}
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
    <section className="rounded-2xl border border-ganitel-stroke-neutral bg-white p-5">
      <h3 className="mb-3 text-base font-semibold text-ganitel-text-title">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
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
    <label className="block flex-1">
      <span className={LABEL_CLASS}>{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyMediaGrid({
  items,
  note,
  emptyLabel,
}: {
  items: UploaderItem[];
  note: string;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ganitel-text-subtitle">{emptyLabel}</p>;
  }
  return (
    <>
      <p className="text-xs text-ganitel-text-subtitle">{note}</p>
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <li
            key={item.localId}
            className="aspect-square overflow-hidden rounded-md border border-ganitel-stroke-neutral bg-ganitel-neutral-2"
          >
            {item.kind === "image" ? (
              <img
                src={item.previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={item.previewUrl}
                muted
                playsInline
                preload="metadata"
                poster={item.posterUrl ?? undefined}
                className="h-full w-full object-cover"
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
