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
  "nav.browse": { fr: "Découvrir", en: "Browse" },
  "nav.bookings": { fr: "Réservations", en: "Trips" },
  "nav.profile": { fr: "Profil", en: "Profile" },

  "landing.nav.properties": { fr: "Logements", en: "Properties" },
  "landing.nav.experiences": { fr: "Expériences", en: "Experiences" },
  "landing.tag.line1": { fr: "Logements", en: "Properties" },
  "landing.tag.line2": { fr: "& Séjours", en: "& Stays" },
  "landing.lede": {
    fr: "Des logements choisis dans des lieux calmes, et les expériences qui les entourent. Du Cameroun à la Côte d'Ivoire — trouvez où poser vos valises.",
    en: "Curated stays in quiet places, paired with the experiences that come with them. From Cameroon to Côte d'Ivoire — find where to settle in.",
  },
  "landing.title.line1": { fr: "Là où la lumière", en: "Stay where the" },
  "landing.title.line2_pre": { fr: "prend son", en: "light moves" },
  "landing.title.line2_em": { fr: "temps.", en: "slowly." },
  "landing.cta": { fr: "Découvrir les séjours", en: "Browse stays" },
  "landing.cta.hint": { fr: "Réservation immédiate", en: "Instant booking" },
  "landing.feature.tour": { fr: "Visite live", en: "Live tour" },
  "landing.feature.title": { fr: "Cabane Belledonne", en: "Belledonne Cabin" },
  "landing.feature.caption": {
    fr: "Une visite de douze minutes dans notre logement le plus aimé — perché au-dessus de la vallée, construit autour d'une seule fenêtre.",
    en: "A twelve-minute tour of our most-loved stay — perched above the valley, built around a single window.",
  },
  "landing.play": { fr: "Lancer la visite", en: "Play tour" },
  "landing.info": { fr: "Lire l'histoire de l'hôte", en: "Read the host story" },

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
