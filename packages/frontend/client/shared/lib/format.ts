import type { Money } from "@/features/properties/types";
import type { Locale } from "@/shared/lib/i18n";

const localeMap: Record<Locale, string> = { fr: "fr-FR", en: "en-US" };

/** Currencies with no minor unit (XAF/XOF/RWF/UGX) — render with no decimals. */
const NO_DECIMAL_CURRENCIES = new Set(["XAF", "XOF", "RWF", "UGX"]);

export function formatMoney(money: Money, locale: Locale): string {
  const value = Number(money.amount);
  return new Intl.NumberFormat(localeMap[locale], {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: NO_DECIMAL_CURRENCIES.has(money.currency) ? 0 : 2,
  }).format(value);
}

export function formatDate(date: string | Date, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(localeMap[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
