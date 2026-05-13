import { useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronDown, Globe, Phone, Search } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { LABEL_CLASS } from "@/shared/lib/form-styles";
import { useT, useLocale } from "@/shared/lib/i18n";
import {
  DEFAULT_PHONE_COUNTRY_ISO2,
  PHONE_COUNTRIES,
  getPhoneCountry,
  type PhoneCountry,
} from "@/features/waitlist/phone-countries";

const OTHER_VALUE = "OTHER";
const E164_RE = /^\+[1-9]\d{6,14}$/;

// Borderless variant: the wrapping flex container owns border/rounding/ring,
// so the inner inputs only carry typography + background.
const INNER_INPUT_CLASS =
  "w-full bg-ganitel-neutral-1 text-base text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:outline-none transition-all md:text-sm";

interface PhoneInputProps {
  id: string;
  label: string;
  onChange: (value: string, isValid: boolean) => void;
}

function normalizeDigits(input: string): string {
  return input.replace(/\D/g, "").replace(/^0+/, "");
}

function cleanCustom(input: string): string {
  return input.replace(/[\s\-().]/g, "");
}

function buildE164(country: PhoneCountry, national: string): string {
  const digits = normalizeDigits(national);
  if (!digits) return "";
  return `+${country.dialCode}${digits}`;
}

