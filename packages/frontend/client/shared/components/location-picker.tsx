import { useState } from "react";

import { AddressAutocomplete } from "@/shared/components/address-autocomplete";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";
import {
  featureToPick,
  type LocationPick,
  type PhotonFeature,
} from "@/shared/lib/location";

const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";

interface PhotonResponse {
  features?: PhotonFeature[];
}

async function resolvePlusCode(raw: string): Promise<LocationPick> {
  // Lazy-load the Plus Code library so it only ships when this fallback is used.
  const olcModule = await import("open-location-code");
  const olc = new olcModule.OpenLocationCode();

  const input = raw.trim();
  if (!input) throw new Error("plus_code.empty");

  // Two accepted shapes:
  //   "8FRF24RJ+QM"            -> full global code, decodes on its own
  //   "XWPP+5M Kribi, Cameroon"-> short code + locality reference
  const firstSpace = input.indexOf(" ");
  const codePart = firstSpace === -1 ? input : input.slice(0, firstSpace);
  const localityPart =
    firstSpace === -1 ? "" : input.slice(firstSpace + 1).trim();

  let fullCode: string;
  let referencePick: LocationPick | null = null;

  if (olc.isFull(codePart)) {
    fullCode = codePart.toUpperCase();
  } else if (olc.isShort(codePart)) {
    if (!localityPart) throw new Error("plus_code.short_needs_locality");
    referencePick = await geocodeLocality(localityPart);
    fullCode = olc.recoverNearest(
      codePart.toUpperCase(),
      referencePick.lat,
      referencePick.lng,
    );
  } else {
    throw new Error("plus_code.invalid");
  }

  const area = olc.decode(fullCode);
  const lat = area.latitudeCenter;
  const lng = area.longitudeCenter;

  // For the short-code path we already have a locality (city + country).
  // For the full-code path we reverse-geocode to discover city + country.
  const place = referencePick ?? (await reverseGeocode(lat, lng));

  return {
    address: localityPart
      ? `${codePart.toUpperCase()} ${localityPart}`
      : fullCode,
    city: place.city,
    country: place.country,
    country_code: place.country_code,
    lat,
    lng,
  };
}

async function geocodeLocality(locality: string): Promise<LocationPick> {
  const url = `${PHOTON_URL}?q=${encodeURIComponent(locality)}&limit=1&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("plus_code.locality_lookup_failed");
  const json = (await res.json()) as PhotonResponse;
  const feature = json.features?.[0];
  if (!feature) throw new Error("plus_code.locality_not_found");
  const pick = featureToPick(feature);
  if (!pick) throw new Error("plus_code.locality_not_found");
  return pick;
}

async function reverseGeocode(lat: number, lng: number): Promise<LocationPick> {
  const url = `${PHOTON_REVERSE_URL}?lat=${lat}&lon=${lng}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("plus_code.reverse_failed");
  const json = (await res.json()) as PhotonResponse;
  const feature = json.features?.[0];
  if (!feature) throw new Error("plus_code.reverse_not_found");
  const pick = featureToPick(feature);
  if (!pick) throw new Error("plus_code.reverse_not_found");
  return pick;
}

interface Props {
  initial: LocationPick | null;
  onChange: (pick: LocationPick | null) => void;
}

export function LocationPicker({ initial, onChange }: Props) {
  const t = useT();
  const [pick, setPick] = useState<LocationPick | null>(initial);
  const [showPlusCode, setShowPlusCode] = useState(false);
  const [plusCode, setPlusCode] = useState("");
  const [plusError, setPlusError] = useState<string>("");
  const [resolving, setResolving] = useState(false);

  function handleAutocompletePick(next: LocationPick | null) {
    setPick(next);
    setPlusError("");
    onChange(next);
  }

  async function handlePlusCodeResolve() {
    setPlusError("");
    setResolving(true);
    try {
      const next = await resolvePlusCode(plusCode);
      setPick(next);
      onChange(next);
    } catch (err) {
      const key = err instanceof Error ? err.message : "plus_code.invalid";
      setPlusError(t(translatePlusCodeError(key)));
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="space-y-3">
      <AddressAutocomplete
        inputId="location-address"
        label={t("admin.location.label")}
        placeholder={t("admin.location.placeholder")}
        initial={initial}
        onChange={handleAutocompletePick}
      />

      {pick && (
        <div className="rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-3 text-xs text-ganitel-text-subtitle">
          <div className="font-medium text-ganitel-text-title">
            {pick.city}, {pick.country}
            <span className="ml-2 rounded-md bg-ganitel-stroke-neutral/40 px-1.5 py-0.5 font-mono text-[10px] uppercase text-ganitel-text-body">
              {pick.country_code}
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-ganitel-text-placeholder">
            {pick.lat.toFixed(5)}, {pick.lng.toFixed(5)}
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowPlusCode((v) => !v)}
          className="text-xs text-ganitel-text-body underline-offset-2 hover:underline"
        >
          {showPlusCode
            ? t("admin.location.plus_code.hide")
            : t("admin.location.plus_code.show")}
        </button>

        {showPlusCode && (
          <div className="mt-2 rounded-xl border border-dashed border-ganitel-stroke-neutral p-3">
            <label htmlFor="plus-code-input" className={LABEL_CLASS}>
              {t("admin.location.plus_code.label")}
            </label>
            <p className="mt-0.5 mb-2 text-xs text-ganitel-text-placeholder">
              {t("admin.location.plus_code.hint")}
            </p>
            <div className="flex gap-2">
              <input
                id="plus-code-input"
                type="text"
                value={plusCode}
                onChange={(e) => setPlusCode(e.target.value)}
                placeholder={t("admin.location.plus_code.placeholder")}
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={handlePlusCodeResolve}
                disabled={!plusCode.trim() || resolving}
                className="shrink-0 rounded-xl bg-ganitel-secondary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {resolving
                  ? t("admin.location.plus_code.resolving")
                  : t("admin.location.plus_code.resolve")}
              </button>
            </div>
            {plusError && (
              <p className="mt-2 text-xs text-red-600">{plusError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function translatePlusCodeError(key: string): TranslationKey {
  switch (key) {
    case "plus_code.empty":
      return "admin.location.plus_code.error.empty";
    case "plus_code.invalid":
      return "admin.location.plus_code.error.invalid";
    case "plus_code.short_needs_locality":
      return "admin.location.plus_code.error.short_needs_locality";
    case "plus_code.locality_not_found":
      return "admin.location.plus_code.error.locality_not_found";
    case "plus_code.locality_lookup_failed":
      return "admin.location.plus_code.error.network";
    case "plus_code.reverse_failed":
    case "plus_code.reverse_not_found":
      return "admin.location.plus_code.error.reverse";
    case "plus_code.lib_unavailable":
      return "admin.location.plus_code.error.lib";
    default:
      return "admin.location.plus_code.error.invalid";
  }
}
