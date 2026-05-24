import { ApiError } from "@/shared/api/client";
import type { TranslationKey } from "@/shared/lib/i18n";

const PUBLISH_NOT_READY_CODES = new Set([
  "property.not_ready",
  "experience.not_ready",
]);

export interface PublishIssue {
  field: string;
  reason: string;
  key: TranslationKey | null;
}

const ISSUE_KEYS: Record<string, TranslationKey> = {
  "title:missing": "admin.publish_error.title.missing",
  "prices:empty": "admin.publish_error.base_price_amount.not_positive",
  "photos:empty": "admin.publish_error.photos.empty",
};

export function extractPublishIssues(error: unknown): PublishIssue[] | null {
  if (!(error instanceof ApiError)) return null;
  const payload = error.data as {
    title?: unknown;
    extra?: { issues?: unknown };
  } | null;
  if (!payload || typeof payload.title !== "string") return null;
  if (!PUBLISH_NOT_READY_CODES.has(payload.title)) return null;
  const issues = payload.extra?.issues;
  if (!issues || typeof issues !== "object") return null;

  const out: PublishIssue[] = [];
  for (const [field, reason] of Object.entries(issues)) {
    if (typeof reason !== "string") continue;
    out.push({
      field,
      reason,
      key: ISSUE_KEYS[`${field}:${reason}`] ?? null,
    });
  }
  return out.length > 0 ? out : null;
}
