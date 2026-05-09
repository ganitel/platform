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
  "nav.bookings": { fr: "Mes réservations", en: "My bookings" },
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
  "landing.info": {
    fr: "Lire l'histoire de l'hôte",
    en: "Read the host story",
  },
  "landing.scroll": { fr: "Faire défiler", en: "Scroll" },
  "landing.featured.tag": { fr: "Sélection · 2026", en: "Selection · 2026" },
  "landing.featured.title": { fr: "Une sélection,", en: "A short list," },
  "landing.featured.title_em": { fr: "un seul ton.", en: "one tone." },
  "landing.featured.lede": {
    fr: "Chaque logement est visité avant d'être listé. Si nous n'y dormirions pas, vous ne le trouverez pas ici.",
    en: "We visit every stay before it goes live. If we wouldn't sleep there, you won't find it here.",
  },
  "landing.featured.see_all": {
    fr: "Voir tous les logements",
    en: "See all stays",
  },
  "landing.cta_section.tag": { fr: "Prêt à partir ?", en: "Ready to go?" },
  "landing.cta_section.title": {
    fr: "Trouvez votre lieu,",
    en: "Find your place,",
  },
  "landing.cta_section.title_em": {
    fr: "à votre rythme.",
    en: "at your own pace.",
  },
  "footer.regions": {
    fr: "Cameroun · Sénégal · Côte d'Ivoire",
    en: "Cameroon · Senegal · Côte d'Ivoire",
  },

  "browse.title": { fr: "Explorer", en: "Explore" },
  "browse.tabs.stays": { fr: "Logements", en: "Stays" },
  "browse.tabs.experiences": { fr: "Expériences", en: "Experiences" },
  "browse.lede.stays": {
    fr: "Logements soigneusement sélectionnés au Cameroun, au Sénégal et en Côte d'Ivoire.",
    en: "Stays carefully selected in Cameroon, Senegal and Côte d'Ivoire.",
  },
  "browse.lede.experiences": {
    fr: "Des expériences à vivre autour de nos logements ou en escapade.",
    en: "Experiences worth the trip — around our stays or as standalone escapes.",
  },
  "browse.empty.stays": {
    fr: "Aucun logement ne correspond à votre recherche.",
    en: "No stays match your search.",
  },
  "browse.empty.experiences": {
    fr: "Les expériences arrivent bientôt.",
    en: "Experiences are coming soon.",
  },

  "property.guests": { fr: "voyageurs", en: "guests" },
  "property.bedrooms": { fr: "chambres", en: "bedrooms" },
  "property.beds": { fr: "lits", en: "beds" },
  "property.bathrooms": { fr: "salles de bain", en: "bathrooms" },
  "property.per_night": { fr: "par nuit", en: "per night" },
  "property.book": { fr: "Réserver", en: "Book" },
  "property.host": { fr: "Hôte", en: "Host" },
  "property.amenities": { fr: "Équipements", en: "Amenities" },
  "property.description": {
    fr: "À propos du logement",
    en: "About this place",
  },

  "booking.nights": { fr: "nuits", en: "nights" },
  "booking.check_in": { fr: "Arrivée", en: "Check-in" },
  "booking.check_out": { fr: "Départ", en: "Check-out" },
  "booking.select_dates": {
    fr: "Sélectionnez vos dates",
    en: "Select your dates",
  },
  "booking.signin_to_book": {
    fr: "Connectez-vous pour réserver",
    en: "Sign in to book",
  },
  "booking.confirmed": {
    fr: "Réservation confirmée !",
    en: "Booking confirmed!",
  },
  "booking.confirmed.detail": {
    fr: "Votre séjour est réservé. Consultez vos réservations pour les détails.",
    en: "Your stay is booked. Check your bookings for details.",
  },
  "booking.conflict": {
    fr: "Ces dates ne sont plus disponibles.",
    en: "Those dates are no longer available.",
  },
  "booking.status.pending_payment": {
    fr: "En attente de paiement",
    en: "Pending payment",
  },
  "booking.status.confirmed": { fr: "Confirmée", en: "Confirmed" },
  "booking.status.cancelled_by_guest": {
    fr: "Annulée par vous",
    en: "Cancelled by you",
  },
  "booking.status.cancelled_by_host": {
    fr: "Annulée par l'hôte",
    en: "Cancelled by host",
  },
  "booking.status.cancelled_expired": { fr: "Expirée", en: "Expired" },
  "booking.status.completed": { fr: "Terminée", en: "Completed" },
  "booking.status.disputed": { fr: "En litige", en: "Disputed" },
  "booking.night": { fr: "nuit", en: "night" },
  "booking.guest": { fr: "voyageur", en: "guest" },
  "booking.view_property": { fr: "Voir le logement", en: "View property" },
  "booking.empty": {
    fr: "Vous n'avez pas encore de réservation.",
    en: "You have no bookings yet.",
  },
  "booking.total": { fr: "Total", en: "Total" },
  "booking.remove_guest": { fr: "Retirer un voyageur", en: "Remove guest" },
  "booking.add_guest": { fr: "Ajouter un voyageur", en: "Add guest" },

  "experience.per_person": { fr: "par personne", en: "per person" },
  "experience.duration": { fr: "durée", en: "duration" },

  "prelaunch.banner": {
    fr: "Bientôt disponible — inscrivez-vous pour être parmi les premiers.",
    en: "Launching soon — sign up to be among the first.",
  },
  "prelaunch.banner.cta": { fr: "En savoir plus", en: "Learn more" },

  "waitlist.badge": { fr: "Bientôt disponible", en: "Launching soon" },
  "waitlist.headline": {
    fr: "Soyez parmi les premiers",
    en: "Be among the first",
  },
  "waitlist.sub": {
    fr: "Laissez votre e-mail et nous vous contacterons dès l'ouverture des réservations.",
    en: "Leave your email and we'll reach out as soon as bookings open.",
  },
  "waitlist.email": { fr: "Votre adresse e-mail", en: "Your email address" },
  "waitlist.name": {
    fr: "Votre prénom (optionnel)",
    en: "Your first name (optional)",
  },
  "waitlist.submit": { fr: "M'inscrire", en: "Join the list" },
  "waitlist.submitting": { fr: "Inscription…", en: "Joining…" },
  "waitlist.success.title": {
    fr: "Vous êtes inscrit !",
    en: "You're on the list!",
  },
  "waitlist.success.detail": {
    fr: "Nous vous contacterons en priorité pour ce logement dès l'ouverture.",
    en: "We'll reach out to you first when this place opens for bookings.",
  },
  "waitlist.success.detail.experience": {
    fr: "Nous vous contacterons en priorité pour cette expérience dès l'ouverture.",
    en: "We'll reach out to you first when this experience opens.",
  },
  "waitlist.error": {
    fr: "Une erreur s'est produite. Réessayez.",
    en: "Something went wrong. Please try again.",
  },
  "waitlist.price_note": {
    fr: "À partir de",
    en: "Starting from",
  },

  "join.subtitle": { fr: "Liste d'attente", en: "Waitlist" },
  "join.title": { fr: "Rejoignez Ganitel", en: "Join Ganitel" },
  "join.email": { fr: "Votre adresse e-mail", en: "Your email address" },
  "join.interest.label": {
    fr: "Je suis intéressé par",
    en: "I'm interested in",
  },
  "join.interest.renting": { fr: "Locations", en: "Rentals" },
  "join.interest.experiences": { fr: "Expériences", en: "Experiences" },
  "join.headcount.label": {
    fr: "Pour combien de personnes ?",
    en: "For how many people?",
  },
  "join.headcount.placeholder": { fr: "Ex. 2", en: "e.g. 2" },
  "join.budget.label": { fr: "Budget estimé", en: "Estimated budget" },
  "join.budget.placeholder": {
    fr: "Sélectionnez une tranche",
    en: "Select a range",
  },
  "join.budget.under_50k": {
    fr: "Moins de 50 000 XAF",
    en: "Under 50,000 XAF",
  },
  "join.budget.50k_150k": {
    fr: "50 000 – 150 000 XAF",
    en: "50,000 – 150,000 XAF",
  },
  "join.budget.150k_300k": {
    fr: "150 000 – 300 000 XAF",
    en: "150,000 – 300,000 XAF",
  },
  "join.budget.300k_500k": {
    fr: "300 000 – 500 000 XAF",
    en: "300,000 – 500,000 XAF",
  },
  "join.budget.over_500k": {
    fr: "Plus de 500 000 XAF",
    en: "Over 500,000 XAF",
  },
  "join.notes.label": {
    fr: "Informations complémentaires (optionnel)",
    en: "Anything else you'd like to share (optional)",
  },
  "join.notes.placeholder": {
    fr: "Dates souhaitées, type de logement, questions…",
    en: "Preferred dates, type of stay, questions…",
  },
  "join.submit": { fr: "Rejoindre Ganitel", en: "Join Ganitel" },
  "join.submitting": { fr: "Inscription…", en: "Joining…" },
  "join.error": {
    fr: "Une erreur s'est produite. Réessayez.",
    en: "Something went wrong. Please try again.",
  },
  "join.success.title": {
    fr: "Vous êtes sur la liste !",
    en: "You're on the list!",
  },
  "join.success.detail": {
    fr: "Nous vous contacterons dès l'ouverture. Merci de votre confiance.",
    en: "We'll reach out as soon as we launch. Thank you for your trust.",
  },
  "join.success.back": { fr: "Retour à l'accueil", en: "Back to home" },
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
