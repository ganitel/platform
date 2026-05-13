import type { TranslationKey } from "@/shared/lib/i18n";

export const WAITLIST_FIELD_ERROR_KEYS: Record<string, TranslationKey> = {
  "email.missing": "join.error.email_required",
  "email.value_error": "join.error.email_invalid",
  "email.string_too_long": "join.error.email_invalid",
  "phone.phone_invalid": "join.error.phone_invalid",
  "phone.string_too_long": "join.error.phone_invalid",
  "headcount.greater_than_equal": "join.error.headcount_invalid",
  "headcount.less_than_equal": "join.error.headcount_invalid",
  "notes.string_too_long": "join.error.notes_too_long",
  "host_city.string_too_long": "join.error.host_city_too_long",
};
