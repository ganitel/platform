import type { TranslationKey } from "@/shared/lib/i18n";

/**
 * Maps backend error codes (RFC 7807 `title`) to i18n keys.
 * Used for business-validation 422s that aren't field-level
 * (e.g. image too large, unsupported type).
 */
export const TEAM_ERROR_CODE_KEYS: Record<string, TranslationKey> = {
  "image.too_large": "add_team.error.image_too_big",
  "image.type_unsupported": "add_team.error.image_type",
  "image.empty": "add_team.error.image_empty",
};

/**
 * Maps composite `"${field}.${pydanticType}"` keys to i18n keys.
 * Covers both the add-team and review forms since they share
 * the same backend validation constraints.
 */
export const TEAM_FIELD_ERROR_KEYS: Record<string, TranslationKey> = {
  "name.missing": "add_team.error.name_required",
  "name.string_too_short": "add_team.error.name_required",
  "name.string_too_long": "add_team.error.name_too_long",
  "bio_fr.missing": "add_team.error.bio_required",
  "bio_fr.string_too_short": "add_team.error.bio_required",
  "bio_fr.string_too_long": "add_team.error.bio_too_long",
  "city.missing": "add_team.error.city_required",
  "city.string_too_short": "add_team.error.city_required",
  "country.missing": "add_team.error.country_required",
  "country.string_too_short": "add_team.error.country_required",
  "age.missing": "add_team.error.age_invalid",
  "age.greater_than_equal": "add_team.error.age_invalid",
  "age.less_than_equal": "add_team.error.age_invalid",
  "image.missing": "add_team.error.image_required",
};