export function PhoneInput({ id, label, onChange }: PhoneInputProps) {
  const t = useT();
  const locale = useLocale();

  const [iso2, setIso2] = useState<string>(DEFAULT_PHONE_COUNTRY_ISO2);
  const [national, setNational] = useState("");
  const [custom, setCustom] = useState("");
  const [open, setOpen] = useState(false);
  const nationalInputRef = useRef<HTMLInputElement | null>(null);
  const customInputRef = useRef<HTMLInputElement | null>(null);

  const country = useMemo(() => getPhoneCountry(iso2), [iso2]);
  const isOther = iso2 === OTHER_VALUE;

  const customCleaned = cleanCustom(custom);
  const customInvalid =
    isOther && customCleaned.length > 0 && !E164_RE.test(customCleaned);
  const nationalInvalid =
    !isOther &&
    country !== undefined &&
    national.length > 0 &&
    !E164_RE.test(buildE164(country, national));
  const phoneInvalid = customInvalid || nationalInvalid;

  // Compute the E.164 value + validity from the current selection and emit
  // it. Called directly from each event handler — avoids a useEffect that
  // would re-fire on every parent render (the parent rarely memoises
  // `onChange`). An empty national/custom is considered valid because phone
  // is optional in the schema.
  function emit(
    nextIso2: string,
    nextNational: string,
    nextCustom: string,
  ): void {
    if (nextIso2 === OTHER_VALUE) {
      const cleaned = cleanCustom(nextCustom);
      if (!cleaned) {
        onChange("", true);
        return;
      }
      onChange(cleaned, E164_RE.test(cleaned));
      return;
    }
    const nextCountry = getPhoneCountry(nextIso2);
    if (!nextCountry) {
      onChange("", true);
      return;
    }
    const e164 = buildE164(nextCountry, nextNational);
    onChange(e164, e164 === "" || E164_RE.test(e164));
  }

  const sortedCountries = useMemo(() => {
    const pinned = ["CM", "SN", "CI", "FR"];
    const pinnedSet = new Set(pinned);
    const head = pinned
      .map((code) => PHONE_COUNTRIES.find((c) => c.iso2 === code))
      .filter((c): c is PhoneCountry => Boolean(c));
    const rest = PHONE_COUNTRIES.filter((c) => !pinnedSet.has(c.iso2)).sort(
      (a, b) => a.name[locale].localeCompare(b.name[locale], locale),
    );
    return { head, rest };
  }, [locale]);

  function handleSelect(nextIso2: string) {
    setIso2(nextIso2);
    setOpen(false);
    emit(nextIso2, national, custom);
    requestAnimationFrame(() => {
      if (nextIso2 === OTHER_VALUE) customInputRef.current?.focus();
      else nationalInputRef.current?.focus();
    });
  }

  function handleNationalChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setNational(value);
    emit(iso2, value, custom);
  }

  function handleCustomChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setCustom(value);
    emit(iso2, national, value);
  }

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>

      <div
        className={cn(
          "flex items-stretch rounded-xl border bg-ganitel-neutral-1 transition-all",
          phoneInvalid
            ? "border-red-500/60 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20"
            : "border-ganitel-stroke-neutral focus-within:border-ganitel-secondary focus-within:ring-2 focus-within:ring-ganitel-secondary/20",
        )}
      >
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger
            type="button"
            aria-label={t("join.phone.country.aria")}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-l-xl pl-3.5 pr-2.5 text-sm text-ganitel-text-title",
              "border-r border-ganitel-stroke-neutral hover:bg-ganitel-neutral-2 transition-colors",
              "focus:outline-none focus-visible:bg-ganitel-neutral-2",
            )}
          >
            {isOther ? (
              <>
                <Globe
                  className="size-4 text-ganitel-text-placeholder"
                  aria-hidden
                />
                <span className="font-medium">
                  {t("join.phone.country.other_short")}
                </span>
              </>
            ) : (
              <>
                <span className="text-base leading-none" aria-hidden>
                  {country?.flag}
                </span>
                <span className="font-medium tabular-nums">
                  +{country?.dialCode}
                </span>
              </>
            )}
            <ChevronDown
              className="size-4 text-ganitel-text-placeholder"
              aria-hidden
            />
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={8}
              className={cn(
                "z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-ganitel-stroke-neutral bg-white shadow-xl",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              )}
            >
              <CommandPrimitive
                loop
                filter={(itemValue, search) => {
                  if (itemValue === OTHER_VALUE) return 1;
                  if (!search) return 1;
                  return itemValue.toLowerCase().includes(search.toLowerCase())
                    ? 1
                    : 0;
                }}
                className="flex max-h-[min(22rem,60vh)] flex-col"
              >
                <div className="flex items-center gap-2 border-b border-ganitel-stroke-neutral px-3">
                  <Search
                    className="size-4 shrink-0 text-ganitel-text-placeholder"
                    aria-hidden
                  />
                  <CommandPrimitive.Input
                    placeholder={t("join.phone.country.search")}
                    className="h-11 w-full bg-transparent text-sm text-ganitel-text-title placeholder:text-ganitel-text-placeholder focus:outline-none"
                  />
                </div>

                <CommandPrimitive.List className="flex-1 overflow-y-auto overscroll-contain p-1">
                  <CommandPrimitive.Empty className="px-3 py-6 text-center text-sm text-ganitel-text-subtitle">
                    {t("join.phone.country.empty")}
                  </CommandPrimitive.Empty>

                  <CommandPrimitive.Group
                    heading=""
                    className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-ganitel-text-placeholder"
                  >
                    {sortedCountries.head.map((c) => (
                      <CountryItem
                        key={c.iso2}
                        country={c}
                        selected={iso2 === c.iso2}
                        locale={locale}
                        onSelect={handleSelect}
                      />
                    ))}
                  </CommandPrimitive.Group>

                  <CommandPrimitive.Separator className="my-1 h-px bg-ganitel-stroke-neutral" />

                  <CommandPrimitive.Group
                    heading={t("join.phone.country.all")}
                    className="**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:text-ganitel-text-placeholder"
                  >
                    {sortedCountries.rest.map((c) => (
                      <CountryItem
                        key={c.iso2}
                        country={c}
                        selected={iso2 === c.iso2}
                        locale={locale}
                        onSelect={handleSelect}
                      />
                    ))}
                  </CommandPrimitive.Group>

                  <CommandPrimitive.Separator className="my-1 h-px bg-ganitel-stroke-neutral" />

                  <CommandPrimitive.Item
                    value={OTHER_VALUE}
                    onSelect={() => handleSelect(OTHER_VALUE)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-ganitel-text-title outline-none data-[selected=true]:bg-ganitel-neutral-2"
                  >
                    <Globe
                      className="size-4 text-ganitel-text-placeholder"
                      aria-hidden
                    />
                    <span className="flex-1 font-medium">
                      {t("join.phone.country.other")}
                    </span>
                    {isOther && (
                      <Check
                        className="size-4 text-ganitel-secondary"
                        aria-hidden
                      />
                    )}
                  </CommandPrimitive.Item>
                </CommandPrimitive.List>
              </CommandPrimitive>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {isOther ? (
          <div className="relative flex-1">
            <Phone
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
              aria-hidden
            />
            <input
              ref={customInputRef}
              id={id}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={custom}
              onChange={handleCustomChange}
              placeholder="+44 7700 900123"
              className={cn(INNER_INPUT_CLASS, "rounded-r-xl py-3 pl-9 pr-3.5")}
            />
          </div>
        ) : (
          <input
            ref={nationalInputRef}
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={national}
            onChange={handleNationalChange}
            placeholder={t("join.phone.placeholder")}
            className={cn(INNER_INPUT_CLASS, "rounded-r-xl px-3.5 py-3")}
          />
        )}
      </div>

      {isOther ? (
        <p
          className={cn(
            "mt-1.5 text-xs",
            customInvalid ? "text-red-500" : "text-ganitel-text-placeholder",
          )}
        >
          {customInvalid
            ? t("join.phone.invalid")
            : t("join.phone.country.other_hint")}
        </p>
      ) : (
        nationalInvalid && (
          <p className="mt-1.5 text-xs text-red-500">
            {t("join.phone.invalid")}
          </p>
        )
      )}
    </div>
  );
}

interface CountryItemProps {
  country: PhoneCountry;
  selected: boolean;
  locale: "fr" | "en";
  onSelect: (iso2: string) => void;
}

function CountryItem({
  country,
  selected,
  locale,
  onSelect,
}: CountryItemProps) {
  const name = country.name[locale];
  const searchValue = `${country.iso2} ${name} +${country.dialCode}`;
  return (
    <CommandPrimitive.Item
      value={searchValue}
      onSelect={() => onSelect(country.iso2)}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-ganitel-text-title outline-none data-[selected=true]:bg-ganitel-neutral-2"
    >
      <span className="text-base leading-none" aria-hidden>
        {country.flag}
      </span>
      <span className="flex-1 truncate">{name}</span>
      <span className="tabular-nums text-ganitel-text-placeholder">
        +{country.dialCode}
      </span>
      {selected && (
        <Check className="size-4 text-ganitel-secondary" aria-hidden />
      )}
    </CommandPrimitive.Item>
  );
}
