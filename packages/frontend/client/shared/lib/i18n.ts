/**
 * Tiny fr/en translation helper. Stays inline until the project has enough
 * copy to justify pulling in a real i18n library.
 */

import { createContext, useContext } from "react";

export type Locale = "fr" | "en";

type Dict = Record<string, { fr: string; en: string }>;

const dict = {
  "common.search": { fr: "Rechercher", en: "Search" },
  "common.loading": { fr: "Chargement…", en: "Loading…" },
  "common.error.generic": {
    fr: "Une erreur s'est produite. Veuillez réessayer.",
    en: "Something went wrong. Please try again.",
  },
  "common.retry": { fr: "Réessayer", en: "Retry" },
  "common.signin": { fr: "Se connecter", en: "Sign in" },
  "common.signup": { fr: "S'inscrire", en: "Sign up" },
  "common.signout": { fr: "Se déconnecter", en: "Sign out" },

  "nav.home": { fr: "Accueil", en: "Home" },
  "nav.bookings": { fr: "Réservations", en: "Trips" },
  "nav.profile": { fr: "Profil", en: "Profile" },

  "browse.title": { fr: "Explorer", en: "Explore" },
  "browse.subtitle": {
    fr: "Séjours et expériences soigneusement sélectionnés.",
    en: "Stays and experiences, carefully curated.",
  },
  "browse.empty": {
    fr: "Aucun logement ne correspond à votre recherche.",
    en: "No properties match your search.",
  },

  "property.guests": { fr: "voyageurs", en: "guests" },
  "property.bedrooms": { fr: "chambres", en: "bedrooms" },
  "property.beds": { fr: "lits", en: "beds" },
  "property.bathrooms": { fr: "salles de bain", en: "bathrooms" },
  "property.per_night": { fr: "par nuit", en: "per night" },
  "property.book": { fr: "Réserver", en: "Book" },
  "property.host": { fr: "Hôte", en: "Host" },
  "property.amenities": { fr: "Équipements", en: "Amenities" },
  "property.description": { fr: "À propos du logement", en: "About this place" },
} satisfies Dict;

export type TranslationKey = keyof typeof dict;

export const LocaleContext = createContext<Locale>("fr");

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function t(key: TranslationKey, locale: Locale): string {
  return dict[key][locale];
}

export function useT() {
  const locale = useLocale();
  return (key: TranslationKey) => t(key, locale);
}
