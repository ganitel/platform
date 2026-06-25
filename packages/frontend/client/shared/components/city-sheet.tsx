import { useState } from "react";
import { Drawer } from "vaul";
import { useNavigate } from "react-router";
import { ArrowRight, Check, Compass, Search } from "lucide-react";

import { CAMEROON_CITIES, browseCityHref } from "@/shared/lib/cities";
import { useT } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Which city would you love to explore?" bottom sheet — the guided entry
 * flow from the home hero. Selecting a city + Continue routes to discovery
 * scoped to that city. On /browse, city stays an in-page filter instead.
 */
export function CitySheet({ open, onOpenChange }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? CAMEROON_CITIES.filter((city) =>
        city.name.toLowerCase().includes(normalized),
      )
    : CAMEROON_CITIES;

  function handleContinue() {
    const city =
      CAMEROON_CITIES.find((candidate) => candidate.name === selected) ??
      filtered[0] ??
      CAMEROON_CITIES[0];
    onOpenChange(false);
    navigate(browseCityHref(city));
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-ganitel-primary/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[60] mt-24 flex max-h-[90vh] flex-col rounded-t-[32px] bg-ganitel-surface-card outline-none">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-ganitel-outline-soft/70" />

          <div className="flex flex-col gap-2 px-6 pt-5">
            <Drawer.Title className="text-2xl font-semibold tracking-[-0.02em] text-ganitel-text-title">
              {t("citysheet.title")}
            </Drawer.Title>
            <Drawer.Description className="text-sm leading-relaxed text-ganitel-text-subtitle">
              {t("citysheet.sub")}
            </Drawer.Description>
          </div>

          <div className="px-6 pt-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ganitel-text-placeholder" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("citysheet.search.placeholder")}
                aria-label={t("citysheet.search.placeholder")}
                className="h-12 w-full rounded-cta border border-input bg-ganitel-surface-card pl-11 pr-4 text-base placeholder:text-ganitel-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-ganitel-text-placeholder">
                {t("citysheet.empty")}
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {filtered.map((city) => {
                  const isSelected = selected === city.name;
                  return (
                    <li key={city.name} className="m-0 p-0">
                      <button
                        type="button"
                        onClick={() => setSelected(city.name)}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex w-full items-center justify-between rounded-card border px-5 py-4 text-left transition-colors",
                          isSelected
                            ? "border-ganitel-olive bg-ganitel-olive-soft/60"
                            : "border-transparent bg-ganitel-surface-2 hover:bg-ganitel-surface-3",
                        )}
                      >
                        <span>
                          <span className="block text-base font-medium text-ganitel-text-title">
                            {city.name}
                          </span>
                          {isSelected && (
                            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ganitel-olive">
                              {t("citysheet.active")}
                            </span>
                          )}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex size-7 items-center justify-center rounded-full bg-ganitel-accent text-white">
                            <Check className="size-4" />
                          </span>
                        ) : (
                          <ArrowRight className="size-5 text-ganitel-text-placeholder" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-ganitel-outline-soft/40 bg-ganitel-surface-card p-5 pb-safe">
            <Button
              onClick={handleContinue}
              size="cta"
              className="w-full gap-2"
            >
              {t("citysheet.continue")}
              <Compass className="size-5" />
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
