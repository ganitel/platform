type ViteEnv = {
  VITE_API_BASE_URL?: string;
  VITE_CLERK_PUBLISHABLE_KEY?: string;
  VITE_GOOGLE_MAPS_KEY?: string;
};

const raw = import.meta.env as unknown as ViteEnv;

function required(name: keyof ViteEnv): string {
  const v = raw[name];
  if (!v) throw new Error(`Missing env: ${String(name)}`);
  return v;
}

export const env = {
  apiBaseUrl: raw.VITE_API_BASE_URL || "/api",
  clerkPublishableKey: required("VITE_CLERK_PUBLISHABLE_KEY"),
  googleMapsKey: raw.VITE_GOOGLE_MAPS_KEY ?? "",
} as const;
