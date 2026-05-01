type ViteEnv = {
  VITE_API_BASE_URL?: string;
  VITE_GOOGLE_MAPS_KEY?: string;
};

const raw = import.meta.env as unknown as ViteEnv;

export const env = {
  apiBaseUrl: raw.VITE_API_BASE_URL || "/api",
  googleMapsKey: raw.VITE_GOOGLE_MAPS_KEY ?? "",
} as const;
