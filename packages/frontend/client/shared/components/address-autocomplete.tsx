import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";
import {
  featureToPick,
  type LocationPick,
  type PhotonFeature,
} from "@/shared/lib/location";

const PHOTON_URL = "https://photon.komoot.io/api/";
const DEBOUNCE_MS = 300;

export type AddressGranularity = "any" | "place";

interface Props {
  inputId: string;
  label: string;
  placeholder: string;
  initial: LocationPick | null;
  onChange: (pick: LocationPick | null) => void;
  granularity?: AddressGranularity;
}

export function AddressAutocomplete({
  inputId,
  label,
  placeholder,
  initial,
  onChange,
  granularity = "any",
}: Props) {
  const [query, setQuery] = useState(initial?.address ?? "");
  const [suggestions, setSuggestions] = useState<LocationPick[]>([]);
  const [open, setOpen] = useState(false);
  const [hasPicked, setHasPicked] = useState(Boolean(initial));
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Photon search with debounce. Aborts the pending request on each keystroke
  // so we never render stale results from a fast typer.
  useEffect(() => {
    if (!query || query.length < 2 || hasPicked) return;
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const tags =
          granularity === "place"
            ? "&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village"
            : "";
        const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=6${tags}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const json = (await res.json()) as { features?: PhotonFeature[] };
        const seen = new Set<string>();
        const list = (json.features ?? [])
          .map(featureToPick)
          .filter((s): s is LocationPick => s !== null)
          .filter((s) => {
            if (seen.has(s.address)) return false;
            seen.add(s.address);
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
  }, [query, hasPicked, granularity]);

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

  function pick(p: LocationPick) {
    setQuery(p.address);
    setHasPicked(true);
    setOpen(false);
    onChange(p);
  }

  function handleInput(value: string) {
    setQuery(value);
    if (value.length < 2) setOpen(false);
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
            <li key={s.address}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="w-full px-4 py-2.5 text-left text-sm text-ganitel-text-title hover:bg-ganitel-secondary/10"
              >
                {s.address}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
