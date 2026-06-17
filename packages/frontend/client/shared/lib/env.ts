type ViteEnv = {
  VITE_PAYMENT_PROVIDER?: string;
  VITE_PRELAUNCH_MODE?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

const raw = import.meta.env as unknown as ViteEnv;

export type PaymentProviderName = "tranzak" | "stripe" | "noop";

export function resolvePaymentProvider(
  provider: string | undefined,
  isProduction: boolean,
): PaymentProviderName {
  const fallback = isProduction ? "tranzak" : "noop";
  const normalized = provider?.toLowerCase();
  if (
    normalized === "tranzak" ||
    normalized === "stripe" ||
    normalized === "noop"
  ) {
    return normalized;
  }
  return fallback;
}

export const env = {
  apiBaseUrl: "/api",
  paymentProvider: resolvePaymentProvider(
    raw.VITE_PAYMENT_PROVIDER,
    import.meta.env.PROD,
  ),
  prelaunchMode: raw.VITE_PRELAUNCH_MODE === "true",
  supabaseUrl: raw.VITE_SUPABASE_URL ?? "",
  supabasePublishableKey: raw.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
} as const;
