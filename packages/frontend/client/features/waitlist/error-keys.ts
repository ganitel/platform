import type { TranslationKey } from "@/shared/lib/i18n";

export const WAITLIST_FIELD_ERROR_KEYS: Record<string, TranslationKey> = {
  "email.missing": "join.error.email_required",
  "email.value_error": "join.error.email_invalid",
  "email.string_too_long": "join.error.email_invalid",
  "phone.phone_invalid": "join.error.phone_invalid",
  "phone.string_too_long": "join.error.phone_invalid",
  "travel_start.travel_start_invalid": "join.error.travel_start_invalid",
  "travel_end.travel_end_invalid": "join.error.travel_end_invalid",
  "adults.greater_than_equal": "join.error.adults_invalid",
  "adults.less_than_equal": "join.error.adults_invalid",
  "children.greater_than_equal": "join.error.children_invalid",
  "children.less_than_equal": "join.error.children_invalid",
  "notes.string_too_long": "join.error.notes_too_long",
  "host_city.string_too_long": "join.error.host_city_too_long",
};
