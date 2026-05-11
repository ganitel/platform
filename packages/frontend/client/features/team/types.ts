// Tour-guide title catalog. Single source of truth for the keys + labels.
// Matches packages/backend/app/modules/team/schemas.py `TITLE_OPTIONS`.

export const TITLE_KEYS = ["guide_touristique"] as const;
export type TitleKey = (typeof TITLE_KEYS)[number];

export const TITLE_LABELS: Record<TitleKey, { fr: string; en: string }> = {
  guide_touristique: { fr: "Guide touristique", en: "Tour guide" },
};

// A pick from the photon.komoot.io autocomplete. We only keep the fields the
// form needs — city and country names from the picked feature's properties.
export interface LocationPick {
  city: string;
  country: string;
}
