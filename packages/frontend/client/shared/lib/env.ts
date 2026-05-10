type ViteEnv = {
  VITE_API_BASE_URL?: string;
  VITE_PRELAUNCH_MODE?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

const raw = import.meta.env as unknown as ViteEnv;

export const env = {
  apiBaseUrl: raw.VITE_API_BASE_URL || "/api",
  prelaunchMode: raw.VITE_PRELAUNCH_MODE === "true",
  supabaseUrl: raw.VITE_SUPABASE_URL ?? "",
  supabasePublishableKey: raw.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
} as const;
