// Tour-guide title catalog. Single source of truth for the keys + labels
// on the frontend.
//
// CONTRACT: these keys MUST stay in sync with the backend's
// `TITLE_OPTIONS` dict and `TitlePair` Literal in
// packages/backend/app/modules/team/schemas.py. The schema declares
// `extra="forbid"` on review patches, so a key the frontend sends but the
// backend doesn't know about will surface as a 422 — loud, not silent.
// (Backend-side, the matching pair is enforced by
// tests/unit/test_team_title_options.py.)
//
// To add a new title: append the key here AND in schemas.py, mirror the
// fr/en labels in TITLE_LABELS below AND in TITLE_OPTIONS server-side.
export const TITLE_KEYS = ["guide_touristique"] as const;
export type TitleKey = (typeof TITLE_KEYS)[number];

export const TITLE_LABELS: Record<TitleKey, { fr: string; en: string }> = {
  guide_touristique: { fr: "Guide touristique", en: "Tour guide" },
};
