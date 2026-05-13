import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";
import type { LocationPick } from "@/features/team/types";

const PHOTON_URL = "https://photon.komoot.io/api/";
const DEBOUNCE_MS = 300;

interface PhotonFeature {
  properties: {
    name?: string;
    city?: string;
    country?: string;
    state?: string;
    osm_id?: number;
    osm_type?: string;
  };
}

interface Suggestion {
  label: string;
  city: string;
  country: string;
}

function toSuggestion(feature: PhotonFeature): Suggestion | null {
  const p = feature.properties;
  // Prefer city, fall back to name (covers towns/villages photon labels as `name`).
  const city = p.city ?? p.name ?? "";
  const country = p.country ?? "";
  if (!city || !country) return null;
  const parts = [city, p.state, country].filter(Boolean);
  return {
    label: parts.join(", "),
    city,
    country,
  };
}

export function LocationAutocomplete({
  initialCity,
  initialCountry,
  label,
  placeholder,
  onChange,
  inputId,
}: {
  initialCity: string;
  initialCountry: string;
  label: string;
  placeholder: string;
  onChange: (pick: LocationPick | null) => void;
  inputId: string;
}) {
  const initialLabel =
    initialCity && initialCountry ? `${initialCity}, ${initialCountry}` : "";
  const [query, setQuery] = useState(initialLabel);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [hasPicked, setHasPicked] = useState(Boolean(initialLabel));
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Photon search with debounce. Aborts the pending request on each keystroke
  // so we never render stale results from a fast typer. All setState happens
  // after the await, so eslint's no-synchronous-setState rule is satisfied.
  useEffect(() => {
    if (!query || query.length < 2 || hasPicked) return;
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=6&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const json = (await res.json()) as { features?: PhotonFeature[] };
        const seen = new Set<string>();
        const list = (json.features ?? [])
          .map(toSuggestion)
          .filter((s): s is Suggestion => s !== null)
          .filter((s) => {
            if (seen.has(s.label)) return false;
            seen.add(s.label);
            return true;
          });
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [query, hasPicked]);

  // Click outside to close the dropdown.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(s: Suggestion) {
    setQuery(s.label);
    setHasPicked(true);
    setOpen(false);
    onChange({ city: s.city, country: s.country });
  }

  function handleInput(value: string) {
    setQuery(value);
    if (value.length < 2) setOpen(false);
    // User edited the input — invalidate the previous pick so the form's
    // submit button disables until they pick again.
    if (hasPicked) {
      setHasPicked(false);
      onChange(null);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor={inputId} className={LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
          aria-hidden
        />
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          value={query}
          onChange={(event) => handleInput(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={cn(INPUT_CLASS, "pl-10")}
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-ganitel-stroke-neutral bg-ganitel-paper shadow-lg">
          {suggestions.map((s) => (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="w-full px-4 py-2.5 text-left text-sm text-ganitel-text-title hover:bg-ganitel-secondary/10"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
