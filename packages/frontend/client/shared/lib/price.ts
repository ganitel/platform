import type { Money } from "@/features/properties/types";
import type { Locale } from "@/shared/lib/i18n";

const LOCALE_PREFERRED_CURRENCIES: Record<Locale, string[]> = {
  fr: ["XAF", "XOF", "EUR", "USD"],
  en: ["USD", "EUR", "XAF", "XOF"],
};

/** Pick the price entry whose currency best matches the user's locale.
 * Falls back to the first available price. Returns null only for empty lists.
 */
export function pickPriceForLocale<T extends Money>(
  prices: T[],
  locale: Locale,
): T | null {
  if (prices.length === 0) return null;
  const preferred = LOCALE_PREFERRED_CURRENCIES[locale] ?? [];
  for (const currency of preferred) {
    const match = prices.find((p) => p.currency === currency);
    if (match) return match;
  }
  return prices[0];
}

export function pickBasePriceForLocale<T extends Money & { group_size?: number }>(
  prices: T[],
  locale: Locale,
): T | null {
  return pickPriceForLocale(
    prices.filter((p) => (p.group_size ?? 1) === 1),
    locale,
  );
}
