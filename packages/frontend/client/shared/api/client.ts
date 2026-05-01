/**
 * Axios instance for the Ganitel backend.
 *
 * Auth: a better-auth JWT is attached per-request via setAuthTokenGetter().
 * The getter is registered once at app boot from entry.client.tsx.
 */

import axios, { AxiosError, type AxiosInstance } from "axios";

import { env } from "@/shared/lib/env";

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function setAuthTokenGetter(fn: TokenGetter): void {
  getToken = fn;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

apiClient.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    if (error.response) {
      const payload = error.response.data;
      const msg = payload?.detail ?? payload?.message ?? error.message;
      return Promise.reject(new ApiError(msg, error.response.status, payload));
    }
    return Promise.reject(new ApiError(error.message, 0, null));
  },
);
