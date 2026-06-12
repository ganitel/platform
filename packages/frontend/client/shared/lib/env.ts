type ViteEnv = {
  VITE_PAYMENT_PROVIDER?: string;
  VITE_PRELAUNCH_MODE?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

const raw = import.meta.env as unknown as ViteEnv;

export const env = {
  apiBaseUrl: "/api",
  paymentProvider:
    raw.VITE_PAYMENT_PROVIDER ?? (import.meta.env.PROD ? "tranzak" : "noop"),
  prelaunchMode: raw.VITE_PRELAUNCH_MODE === "true",
  supabaseUrl: raw.VITE_SUPABASE_URL ?? "",
  supabasePublishableKey: raw.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
} as const;
