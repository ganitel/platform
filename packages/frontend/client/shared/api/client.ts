/**
 * Tiny fetch-based HTTP client for the Ganitel backend.
 *
 * Mirrors the small slice of axios we were using (`.get/.post/.patch/.delete`,
 * `{ data }` response shape, an `ApiError` thrown on non-2xx). Auth: a Supabase
 * session JWT is attached per-request via `setAuthTokenGetter()`, registered
 * once at app boot from entry.client.tsx.
 *
 * Body handling:
 * - `FormData` / `Blob` bodies are passed through untouched so the browser sets
 *   the right `Content-Type` (with multipart boundary).
 * - Plain objects are JSON-stringified with `application/json`.
 */

import { env } from "@/shared/lib/env";

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

export function setAuthTokenGetter(fn: TokenGetter): void {
  getToken = fn;
}

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

export interface ApiResponse<T> {
  data: T;
  status: number;
}

/** Lenient: anything serializable. Each value goes through `String(...)` at
 * request time, with `null`/`undefined` skipped and arrays expanded to
 * repeated keys (`?tag=a&tag=b`). */
export type QueryParams = Record<string, unknown>;

interface RequestConfig {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  params?: QueryParams;
}

function buildQueryString(params: QueryParams): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        usp.append(key, String(item));
      }
    } else {
      usp.append(key, String(value));
    }
  }
  const query = usp.toString();
  return query ? `?${query}` : "";
}

const DEFAULT_TIMEOUT_MS = 15_000;

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  config: RequestConfig | undefined,
): Promise<ApiResponse<T>> {
  const base = /^https?:/.test(path) ? path : `${env.apiBaseUrl}${path}`;
  const url = config?.params
    ? `${base}${buildQueryString(config.params)}`
    : base;
  const headers: Record<string, string> = { ...(config?.headers ?? {}) };

  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let init_body: BodyInit | undefined;
  if (body instanceof FormData || body instanceof Blob) {
    init_body = body;
  } else if (body !== undefined && body !== null) {
    init_body = JSON.stringify(body);
    if (!Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
      headers["Content-Type"] = "application/json";
    }
  }

  let signal = config?.signal;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (!signal) {
    const controller = new AbortController();
    timeoutId = setTimeout(
      () => controller.abort(),
      config?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    signal = controller.signal;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: init_body,
      signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") {
      throw new ApiError("Request timed out", 0, null);
    }
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new ApiError(message, 0, null);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const message =
      (typeof payload?.detail === "string" ? payload.detail : undefined) ??
      (typeof payload?.message === "string" ? payload.message : undefined) ??
      response.statusText ??
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return { data: undefined as T, status: response.status };
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? ((await response.json()) as T)
    : ((await response.text()) as unknown as T);

  return { data, status: response.status };
}

/**
 * Extract the RFC 7807 `title` (error code) from an ApiError.
 * Backend responses look like `{ title: "image.too_large", status: 422, … }`.
 * Returns `null` for non-ApiError or missing title.
 */
export function extractErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const payload = error.data as { title?: unknown } | null;
  if (typeof payload?.title === "string" && payload.title) return payload.title;
  return null;
}

export interface FieldError {
  field: string;
  type: string;
  msg: string;
}

/**
 * Extract structured field-level errors from an ApiError.
 *
 * Handles two backend patterns:
 * 1. **Pydantic array** — `extra: { errors: [{ loc, msg, type }] }`
 *    (FastAPI RequestValidationError).
 * 2. **Manual field error** — `extra: { field: "check_in_date" }` with a
 *    domain `code` in the RFC 7807 `title` (e.g. bookings, payments).
 *
 * Returns `null` for non-422 or errors that don't carry field info.
 */
export function extractFieldErrors(error: unknown): FieldError[] | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null;
  const payload = error.data as {
    extra?: { errors?: unknown; field?: unknown };
    title?: unknown;
    detail?: unknown;
  } | null;
  if (!payload) return null;

  const out: FieldError[] = [];

  const items = payload.extra?.errors ?? payload.detail;
  if (Array.isArray(items)) {
    for (const entry of items) {
      if (
        typeof entry !== "object" ||
        entry === null ||
        !Array.isArray(entry.loc) ||
        typeof entry.msg !== "string"
      )
        continue;
      const field = entry.loc[entry.loc.length - 1];
      const type = typeof entry.type === "string" ? entry.type : "unknown";
      if (typeof field === "string") out.push({ field, type, msg: entry.msg });
    }
  }

  if (
    out.length === 0 &&
    typeof payload.extra?.field === "string" &&
    typeof payload.title === "string"
  ) {
    out.push({
      field: payload.extra.field,
      type: payload.title,
      msg: typeof payload.detail === "string" ? payload.detail : payload.title,
    });
  }

  return out.length > 0 ? out : null;
}

export const apiClient = {
  get<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return request<T>("GET", path, undefined, config);
  },
  post<T>(
    path: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return request<T>("POST", path, body, config);
  },
  put<T>(
    path: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return request<T>("PUT", path, body, config);
  },
  patch<T>(
    path: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, body, config);
  },
  delete<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return request<T>("DELETE", path, undefined, config);
  },
};
