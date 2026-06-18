type ViteEnv = {
  PROD?: boolean;
  VITE_PRELAUNCH_MODE?: string;
  VITE_PAYMENT_PROVIDER?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

const raw = import.meta.env as unknown as ViteEnv;

const PAYMENT_PROVIDERS = ["tranzak", "stripe", "noop"] as const;

export type PaymentProviderName = (typeof PAYMENT_PROVIDERS)[number];

export function paymentProviderFromEnv(
  value: string | undefined,
  isProduction: boolean,
): PaymentProviderName {
  if (PAYMENT_PROVIDERS.includes(value as PaymentProviderName)) {
    return value as PaymentProviderName;
  }
  return isProduction ? "tranzak" : "noop";
}

export const env = {
  apiBaseUrl: "/api",
  prelaunchMode: raw.VITE_PRELAUNCH_MODE === "true",
  paymentProvider: paymentProviderFromEnv(raw.VITE_PAYMENT_PROVIDER, raw.PROD === true),
  supabaseUrl: raw.VITE_SUPABASE_URL ?? "",
  supabasePublishableKey: raw.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
} as const;
