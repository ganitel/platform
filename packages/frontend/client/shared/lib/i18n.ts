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
  "experience.guide": { fr: "Votre guide", en: "Your guide" },

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
  "waitlist.phone": {
    fr: "Votre numéro WhatsApp (optionnel)",
    en: "Your WhatsApp number (optional)",
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
  "waitlist.success.email": {
    fr: "Un e-mail de confirmation est en route — vérifiez votre boîte de réception.",
    en: "A confirmation email is on its way — check your inbox.",
  },
  "waitlist.error": {
    fr: "Une erreur s'est produite. Réessayez.",
    en: "Something went wrong. Please try again.",
  },
  "waitlist.price_note": {
    fr: "À partir de",
    en: "Starting from",
  },

  "auth.layout.tagline": {
    fr: "Séjours et expériences en Afrique centrale, choisis avec soin.",
    en: "Stays and experiences in Central Africa, chosen with care.",
  },

  "join.subtitle": { fr: "Liste d'attente", en: "Waitlist" },
  "join.title": { fr: "Rejoignez ganitel", en: "Join ganitel" },
  "join.email": { fr: "Votre adresse e-mail", en: "Your email address" },
  "join.phone": {
    fr: "Votre numéro WhatsApp (optionnel)",
    en: "Your WhatsApp number (optional)",
  },
  "phone.placeholder": {
    fr: "6 12 34 56 78",
    en: "6 12 34 56 78",
  },
  "phone.country.aria": {
    fr: "Choisir le pays",
    en: "Choose country",
  },
  "phone.country.search": {
    fr: "Rechercher un pays…",
    en: "Search a country…",
  },
  "phone.country.empty": {
    fr: "Aucun pays trouvé. Choisissez « Autre » pour un autre indicatif.",
    en: "No country found. Pick “Other” for another code.",
  },
  "phone.country.suggested": {
    fr: "Suggérés",
    en: "Suggested",
  },
  "phone.country.all": {
    fr: "Tous les pays",
    en: "All countries",
  },
  "phone.country.other": {
    fr: "Autre pays (saisie manuelle)",
    en: "Other country (manual entry)",
  },
  "phone.country.other_short": {
    fr: "Autre",
    en: "Other",
  },
  "phone.country.other_hint": {
    fr: "Saisissez le numéro au format international, ex. +44 7700 900123",
    en: "Enter the number in international format, e.g. +44 7700 900123",
  },
  "phone.invalid": {
    fr: "Numéro invalide. Commencez par + suivi de l'indicatif pays.",
    en: "Invalid number. Start with + followed by the country code.",
  },
  "join.role.label": {
    fr: "Vous êtes…",
    en: "You are…",
  },
  "join.role.traveler": {
    fr: "En tant que voyageur",
    en: "As a traveler",
  },
  "join.role.host": {
    fr: "En tant qu'hôte",
    en: "As a host",
  },
  "join.host.interest.label": {
    fr: "Que voulez-vous proposer ?",
    en: "What do you want to host?",
  },
  "join.host.city.label": {
    fr: "Ville",
    en: "City",
  },
  "join.host.city.placeholder": {
    fr: "Ex. Douala, Yaoundé, Limbe",
    en: "e.g. Douala, Yaoundé, Limbe",
  },
  "join.host.inventory.label": {
    fr: "Combien de biens ou d'expériences ?",
    en: "How many properties or experiences?",
  },
  "join.host.inventory.placeholder": {
    fr: "Sélectionnez",
    en: "Select one",
  },
  "join.host.inventory.1": { fr: "1", en: "1" },
  "join.host.inventory.2_5": { fr: "2 à 5", en: "2 to 5" },
  "join.host.inventory.6_10": { fr: "6 à 10", en: "6 to 10" },
  "join.host.inventory.10_plus": { fr: "Plus de 10", en: "More than 10" },
  "join.host.status.label": {
    fr: "Où en êtes-vous ?",
    en: "Where are you in your project?",
  },
  "join.host.status.placeholder": {
    fr: "Sélectionnez",
    en: "Select one",
  },
  "join.host.status.ready": {
    fr: "Déjà prêt à recevoir",
    en: "Ready to host",
  },
  "join.host.status.under_construction": {
    fr: "En construction",
    en: "Under construction",
  },
  "join.host.status.planning": {
    fr: "En projet",
    en: "Planning",
  },
  "join.host.status.just_exploring": {
    fr: "Je me renseigne",
    en: "Just exploring",
  },
  "join.interest.label": {
    fr: "Je suis intéressé par",
    en: "I'm interested in",
  },
  "join.interest.renting": { fr: "Locations", en: "Rentals" },
  "join.interest.experiences": { fr: "Expériences", en: "Experiences" },
  "join.interest.both": { fr: "Les deux", en: "Both" },
  "join.headcount.label": {
    fr: "Pour combien de personnes ?",
    en: "For how many people?",
  },
  "join.headcount.placeholder": { fr: "Ex. 2", en: "e.g. 2" },
  "join.travel.label": { fr: "Dates de voyage", en: "Travel dates" },
  "join.travel.start.label": { fr: "Arrivée", en: "Arrival" },
  "join.travel.start.placeholder": {
    fr: "Choisir une date",
    en: "Pick a date",
  },
  "join.travel.end.label": { fr: "Départ", en: "Departure" },
  "join.travel.end.placeholder": { fr: "Choisir une date", en: "Pick a date" },
  "join.travelers.label": { fr: "Voyageurs", en: "Travelers" },
  "join.travelers.adults.label": { fr: "Adultes", en: "Adults" },
  "join.travelers.adults.hint": { fr: "13 ans et plus", en: "13 and older" },
  "join.travelers.children.label": { fr: "Enfants", en: "Children" },
  "join.travelers.children.hint": { fr: "2 à 12 ans", en: "2 to 12" },
  "join.travelers.decrement": { fr: "Diminuer", en: "Decrease" },
  "join.travelers.increment": { fr: "Augmenter", en: "Increase" },
  "join.budget.label": {
    fr: "Budget estimé par personne",
    en: "Estimated budget per person",
  },
  "join.budget.placeholder": {
    fr: "Sélectionnez une tranche",
    en: "Select a range",
  },
  "join.budget.currency.label": { fr: "Devise", en: "Currency" },
  "join.budget.currency.xaf": { fr: "XAF (FCFA)", en: "XAF (FCFA)" },
  "join.budget.currency.eur": { fr: "Euros (€)", en: "Euros (€)" },
  "join.budget.currency.usd": { fr: "Dollars ($)", en: "US dollars ($)" },
  "join.budget.xaf.under_50k": {
    fr: "Moins de 50 000 XAF",
    en: "Under 50,000 XAF",
  },
  "join.budget.xaf.50k_150k": {
    fr: "50 000 - 150 000 XAF",
    en: "50,000 - 150,000 XAF",
  },
  "join.budget.xaf.150k_300k": {
    fr: "150 000 - 300 000 XAF",
    en: "150,000 - 300,000 XAF",
  },
  "join.budget.xaf.300k_500k": {
    fr: "300 000 - 500 000 XAF",
    en: "300,000 - 500,000 XAF",
  },
  "join.budget.xaf.over_500k": {
    fr: "Plus de 500 000 XAF",
    en: "Over 500,000 XAF",
  },
  "join.budget.eur.under_50k": {
    fr: "Moins de 100 €",
    en: "Under €100",
  },
  "join.budget.eur.50k_150k": {
    fr: "100 € - 300 €",
    en: "€100 - €300",
  },
  "join.budget.eur.150k_300k": {
    fr: "300 € - 500 €",
    en: "€300 - €500",
  },
  "join.budget.eur.300k_500k": {
    fr: "500 € - 1 000 €",
    en: "€500 - €1,000",
  },
  "join.budget.eur.over_500k": {
    fr: "Plus de 1 000 €",
    en: "Over €1,000",
  },
  "join.budget.usd.under_50k": {
    fr: "Moins de 100 $",
    en: "Under $100",
  },
  "join.budget.usd.50k_150k": {
    fr: "100 $ - 300 $",
    en: "$100 - $300",
  },
  "join.budget.usd.150k_300k": {
    fr: "300 $ - 500 $",
    en: "$300 - $500",
  },
  "join.budget.usd.300k_500k": {
    fr: "500 $ - 1 000 $",
    en: "$500 - $1,000",
  },
  "join.budget.usd.over_500k": {
    fr: "Plus de 1 000 $",
    en: "Over $1,000",
  },
  "join.notes.label": {
    fr: "Informations complémentaires (optionnel)",
    en: "Anything else you'd like to share (optional)",
  },
  "join.notes.placeholder": {
    fr: "Dates souhaitées, type de logement, questions…",
    en: "Preferred dates, type of stay, questions…",
  },
  "join.submit": { fr: "Rejoindre ganitel", en: "Join ganitel" },
  "join.submitting": { fr: "Inscription…", en: "Joining…" },
  "join.error": {
    fr: "Une erreur s'est produite. Réessayez.",
    en: "Something went wrong. Please try again.",
  },
  "join.error.network": {
    fr: "Connexion impossible. Vérifiez votre réseau et réessayez.",
    en: "Could not reach the server. Check your connection and try again.",
  },
  "join.error.timeout": {
    fr: "Le serveur met plus de temps que d'habitude. Réessayez dans un instant.",
    en: "The server is taking longer than usual. Please try again in a moment.",
  },
  "join.error.email_required": {
    fr: "L'email est requis.",
    en: "Email is required.",
  },
  "join.error.email_invalid": {
    fr: "Cet email n'est pas valide.",
    en: "This email is not valid.",
  },
  "join.error.phone_invalid": {
    fr: "Le numéro de téléphone n'est pas valide. Format attendu : +237612345678.",
    en: "Phone number is not valid. Expected format: +237612345678.",
  },
  "join.error.headcount_invalid": {
    fr: "Le nombre de personnes doit être entre 1 et 500.",
    en: "Number of people must be between 1 and 500.",
  },
  "join.error.travel_start_invalid": {
    fr: "Date d'arrivée invalide.",
    en: "Invalid arrival date.",
  },
  "join.error.travel_end_invalid": {
    fr: "La date de départ doit être après l'arrivée.",
    en: "Departure must be after arrival.",
  },
  "join.error.adults_invalid": {
    fr: "Au moins un adulte.",
    en: "At least one adult.",
  },
  "join.error.children_invalid": {
    fr: "Nombre d'enfants invalide.",
    en: "Invalid number of children.",
  },
  "join.error.notes_too_long": {
    fr: "Le message est trop long (max 1000 caractères).",
    en: "Your message is too long (max 1000 characters).",
  },
  "join.error.host_city_too_long": {
    fr: "Le nom de ville est trop long.",
    en: "City name is too long.",
  },
  "join.error.details": {
    fr: "Détails techniques",
    en: "Technical details",
  },
  "join.success.title": {
    fr: "Vous êtes sur la liste !",
    en: "You're on the list!",
  },
  "join.success.detail": {
    fr: "Nous vous contacterons dès l'ouverture. Merci de votre confiance.",
    en: "We'll reach out as soon as we launch. Thank you for your trust.",
  },
  "join.success.email": {
    fr: "Un e-mail de confirmation est en route — vérifiez votre boîte de réception.",
    en: "A confirmation email is on its way — check your inbox.",
  },
  "join.success.back": { fr: "Retour à l'accueil", en: "Back to home" },

  "nav.about": { fr: "Qui sommes-nous ?", en: "About us" },
  "about.tag": { fr: "Notre histoire", en: "Our story" },
  "about.title": {
    fr: "Nous aimons le Cameroun —",
    en: "We love Cameroon —",
  },
  "about.title_em": { fr: "chaque recoin.", en: "every corner of it." },
  "about.lede": {
    fr: "De la côte volcanique du Sud-Ouest aux plateaux de l'Adamaoua, des forêts de l'Est à l'agitation de Douala — le Cameroun, c'est des dizaines de pays sous un même drapeau, et nous voulons que vous le ressentiez.",
    en: "From the volcanic coast of the South-West to the highlands of the Adamawa, the rainforests of the East to the bustle of Douala — Cameroon is dozens of countries living under one flag, and we want you to feel it.",
  },
  "about.statement": {
    fr: "En collaborant avec des partenaires locaux d'élite à travers des destinations triées sur le volet, un réseau de guides certifiés et des leaders du transport de confiance, nous garantissons sécurité, confort et une expérience unique sans égal.",
    en: "By collaborating with elite local partners across hand-picked destinations, a network of certified tour guides, and trusted transportation leaders, we guarantee security, convenience, and a unique experience that is second to none.",
  },
  "about.promise.security": { fr: "Sécurité", en: "Security" },
  "about.promise.convenience": { fr: "Confort", en: "Convenience" },
  "about.promise.verified": {
    fr: "Partenaires vérifiés",
    en: "Verified Partners",
  },
  "about.promise.premium": {
    fr: "Expériences d'exception",
    en: "Premium Experiences",
  },
  "about.impact.title": {
    fr: "Un impact centré sur l'humain",
    en: "Human-Centric Impact",
  },
  "about.impact.body": {
    fr: "Notre service permet à des milliers de professionnels de se libérer enfin du burn-out et de retrouver leur poste véritablement ressourcés. En restaurant l'énergie des équipes, nous évitons aux entreprises des milliards de revenus perdus en performance dégradée — et nous contribuons directement à la croissance du PIB africain.",
    en: "Our service ensures that thousands of professionals can finally get rid of work-burnout and return to their workplaces properly rejuvenated. By restoring workforce energy, we are saving businesses billions in revenue lost due to low performance and directly improving Africa's GDP.",
  },
  "about.vision.title": { fr: "Notre vision", en: "Our Vision" },
  "about.vision.body": {
    fr: "Faire de l'Afrique la destination la plus accessible au monde pour le renouveau mental et émotionnel.",
    en: "To make Africa the world's most accessible destination for mental and emotional renewal.",
  },
  "about.team.tag": { fr: "L'équipe", en: "The team" },
  "about.team.title": {
    fr: "Les visages derrière",
    en: "The people behind",
  },
  "about.team.title_em": { fr: "ganitel.", en: "ganitel." },
  "about.team.lede": {
    fr: "Une petite équipe basée entre le Cameroun et l'Europe, rejointe par des guides locaux qui connaissent leur région mieux que personne.",
    en: "A small team between Cameroon and Europe, joined by local guides who know their region better than anyone.",
  },
  "about.closing.tag": { fr: "Prêt à partir ?", en: "Ready to go?" },
  "about.closing": {
    fr: "Venez pour un séjour. Repartez avec une histoire.",
    en: "Come for a stay. Leave with a story.",
  },
  "about.cta": { fr: "Découvrir les séjours", en: "Browse stays" },

  "add_team.title": {
    fr: "Rejoindre l'équipe ganitel",
    en: "Join the ganitel team",
  },
  "add_team.subtitle": {
    fr: "Présentez-vous. Un membre de l'équipe vérifiera votre profil avant de le publier.",
    en: "Tell us about yourself. A team member will review your profile before it goes live.",
  },
  "add_team.image.label": { fr: "Photo de profil", en: "Profile photo" },
  "add_team.image.placeholder": {
    fr: "Choisir une photo",
    en: "Choose a photo",
  },
  "add_team.image.hint": {
    fr: "JPEG, PNG ou WebP — 5 Mo maximum",
    en: "JPEG, PNG, or WebP — 5 MB max",
  },
  "add_team.name.label": { fr: "Nom complet", en: "Full name" },
  "add_team.name.placeholder": {
    fr: "Jean Mbarga",
    en: "Jean Mbarga",
  },
  "add_team.location.label": { fr: "Ville", en: "City" },
  "add_team.location.placeholder": {
    fr: "Commencez à taper, ex. Douala",
    en: "Start typing, e.g. Douala",
  },
  "add_team.age.label": { fr: "Âge", en: "Age" },
  "add_team.age.placeholder": { fr: "28", en: "28" },
  "add_team.bio.label": { fr: "À propos de vous", en: "About you" },
  "add_team.bio.placeholder": {
    fr: "Racontez votre parcours, votre région, ce que vous voulez partager avec les voyageurs.",
    en: "Tell us about your background, your region, what you want to share with travelers.",
  },
  "add_team.bio.hint": {
    fr: "Minimum 10 caractères. Cette description s'affichera sur la page À propos.",
    en: "10 characters minimum. This will appear on the About page.",
  },
  "add_team.submit": { fr: "Envoyer ma candidature", en: "Submit my profile" },
  "add_team.submitting": { fr: "Envoi…", en: "Sending…" },
  "add_team.success.title": {
    fr: "Candidature envoyée !",
    en: "Submission received!",
  },
  "add_team.success.detail": {
    fr: "Un administrateur va vérifier votre profil. Vous serez bientôt visible sur la page À propos.",
    en: "An admin will review your profile. You'll appear on the About page shortly.",
  },
  "add_team.success.back": { fr: "Retour à l'accueil", en: "Back to home" },
  "add_team.error.image_too_big": {
    fr: "L'image dépasse 5 Mo. Choisissez un fichier plus léger.",
    en: "Image is larger than 5 MB. Pick a smaller file.",
  },
  "add_team.error.image_type": {
    fr: "Format d'image non pris en charge. JPEG, PNG ou WebP uniquement.",
    en: "Unsupported image format. JPEG, PNG, or WebP only.",
  },
  "add_team.error.name_required": {
    fr: "Le nom est requis.",
    en: "Name is required.",
  },
  "add_team.error.name_too_long": {
    fr: "Le nom ne doit pas dépasser 120 caractères.",
    en: "Name must be 120 characters or fewer.",
  },
  "add_team.error.bio_required": {
    fr: "La biographie est requise (10 caractères minimum).",
    en: "Bio is required (10 characters minimum).",
  },
  "add_team.error.bio_too_long": {
    fr: "La biographie ne doit pas dépasser 2 000 caractères.",
    en: "Bio must be 2,000 characters or fewer.",
  },
  "add_team.error.city_required": {
    fr: "La ville est requise.",
    en: "City is required.",
  },
  "add_team.error.country_required": {
    fr: "Le pays est requis.",
    en: "Country is required.",
  },
  "add_team.error.age_invalid": {
    fr: "L'âge doit être compris entre 16 et 100 ans.",
    en: "Age must be between 16 and 100.",
  },
  "add_team.error.image_required": {
    fr: "Une photo est requise.",
    en: "A photo is required.",
  },
  "add_team.error.image_empty": {
    fr: "Le fichier image est vide.",
    en: "Image file is empty.",
  },
  "add_team.error.generic": {
    fr: "Une erreur s'est produite. Veuillez réessayer.",
    en: "Something went wrong. Please try again.",
  },
  "add_team.error.network": {
    fr: "Connexion impossible. Vérifiez votre réseau et réessayez.",
    en: "Could not reach the server. Check your connection and try again.",
  },
  "add_team.error.timeout": {
    fr: "Le serveur met plus de temps que d'habitude. Réessayez dans un instant.",
    en: "The server is taking longer than usual. Please try again in a moment.",
  },

  "review.title": { fr: "Vérifier la candidature", en: "Review submission" },
  "review.subtitle": {
    fr: "Modifiez les informations si nécessaire, puis approuvez ou rejetez.",
    en: "Edit any field if needed, then approve or reject.",
  },
  "review.title.label": { fr: "Titre", en: "Title" },
  "review.approve": { fr: "Approuver", en: "Approve" },
  "review.reject": { fr: "Rejeter", en: "Reject" },
  "review.submitting": { fr: "Traitement…", en: "Processing…" },
  "review.reject.confirm.title": {
    fr: "Rejeter cette candidature ?",
    en: "Reject this submission?",
  },
  "review.reject.confirm.detail": {
    fr: "La candidature sera supprimée. Cette action est définitive.",
    en: "The submission will be deleted. This cannot be undone.",
  },
  "review.reject.confirm.cancel": { fr: "Annuler", en: "Cancel" },
  "review.reject.confirm.action": { fr: "Rejeter", en: "Reject" },
  "review.approved.title": { fr: "Approuvé !", en: "Approved!" },
  "review.approved.detail": {
    fr: "Le membre apparaît maintenant sur la page À propos.",
    en: "The member now appears on the About page.",
  },
  "review.rejected.title": {
    fr: "Candidature rejetée",
    en: "Submission rejected",
  },
  "review.rejected.detail": {
    fr: "La candidature a été supprimée.",
    en: "The submission has been deleted.",
  },
  "review.back": { fr: "Voir la page À propos", en: "Open the About page" },
  "review.error.generic": {
    fr: "Une erreur s'est produite. Veuillez réessayer.",
    en: "Something went wrong. Please try again.",
  },
  "review.error.already_active": {
    fr: "Ce membre est déjà approuvé et visible sur la page À propos. Pour le désactiver, utilisez l'outil d'administration.",
    en: "This member is already approved and visible on the About page. Use admin tooling to deactivate.",
  },

  "markdown.editor.tabs_label": {
    fr: "Modes de l'éditeur",
    en: "Editor modes",
  },
  "markdown.editor.write": { fr: "Écrire", en: "Write" },
  "markdown.editor.preview": { fr: "Aperçu", en: "Preview" },
  "markdown.editor.hint": {
    fr: "Markdown pris en charge — **gras**, *italique*, ## titres, listes, [liens](https://exemple.com).",
    en: "Markdown supported — **bold**, *italic*, ## headings, lists, [links](https://example.com).",
  },
  "markdown.editor.empty_preview": {
    fr: "Rien à prévisualiser pour l'instant.",
    en: "Nothing to preview yet.",
  },

  "admin.location.label": { fr: "Adresse", en: "Address" },
  "admin.location.placeholder": {
    fr: "Commencez à taper, ex. Rue Joseph, Douala",
    en: "Start typing, e.g. Rue Joseph, Douala",
  },
  "admin.location.plus_code.show": {
    fr: "Pas d'adresse ? Coller un Plus Code",
    en: "No address? Paste a Plus Code",
  },
  "admin.location.plus_code.hide": {
    fr: "Masquer le Plus Code",
    en: "Hide Plus Code",
  },
  "admin.location.plus_code.label": { fr: "Plus Code", en: "Plus Code" },
  "admin.location.plus_code.hint": {
    fr: "Code court avec ville (ex. XWPP+5M Kribi, Cameroun) ou code complet (ex. 5GVGXWPP+5M). Copiable depuis Google Maps.",
    en: "Short code with city (e.g. XWPP+5M Kribi, Cameroon) or full code (e.g. 5GVGXWPP+5M). Copyable from Google Maps.",
  },
  "admin.location.plus_code.placeholder": {
    fr: "XWPP+5M Kribi, Cameroun",
    en: "XWPP+5M Kribi, Cameroon",
  },
  "admin.location.plus_code.resolve": { fr: "Résoudre", en: "Resolve" },
  "admin.location.plus_code.resolving": { fr: "Résolution…", en: "Resolving…" },
  "admin.location.plus_code.error.empty": {
    fr: "Saisissez un Plus Code.",
    en: "Enter a Plus Code.",
  },
  "admin.location.plus_code.error.invalid": {
    fr: "Plus Code invalide. Vérifiez le format.",
    en: "Invalid Plus Code. Check the format.",
  },
  "admin.location.plus_code.error.short_needs_locality": {
    fr: "Code court : ajoutez une ville (ex. XWPP+5M Kribi, Cameroun).",
    en: "Short code: add a city (e.g. XWPP+5M Kribi, Cameroon).",
  },
  "admin.location.plus_code.error.locality_not_found": {
    fr: "Ville introuvable. Essayez d'orthographier différemment.",
    en: "City not found. Try a different spelling.",
  },
  "admin.location.plus_code.error.network": {
    fr: "Échec réseau. Vérifiez votre connexion et réessayez.",
    en: "Network failure. Check your connection and retry.",
  },
  "admin.location.plus_code.error.reverse": {
    fr: "Impossible d'identifier la ville pour ce point.",
    en: "Couldn't identify a city for this point.",
  },
  "admin.location.plus_code.error.lib": {
    fr: "Décodeur Plus Code indisponible.",
    en: "Plus Code decoder unavailable.",
  },

  "admin.brand": { fr: "ganitel", en: "ganitel" },
  "admin.shell.eyebrow": { fr: "Backoffice", en: "Backoffice" },
  "admin.shell.mode": { fr: "Mode admin", en: "Admin mode" },
  "admin.shell.exit": { fr: "Quitter vers le site", en: "Back to the site" },
  "admin.nav.overview": { fr: "Vue d'ensemble", en: "Overview" },
  "admin.nav.rentals": { fr: "Hébergements", en: "Stays" },
  "admin.nav.experiences": { fr: "Expériences", en: "Experiences" },
  "admin.nav.team": { fr: "Équipe", en: "Team" },

  "admin.filter.label": { fr: "Filtrer", en: "Filter" },
  "admin.filter.reset": { fr: "Tout réinitialiser", en: "Reset filters" },
  "admin.status.draft": { fr: "Brouillon", en: "Draft" },
  "admin.status.published": { fr: "Publié", en: "Published" },
  "admin.status.unlisted": { fr: "Masqué", en: "Unlisted" },
  "admin.status.removed": { fr: "Supprimé", en: "Removed" },

  "admin.action.edit": { fr: "Modifier", en: "Edit" },
  "admin.action.publish": { fr: "Publier", en: "Publish" },
  "admin.action.unpublish": { fr: "Masquer", en: "Unlist" },
  "admin.action.delete": { fr: "Supprimer", en: "Delete" },
  "admin.action.prev": { fr: "← Précédent", en: "← Previous" },
  "admin.action.next": { fr: "Suivant →", en: "Next →" },
  "admin.pagination.of": { fr: "sur", en: "of" },

  "admin.state.loading": { fr: "Chargement…", en: "Loading…" },
  "admin.state.error_prefix": {
    fr: "Erreur de chargement :",
    en: "Failed to load:",
  },
  "admin.confirm.delete": {
    fr: "Supprimer « {title} » ?",
    en: 'Delete "{title}"?',
  },

  "admin.meta.dashboard": { fr: "Admin — ganitel", en: "Admin — ganitel" },
  "admin.meta.rentals": {
    fr: "Admin — Hébergements",
    en: "Admin — Stays",
  },
  "admin.meta.experiences": {
    fr: "Admin — Expériences",
    en: "Admin — Experiences",
  },

  "admin.dashboard.eyebrow": { fr: "Backoffice", en: "Backoffice" },
  "admin.dashboard.title": { fr: "Tableau de bord", en: "Dashboard" },
  "admin.dashboard.description": {
    fr: "Vue d'ensemble du catalogue ganitel — logements et expériences confondus.",
    en: "Overview of the ganitel catalog — stays and experiences combined.",
  },
  "admin.stats.catalog": { fr: "Au catalogue", en: "In catalog" },
  "admin.stats.catalog_sub": {
    fr: "Logements + expériences",
    en: "Stays + experiences",
  },
  "admin.stats.published": { fr: "Publiés", en: "Published" },
  "admin.stats.published_sub": { fr: "Visibles en ligne", en: "Live on site" },
  "admin.stats.drafts": { fr: "Brouillons", en: "Drafts" },
  "admin.stats.drafts_sub": { fr: "À finaliser", en: "To finish" },
  "admin.stats.unlisted": { fr: "Masqués", en: "Unlisted" },
  "admin.stats.unlisted_sub": {
    fr: "Retirés du site",
    en: "Hidden from site",
  },

  "admin.section.rentals.eyebrow": { fr: "Hébergements", en: "Stays" },
  "admin.section.rentals.title": {
    fr: "Logements & séjours",
    en: "Homes & stays",
  },
  "admin.section.rentals.description": {
    fr: "Villas, studios, maisons d'hôtes. Édition, publication, retrait du catalogue.",
    en: "Villas, studios, guesthouses. Edit, publish, remove from the catalog.",
  },
  "admin.section.experiences.eyebrow": {
    fr: "Expériences",
    en: "Experiences",
  },
  "admin.section.experiences.title": {
    fr: "Activités & escapades",
    en: "Activities & escapes",
  },
  "admin.section.experiences.description": {
    fr: "Visites, ateliers, immersions. Suivi des statuts et accès direct aux fiches.",
    en: "Tours, workshops, immersions. Track statuses and jump straight to records.",
  },

  "admin.section.total": { fr: "Total", en: "Total" },
  "admin.section.published": { fr: "Publiés", en: "Published" },
  "admin.section.drafts": { fr: "Brouillons", en: "Drafts" },
  "admin.section.hidden": { fr: "Retirés", en: "Hidden" },

  "admin.rentals.eyebrow": { fr: "Catalogue", en: "Catalog" },
  "admin.rentals.title": { fr: "Hébergements", en: "Stays" },
  "admin.rentals.description": {
    fr: "Tous les logements ganitel — brouillons, publiés et archivés.",
    en: "All ganitel stays — drafts, published, and archived.",
  },
  "admin.rentals.add": {
    fr: "Ajouter un hébergement",
    en: "Add a stay",
  },
  "admin.rentals.empty.title": {
    fr: "Aucun hébergement pour le moment",
    en: "No stays yet",
  },
  "admin.rentals.empty.description": {
    fr: "Crée ton premier logement pour qu'il apparaisse ici.",
    en: "Create your first stay and it will appear here.",
  },
  "admin.rentals.col.title": { fr: "Hébergement", en: "Stay" },
  "admin.rentals.col.location": { fr: "Lieu", en: "Location" },
  "admin.rentals.col.type": { fr: "Type", en: "Type" },
  "admin.rentals.col.price": { fr: "Prix / nuit", en: "Price / night" },
  "admin.rentals.col.status": { fr: "Statut", en: "Status" },
  "admin.rentals.col.actions": { fr: "Actions", en: "Actions" },

  "admin.experiences.eyebrow": { fr: "Catalogue", en: "Catalog" },
  "admin.experiences.title": { fr: "Expériences", en: "Experiences" },
  "admin.experiences.description": {
    fr: "Toutes les activités ganitel — visites, ateliers et escapades.",
    en: "All ganitel activities — tours, workshops, and escapes.",
  },
  "admin.experiences.add": {
    fr: "Ajouter une expérience",
    en: "Add an experience",
  },
  "admin.experiences.empty.title": {
    fr: "Aucune expérience pour le moment",
    en: "No experiences yet",
  },
  "admin.experiences.empty.description": {
    fr: "Crée ta première expérience pour qu'elle apparaisse ici.",
    en: "Create your first experience and it will appear here.",
  },
  "admin.experiences.col.title": { fr: "Expérience", en: "Experience" },
  "admin.experiences.col.location": { fr: "Lieu", en: "Location" },
  "admin.experiences.col.type": { fr: "Type", en: "Type" },
  "admin.experiences.col.duration": { fr: "Durée", en: "Duration" },
  "admin.experiences.col.price": { fr: "Prix", en: "Price" },
  "admin.experiences.col.status": { fr: "Statut", en: "Status" },
  "admin.experiences.col.actions": { fr: "Actions", en: "Actions" },

  "admin.duration.min_short": { fr: "min", en: "min" },
  "admin.duration.hour_short": { fr: "h", en: "h" },

  "footer.terms": { fr: "Conditions", en: "Terms" },
  "footer.privacy": { fr: "Confidentialité", en: "Privacy" },
  "footer.faq": { fr: "Aide & FAQ", en: "Help & FAQ" },

  "legal.updated_at": {
    fr: "Dernière mise à jour — 22 mai 2026",
    en: "Last updated — May 22, 2026",
  },
  "legal.contact_intro": {
    fr: "Une question ? Écrivez-nous à",
    en: "A question? Reach us at",
  },
  "legal.contact_email": { fr: "hello@ganitel.com", en: "hello@ganitel.com" },

  "terms.meta.title": {
    fr: "Conditions générales — ganitel",
    en: "Terms of Service — ganitel",
  },
  "terms.meta.description": {
    fr: "Règles d'utilisation de ganitel pour les voyageurs et les hôtes au Cameroun, au Sénégal et en Côte d'Ivoire.",
    en: "Rules for using ganitel as a traveler or host in Cameroon, Senegal, and Côte d'Ivoire.",
  },
  "terms.tag": { fr: "Conditions", en: "Terms" },
  "terms.title": { fr: "Conditions", en: "Terms of" },
  "terms.title_em": { fr: "générales.", en: "service." },
  "terms.lede": {
    fr: "Le cadre qui nous lie quand vous réservez un séjour ou proposez un hébergement sur ganitel.",
    en: "The framework that binds us when you book a stay or list a home on ganitel.",
  },
  "terms.body": {
    fr: `## 1. Qui sommes-nous ?

ganitel ("ganitel", "nous") est une place de marché qui met en relation des voyageurs et des hôtes de logements et d'expériences au Cameroun, au Sénégal et en Côte d'Ivoire. Les présentes conditions régissent l'accès au site **ganitel.com** ainsi qu'à tous les services associés.

## 2. Éligibilité et compte

Vous devez avoir au moins 18 ans et la capacité juridique de contracter pour utiliser ganitel. Vous pouvez parcourir le catalogue sans créer de compte ; un compte est requis pour réserver, communiquer avec un hôte ou publier une annonce. Vous vous engagez à fournir des informations exactes et à les tenir à jour.

## 3. Rôle de ganitel

ganitel agit comme intermédiaire technique entre voyageurs et hôtes. Le contrat de location ou de prestation d'expérience est conclu directement entre vous et l'hôte. ganitel n'est ni propriétaire ni gestionnaire des logements et expériences proposés.

## 4. Réservation et paiement

Les paiements sont traités via **Flutterwave** et acceptent les principaux moyens locaux : Mobile Money (MTN, Orange), Wave, ainsi que les cartes bancaires. Les montants sont affichés en franc CFA (XAF ou XOF selon le pays) et incluent les frais de service ganitel. Le paiement est débité au moment de la confirmation et reversé à l'hôte après le début du séjour, déduction faite de notre commission.

## 5. Annulations et remboursements

Chaque annonce indique la politique d'annulation applicable. À défaut, les annulations effectuées plus de 7 jours avant l'arrivée donnent lieu à un remboursement intégral hors frais de service ; entre 7 jours et 24 heures avant l'arrivée, 50 % du montant est remboursé ; passé ce délai, aucun remboursement n'est dû. Les cas de force majeure sont examinés au cas par cas.

## 6. Obligations des voyageurs

Vous vous engagez à respecter le logement, son voisinage et les règles fixées par l'hôte. Tout dommage causé pendant le séjour peut donner lieu à une demande de prise en charge. Les comportements illégaux, discriminatoires ou dangereux entraînent la suspension du compte.

## 7. Obligations des hôtes

Vous garantissez que vous êtes en droit de proposer le logement ou l'expérience, que les informations publiées sont exactes (capacité, équipements, prix, disponibilités) et que le bien respecte la réglementation locale. Vous êtes responsable de la qualité de l'accueil et du respect des engagements pris envers le voyageur.

## 8. Vérification et KYC

Nous pouvons vous demander de vérifier votre identité (pièce d'identité, justificatif d'adresse, attestation d'assurance) avant ou après votre première réservation. La non-vérification peut entraîner la suspension du compte.

## 9. Propriété intellectuelle

Les contenus que vous publiez restent votre propriété ; vous accordez à ganitel une licence mondiale, non exclusive et gratuite pour les afficher, les indexer et les promouvoir dans le cadre du service. La marque "ganitel", le logo et l'interface du site sont protégés.

## 10. Responsabilité

ganitel n'est pas responsable des litiges entre voyageurs et hôtes, ni des dommages indirects (pertes d'exploitation, préjudice moral, perte d'opportunité). Notre responsabilité totale est plafonnée au montant des frais de service perçus sur la réservation litigieuse.

## 11. Suspension et résiliation

Nous pouvons suspendre ou clôturer votre compte en cas de manquement aux présentes conditions, de fraude présumée ou sur demande d'une autorité compétente. Vous pouvez clôturer votre compte à tout moment depuis votre profil.

## 12. Droit applicable et juridiction

Les présentes conditions sont régies par le droit camerounais. Tout litige est soumis à une tentative de résolution amiable préalable, puis à la compétence des tribunaux de Douala, sauf disposition d'ordre public contraire dans le pays de résidence du voyageur ou de l'hôte.

## 13. Modifications

Nous pouvons faire évoluer les présentes conditions. Les changements significatifs vous seront notifiés par e-mail au moins 15 jours avant leur entrée en vigueur.

## 14. Nous contacter

Pour toute question relative aux présentes conditions, écrivez-nous à **hello@ganitel.com**.`,
    en: `## 1. Who we are

ganitel ("ganitel", "we") is a marketplace that connects travelers with hosts of stays and experiences in Cameroon, Senegal, and Côte d'Ivoire. These terms govern access to **ganitel.com** and all related services.

## 2. Eligibility and account

You must be at least 18 years old and legally able to enter contracts to use ganitel. You can browse the catalog without an account; an account is required to book, message a host, or list a stay. You agree to provide accurate information and keep it up to date.

## 3. ganitel's role

ganitel acts as a technical intermediary between travelers and hosts. The rental or experience contract is concluded directly between you and the host. ganitel neither owns nor manages the listed stays and experiences.

## 4. Booking and payment

Payments are processed through **Flutterwave** and accept the main local methods: Mobile Money (MTN, Orange), Wave, as well as bank cards. Amounts are displayed in CFA francs (XAF or XOF depending on the country) and include ganitel service fees. The payment is captured at confirmation and disbursed to the host once the stay begins, minus our commission.

## 5. Cancellations and refunds

Each listing displays its applicable cancellation policy. In the absence of a specific one, cancellations made more than 7 days before arrival are fully refunded (excluding service fees); between 7 days and 24 hours before arrival, 50% is refunded; after that, no refund is due. Force majeure cases are reviewed individually.

## 6. Traveler obligations

You agree to respect the stay, its neighbors, and the rules set by the host. Any damage caused during the stay may result in a charge. Illegal, discriminatory, or dangerous behavior will lead to account suspension.

## 7. Host obligations

You guarantee that you have the right to offer the stay or experience, that the published information is accurate (capacity, amenities, price, availability), and that the property complies with local regulations. You are responsible for the quality of hosting and for honoring commitments made to the traveler.

## 8. Verification and KYC

We may ask you to verify your identity (ID, proof of address, insurance certificate) before or after your first booking. Refusal to verify may result in account suspension.

## 9. Intellectual property

Content you publish remains yours; you grant ganitel a worldwide, non-exclusive, royalty-free license to display, index, and promote it as part of the service. The "ganitel" name, logo, and site interface are protected.

## 10. Liability

ganitel is not responsible for disputes between travelers and hosts, nor for indirect damages (loss of business, moral prejudice, loss of opportunity). Our total liability is capped at the service fees collected on the disputed booking.

## 11. Suspension and termination

We may suspend or terminate your account in case of breach of these terms, suspected fraud, or request from a competent authority. You can close your account at any time from your profile.

## 12. Governing law and jurisdiction

These terms are governed by Cameroonian law. Any dispute is first subject to amicable resolution, then to the courts of Douala — unless mandatory consumer-protection rules in the traveler's or host's country of residence say otherwise.

## 13. Changes

We may update these terms. Significant changes will be notified by email at least 15 days before they take effect.

## 14. Contact us

For any question about these terms, write to **hello@ganitel.com**.`,
  },

  "privacy.meta.title": {
    fr: "Politique de confidentialité — ganitel",
    en: "Privacy Policy — ganitel",
  },
  "privacy.meta.description": {
    fr: "Comment ganitel collecte, utilise et protège vos données personnelles.",
    en: "How ganitel collects, uses, and protects your personal data.",
  },
  "privacy.tag": { fr: "Confidentialité", en: "Privacy" },
  "privacy.title": { fr: "Vos données,", en: "Your data," },
  "privacy.title_em": { fr: "notre engagement.", en: "our commitment." },
  "privacy.lede": {
    fr: "Ce que nous collectons, pourquoi, avec qui nous le partageons et comment vous gardez le contrôle.",
    en: "What we collect, why, who we share it with, and how you stay in control.",
  },
  "privacy.body": {
    fr: `## 1. Qui est responsable du traitement ?

ganitel est responsable du traitement de vos données personnelles dans le cadre de l'utilisation de **ganitel.com** et des services associés. Vous pouvez nous joindre à **hello@ganitel.com**.

## 2. Données que nous collectons

- **Identité et contact** : nom, prénom, e-mail, numéro de téléphone, langue préférée.
- **Données de compte** : identifiant Clerk, rôles (voyageur, hôte, administrateur), statut de vérification.
- **Données de réservation** : dates, voyageurs, message à l'hôte, montants.
- **Données de paiement** : transmises directement à Flutterwave ; nous conservons uniquement les identifiants de transaction et les statuts.
- **Données techniques** : journaux applicatifs, type d'appareil, adresse IP, pour des raisons de sécurité et de qualité de service.
- **Contenu publié** : photos et descriptions ajoutées par les hôtes, avis laissés par les voyageurs.

## 3. Pourquoi nous traitons ces données

- Fournir et améliorer le service de mise en relation et de réservation.
- Sécuriser les comptes et lutter contre la fraude.
- Communiquer avec vous (confirmations, support, notifications transactionnelles via SMS et e-mail).
- Respecter nos obligations légales et fiscales.
- Mesurer l'audience du site et l'efficacité de nos campagnes (de manière agrégée).

## 4. Bases légales

Nous traitons vos données sur la base : (i) de l'exécution du contrat qui nous lie, (ii) de votre consentement pour les communications non transactionnelles, (iii) de notre intérêt légitime à exploiter et sécuriser la plateforme, (iv) du respect d'obligations légales.

## 5. Avec qui nous partageons vos données

Nous partageons uniquement ce qui est nécessaire avec :

- **Clerk** — gestion d'identité et d'authentification.
- **Flutterwave** — traitement des paiements (Mobile Money, Wave, cartes).
- **Sendchamp** — envoi de SMS transactionnels (codes, notifications de réservation).
- **Hébergeurs et CDN** que nous utilisons pour faire fonctionner le site.
- **Hôtes** (informations strictement nécessaires à votre réservation) et **voyageurs** (informations publiques d'une annonce).
- **Autorités compétentes**, lorsque la loi l'exige.

Aucune de ces données n'est vendue à des tiers à des fins publicitaires.

## 6. Durée de conservation

- Données de compte : tant que votre compte est actif, puis 3 ans à des fins de preuve.
- Données de réservation et de paiement : 10 ans pour respecter nos obligations comptables.
- Journaux techniques : 12 mois maximum.

## 7. Vos droits

Conformément à la réglementation applicable, vous disposez d'un droit d'accès, de rectification, d'opposition, d'effacement et de portabilité de vos données. Vous pouvez exercer ces droits depuis votre profil ou en écrivant à **hello@ganitel.com**. Nous répondons sous 30 jours.

## 8. Localisation des données

Nos données sont hébergées dans des centres de données conformes aux standards internationaux. Lorsque des transferts hors zone Cemac ou Uemoa sont nécessaires (par exemple via nos prestataires), nous nous assurons d'un niveau de protection adéquat.

## 9. Cookies et traceurs

Nous utilisons un nombre limité de cookies, essentiellement techniques (session, préférences de langue). Aucun cookie publicitaire n'est déposé sans votre consentement explicite.

## 10. Mineurs

ganitel n'est pas destiné aux personnes de moins de 18 ans. Si vous constatez qu'un mineur a créé un compte, signalez-le-nous : nous procéderons à la fermeture du compte.

## 11. Modifications

Cette politique peut évoluer. Les changements significatifs vous seront notifiés par e-mail au moins 15 jours avant leur application.

## 12. Nous contacter

Pour toute question ou pour exercer vos droits, écrivez-nous à **hello@ganitel.com**.`,
    en: `## 1. Who controls your data

ganitel is the data controller for personal data processed when you use **ganitel.com** and related services. You can reach us at **hello@ganitel.com**.

## 2. Data we collect

- **Identity and contact**: first name, last name, email, phone number, preferred language.
- **Account data**: Clerk user ID, roles (traveler, host, administrator), verification status.
- **Booking data**: dates, traveler count, message to host, amounts.
- **Payment data**: sent directly to Flutterwave; we only keep transaction IDs and statuses.
- **Technical data**: application logs, device type, IP address, for security and quality of service.
- **Published content**: photos and descriptions added by hosts, reviews left by travelers.

## 3. Why we process this data

- Provide and improve the matchmaking and booking service.
- Secure accounts and prevent fraud.
- Communicate with you (confirmations, support, transactional SMS and email notifications).
- Comply with legal and tax obligations.
- Measure site traffic and campaign effectiveness (in aggregate).

## 4. Legal bases

We process your data based on: (i) the performance of our contract with you, (ii) your consent for non-transactional communications, (iii) our legitimate interest in operating and securing the platform, (iv) compliance with legal obligations.

## 5. Who we share data with

We share only what is strictly necessary with:

- **Clerk** — identity and authentication management.
- **Flutterwave** — payment processing (Mobile Money, Wave, cards).
- **Sendchamp** — transactional SMS (codes, booking notifications).
- **Hosting and CDN providers** powering the site.
- **Hosts** (only what they need for your booking) and **travelers** (public listing information).
- **Competent authorities**, when required by law.

None of this data is sold to third parties for advertising.

## 6. Retention

- Account data: while your account is active, then 3 years for evidentiary purposes.
- Booking and payment data: 10 years to meet accounting obligations.
- Technical logs: 12 months maximum.

## 7. Your rights

Under applicable regulation, you can access, rectify, oppose, erase, and port your data. You can exercise these rights from your profile or by writing to **hello@ganitel.com**. We respond within 30 days.

## 8. Where your data lives

Our data is hosted in data centers that meet international standards. When transfers outside the Cemac or Uemoa zone are necessary (through our providers), we ensure an adequate level of protection.

## 9. Cookies and trackers

We use a small number of cookies, mostly technical (session, language preference). No advertising cookies are set without your explicit consent.

## 10. Minors

ganitel is not intended for people under 18. If you notice that a minor has created an account, report it to us and we will close the account.

## 11. Changes

This policy may evolve. Significant changes will be notified by email at least 15 days before they take effect.

## 12. Contact

For any question or to exercise your rights, write to **hello@ganitel.com**.`,
  },

  "faq.meta.title": {
    fr: "Aide & FAQ — ganitel",
    en: "Help & FAQ — ganitel",
  },
  "faq.meta.description": {
    fr: "Réponses aux questions fréquentes sur ganitel : réservation, paiement, annulation, hôtes et plus.",
    en: "Answers to common questions about ganitel: booking, payment, cancellation, hosts, and more.",
  },
  "faq.tag": { fr: "Aide", en: "Help" },
  "faq.title": { fr: "Vos questions,", en: "Your questions," },
  "faq.title_em": { fr: "nos réponses.", en: "our answers." },
  "faq.lede": {
    fr: "L'essentiel pour réserver l'esprit tranquille, ou pour proposer votre logement sur ganitel.",
    en: "The essentials for booking with peace of mind, or for listing your stay on ganitel.",
  },
  "faq.still_need_help": {
    fr: "Vous ne trouvez pas votre réponse ?",
    en: "Still can't find your answer?",
  },

  "faq.q.booking_how.question": {
    fr: "Comment réserver un séjour ou une expérience ?",
    en: "How do I book a stay or experience?",
  },
  "faq.q.booking_how.answer": {
    fr: "Parcourez le catalogue, sélectionnez vos dates et le nombre de voyageurs, puis confirmez votre paiement. Vous recevez une confirmation immédiate par e-mail et SMS dès que l'hôte accepte (ou automatiquement si la réservation est instantanée).",
    en: "Browse the catalog, pick your dates and traveler count, then confirm payment. You'll get an instant email and SMS confirmation as soon as the host accepts (or automatically for instant-book listings).",
  },

  "faq.q.payment_methods.question": {
    fr: "Quels moyens de paiement acceptez-vous ?",
    en: "Which payment methods do you accept?",
  },
  "faq.q.payment_methods.answer": {
    fr: "Nous acceptons Mobile Money (MTN et Orange), Wave et les cartes bancaires Visa et Mastercard. Les paiements sont traités par Flutterwave en franc CFA (XAF au Cameroun, XOF au Sénégal et en Côte d'Ivoire).",
    en: "We accept Mobile Money (MTN and Orange), Wave, and Visa/Mastercard. Payments are processed by Flutterwave in CFA francs (XAF in Cameroon, XOF in Senegal and Côte d'Ivoire).",
  },

  "faq.q.cancellation.question": {
    fr: "Puis-je annuler ma réservation ?",
    en: "Can I cancel my booking?",
  },
  "faq.q.cancellation.answer": {
    fr: "Chaque annonce indique sa politique d'annulation. À défaut : remboursement intégral jusqu'à 7 jours avant l'arrivée, 50 % entre 7 jours et 24 heures, aucun remboursement passé ce délai. Les annulations se font depuis « Mes réservations ».",
    en: 'Each listing shows its cancellation policy. Default: full refund up to 7 days before arrival, 50% between 7 days and 24 hours, no refund after that. You can cancel from "My bookings."',
  },

  "faq.q.regions.question": {
    fr: "Dans quels pays ganitel est-il disponible ?",
    en: "Where is ganitel available?",
  },
  "faq.q.regions.answer": {
    fr: "Au lancement : Cameroun, Sénégal et Côte d'Ivoire. D'autres pays d'Afrique francophone et anglophone suivront.",
    en: "At launch: Cameroon, Senegal, and Côte d'Ivoire. More countries across French- and English-speaking Africa will follow.",
  },

  "faq.q.host_listing.question": {
    fr: "Comment proposer mon logement sur ganitel ?",
    en: "How do I list my place on ganitel?",
  },
  "faq.q.host_listing.answer": {
    fr: "Écrivez-nous à hello@ganitel.com avec quelques photos et l'adresse du bien. Chaque logement est visité par notre équipe avant d'être publié — c'est ce qui garantit la qualité du catalogue.",
    en: "Write to hello@ganitel.com with a few photos and the property address. Every stay is visited by our team before going live — that's what keeps the catalog quality high.",
  },

  "faq.q.verification.question": {
    fr: "Comment vérifiez-vous les hôtes et les logements ?",
    en: "How do you verify hosts and stays?",
  },
  "faq.q.verification.answer": {
    fr: "Identité de l'hôte vérifiée (KYC), visite physique du logement par un membre de l'équipe ganitel et contrôle qualité des photos et de la fiche. Les avis voyageurs viennent ensuite affiner le score.",
    en: "Host identity is verified (KYC), the property is visited in person by a ganitel team member, and photos and listing details are quality-checked. Traveler reviews then refine the score over time.",
  },

  "faq.q.safety.question": {
    fr: "Que se passe-t-il si quelque chose ne va pas pendant mon séjour ?",
    en: "What happens if something goes wrong during my stay?",
  },
  "faq.q.safety.answer": {
    fr: "Contactez l'hôte directement via la messagerie de l'application. Si le problème persiste, notre équipe support intervient sous 24 heures et peut décider d'un remboursement ou d'un relogement.",
    en: "Reach out to the host directly through in-app messaging. If the issue isn't resolved, our support team steps in within 24 hours and may decide on a refund or rehousing.",
  },

  "faq.q.languages.question": {
    fr: "Dans quelles langues puis-je utiliser ganitel ?",
    en: "Which languages does ganitel support?",
  },
  "faq.q.languages.answer": {
    fr: "Français et anglais. La langue se règle automatiquement selon votre navigateur et peut être ajustée depuis votre profil.",
    en: "French and English. The language is set automatically from your browser and can be adjusted from your profile.",
  },

  "faq.q.account.question": {
    fr: "Dois-je créer un compte pour utiliser ganitel ?",
    en: "Do I need an account to use ganitel?",
  },
  "faq.q.account.answer": {
    fr: "Non pour parcourir le catalogue. Oui pour réserver, contacter un hôte ou publier une annonce. La création de compte prend moins d'une minute.",
    en: "No to browse the catalog. Yes to book, contact a host, or list a property. Creating an account takes less than a minute.",
  },

  "common.yes": { fr: "Oui", en: "Yes" },
  "common.no": { fr: "Non", en: "No" },
  "common.back": { fr: "← Retour", en: "← Back" },
  "common.dash": { fr: "—", en: "—" },
  "common.loading_aria": { fr: "Chargement", en: "Loading" },
  "common.error_prefix": { fr: "Erreur", en: "Error" },
  "common.load_error_prefix": {
    fr: "Erreur de chargement",
    en: "Failed to load",
  },

  "index.meta.title": {
    fr: "ganitel — Là où la lumière prend son temps",
    en: "ganitel — Stay where the light moves slowly",
  },
  "index.meta.description": {
    fr: "Logements et expériences soigneusement sélectionnés au Cameroun, au Sénégal et en Côte d'Ivoire.",
    en: "Carefully selected stays and experiences in Cameroon, Senegal and Côte d'Ivoire.",
  },

  "bookings.meta.title": {
    fr: "Mes réservations — ganitel",
    en: "My bookings — ganitel",
  },

  "join.meta.title": {
    fr: "Rejoindre ganitel — liste d'attente",
    en: "Join ganitel — waitlist",
  },
  "join.meta.description": {
    fr: "Rejoignez la liste d'attente de ganitel. Soyez parmi les premiers à découvrir nos logements et expériences au Cameroun, Sénégal et Côte d'Ivoire.",
    en: "Join the ganitel waitlist. Be among the first to discover our stays and experiences in Cameroon, Senegal and Côte d'Ivoire.",
  },
  "join.meta.og_alt": { fr: "Rejoindre ganitel", en: "Join ganitel" },

  "add_team.meta.title": {
    fr: "Rejoindre l'équipe — ganitel",
    en: "Join the team — ganitel",
  },

  "team_review.meta.title": {
    fr: "Évaluation d'une candidature — ganitel",
    en: "Review submission — ganitel",
  },

  "browse.section.stays": { fr: "Logements", en: "Stays" },
  "browse.section.experiences": { fr: "Expériences", en: "Experiences" },
  "browse.meta.description.stays": {
    fr: "Logements soigneusement sélectionnés à Douala, Yaoundé, Dakar, Abidjan et plus.",
    en: "Carefully selected stays in Douala, Yaoundé, Dakar, Abidjan and beyond.",
  },
  "browse.meta.description.experiences": {
    fr: "Expériences à vivre au Cameroun, au Sénégal et en Côte d'Ivoire autour de nos logements ou en escapade.",
    en: "Experiences to live in Cameroon, Senegal and Côte d'Ivoire — around our stays or as a getaway.",
  },

  "property.not_found.title": {
    fr: "Logement introuvable — ganitel",
    en: "Stay not found — ganitel",
  },
  "property.not_found.description": {
    fr: "Cette annonce n'est pas disponible. Découvrez nos autres logements sur ganitel.",
    en: "This listing is not available. Discover our other stays on ganitel.",
  },
  "property.not_found.short": {
    fr: "Logement introuvable",
    en: "Stay not found",
  },
  "property.type_in_city": {
    fr: "{type} à {city}, {country}.",
    en: "{type} in {city}, {country}.",
  },

  "experience.not_found.title": {
    fr: "Expérience introuvable — ganitel",
    en: "Experience not found — ganitel",
  },
  "experience.not_found.description": {
    fr: "Cette expérience n'est plus disponible. Découvrez nos autres expériences sur ganitel.",
    en: "This experience is no longer available. Discover our other experiences on ganitel.",
  },
  "experience.not_found.short": {
    fr: "Expérience introuvable",
    en: "Experience not found",
  },

  "sign_in.meta.title": { fr: "Connexion — ganitel", en: "Sign in — ganitel" },
  "sign_in.welcome": { fr: "Bienvenue", en: "Welcome" },
  "sign_in.subtitle": { fr: "Connexion", en: "Sign in" },
  "sign_in.or": { fr: "ou", en: "or" },

  "complete_profile.meta.title": {
    fr: "Compléter votre profil — ganitel",
    en: "Complete your profile — ganitel",
  },
  "complete_profile.title": { fr: "Presque prêt", en: "Almost there" },
  "complete_profile.subtitle": { fr: "Votre profil", en: "Your profile" },
  "complete_profile.full_name.label": {
    fr: "Votre nom complet",
    en: "Your full name",
  },
  "complete_profile.full_name.placeholder": {
    fr: "Ex. Daniel Mvondo",
    en: "e.g. Daniel Mvondo",
  },
  "complete_profile.submit": { fr: "Continuer", en: "Continue" },
  "complete_profile.submitting": { fr: "Enregistrement…", en: "Saving…" },

  "profile.meta.title": {
    fr: "Mon profil — ganitel",
    en: "My profile — ganitel",
  },
  "profile.label.status": { fr: "Statut", en: "Status" },
  "profile.label.language": { fr: "Langue", en: "Language" },
  "profile.label.host": { fr: "Hôte", en: "Host" },
  "profile.label.admin": { fr: "Admin", en: "Admin" },

  "auth.phone.label": { fr: "Numéro de téléphone", en: "Phone number" },
  "auth.phone.send_code": { fr: "Recevoir un code", en: "Send code" },
  "auth.phone.sending": { fr: "Envoi…", en: "Sending…" },
  "auth.phone.send_error": {
    fr: "Erreur lors de l'envoi du code.",
    en: "Could not send the code.",
  },
  "auth.otp.label": { fr: "Code reçu par SMS", en: "SMS code" },
  "auth.otp.sent_to": { fr: "Envoyé au {phone}", en: "Sent to {phone}" },
  "auth.otp.verifying": { fr: "Vérification…", en: "Verifying…" },
  "auth.otp.submit": { fr: "Connexion", en: "Sign in" },
  "auth.otp.invalid": { fr: "Code invalide.", en: "Invalid code." },
  "auth.otp.change_number": { fr: "Changer de numéro", en: "Change number" },
  "auth.google.label": {
    fr: "Continuer avec Google",
    en: "Continue with Google",
  },
  "auth.google.redirecting": { fr: "Redirection…", en: "Redirecting…" },
  "auth.menu.aria": { fr: "Compte", en: "Account" },

  "admin.rentals.new.meta.title": {
    fr: "Admin — Nouvel hébergement",
    en: "Admin — New stay",
  },
  "admin.rentals.new.title": { fr: "Nouvel hébergement", en: "New stay" },
  "admin.rentals.new.subtitle": {
    fr: "Ajoutez vos photos et vidéos directement dans le formulaire. Limites : 20 médias, 3 vidéos max, images ≤ 10 Mo, vidéos ≤ 200 Mo et 60 s.",
    en: "Add your photos and videos directly in the form. Limits: 20 items, 3 videos max, images ≤ 10 MB, videos ≤ 200 MB and 60 s.",
  },
  "admin.rentals.new.submit": {
    fr: "Créer le brouillon",
    en: "Create draft",
  },
  "admin.rentals.new.submitting": { fr: "Création…", en: "Creating…" },
  "admin.rentals.edit.meta.title": {
    fr: "Admin — Modifier l'hébergement",
    en: "Admin — Edit stay",
  },
  "admin.rentals.edit.title": {
    fr: "Modifier l'hébergement",
    en: "Edit stay",
  },
  "admin.rentals.edit.submit": {
    fr: "Enregistrer les modifications",
    en: "Save changes",
  },
  "admin.rentals.edit.submitting": {
    fr: "Enregistrement…",
    en: "Saving…",
  },

  "admin.experiences.new.meta.title": {
    fr: "Admin — Nouvelle expérience",
    en: "Admin — New experience",
  },
  "admin.experiences.new.title": {
    fr: "Nouvelle expérience",
    en: "New experience",
  },
  "admin.experiences.new.subtitle": {
    fr: "Ajoutez vos photos et vidéos directement dans le formulaire. Limites : 20 médias, 3 vidéos max, images ≤ 10 Mo, vidéos ≤ 200 Mo et 60 s.",
    en: "Add your photos and videos directly in the form. Limits: 20 items, 3 videos max, images ≤ 10 MB, videos ≤ 200 MB and 60 s.",
  },
  "admin.experiences.new.submit": {
    fr: "Créer le brouillon",
    en: "Create draft",
  },
  "admin.experiences.new.submitting": { fr: "Création…", en: "Creating…" },
  "admin.experiences.edit.meta.title": {
    fr: "Admin — Modifier l'expérience",
    en: "Admin — Edit experience",
  },
  "admin.experiences.edit.title": {
    fr: "Modifier l'expérience",
    en: "Edit experience",
  },
  "admin.experiences.edit.submit": {
    fr: "Enregistrer les modifications",
    en: "Save changes",
  },
  "admin.experiences.edit.submitting": {
    fr: "Enregistrement…",
    en: "Saving…",
  },

  "admin.form.section.info": { fr: "Informations", en: "Details" },
  "admin.form.section.location": { fr: "Localisation", en: "Location" },
  "admin.form.section.capacity": { fr: "Capacité", en: "Capacity" },
  "admin.form.section.amenities": { fr: "Équipements", en: "Amenities" },
  "admin.form.section.rules": { fr: "Règles", en: "Rules" },
  "admin.form.section.price": { fr: "Tarif", en: "Pricing" },
  "admin.form.section.format": { fr: "Format", en: "Format" },
  "admin.form.section.media": { fr: "Photos & vidéos", en: "Photos & videos" },

  "admin.form.title.label": { fr: "Titre", en: "Title" },
  "admin.form.description.label": { fr: "Description", en: "Description" },
  "admin.form.type.label": { fr: "Type", en: "Type" },
  "admin.form.select.placeholder": { fr: "— Choisir —", en: "— Select —" },
  "admin.form.content_language.label": {
    fr: "Langue du contenu",
    en: "Content language",
  },
  "admin.form.lang.fr": { fr: "Français", en: "French" },
  "admin.form.lang.en": { fr: "English", en: "English" },

  "admin.form.capacity.label": { fr: "Voyageurs", en: "Guests" },
  "admin.form.bedrooms.label": { fr: "Chambres", en: "Bedrooms" },
  "admin.form.beds.label": { fr: "Lits", en: "Beds" },
  "admin.form.bathrooms.label": { fr: "Salles de bain", en: "Bathrooms" },

  "admin.form.parking.label": { fr: "Parking", en: "Parking" },
  "admin.form.parking.none": { fr: "Aucun", en: "None" },
  "admin.form.parking.free": { fr: "Gratuit", en: "Free" },
  "admin.form.parking.paid": { fr: "Payant", en: "Paid" },

  "admin.form.kitchen.label": { fr: "Cuisine", en: "Kitchen" },
  "admin.form.kitchen.none": { fr: "Aucune", en: "None" },
  "admin.form.kitchen.kitchenette": { fr: "Kitchenette", en: "Kitchenette" },
  "admin.form.kitchen.full": { fr: "Cuisine complète", en: "Full kitchen" },

  "admin.form.bool.elevator": { fr: "Ascenseur", en: "Elevator" },
  "admin.form.bool.accessible": {
    fr: "Accessible PMR",
    en: "Wheelchair accessible",
  },
  "admin.form.bool.private_bathroom": {
    fr: "Salle de bain privée",
    en: "Private bathroom",
  },
  "admin.form.bool.pets": { fr: "Animaux", en: "Pets" },
  "admin.form.bool.smoking": { fr: "Fumeur", en: "Smoking" },
  "admin.form.bool.events": { fr: "Événements", en: "Events" },
  "admin.form.bool.family_friendly": {
    fr: "Familles bienvenues",
    en: "Family friendly",
  },
  "admin.form.bool.child_friendly": {
    fr: "Enfants bienvenus",
    en: "Child friendly",
  },

  "admin.form.check_in.label": { fr: "Arrivée", en: "Check-in" },
  "admin.form.check_out.label": { fr: "Départ", en: "Check-out" },
  "admin.form.house_rules.label": { fr: "Règles libres", en: "House rules" },
  "admin.form.cancellation.label": {
    fr: "Politique d'annulation",
    en: "Cancellation policy",
  },

  "admin.form.price_per_night.label": {
    fr: "Prix par nuit",
    en: "Price per night",
  },
  "admin.form.price_per_participant.label": {
    fr: "Prix par participant",
    en: "Price per participant",
  },
  "admin.form.currency.label": { fr: "Devise", en: "Currency" },
  "admin.form.price.amount": { fr: "Montant", en: "Amount" },
  "admin.form.price.currency": { fr: "Devise", en: "Currency" },
  "admin.form.price.add": { fr: "Ajouter une devise", en: "Add a currency" },

  "admin.form.participants.label": {
    fr: "Participants max",
    en: "Max participants",
  },
  "admin.form.duration.label": {
    fr: "Durée (minutes)",
    en: "Duration (minutes)",
  },

  "admin.publish_error.intro": {
    fr: "Impossible de publier :",
    en: "Cannot publish:",
  },
  "admin.publish_error.title.missing": {
    fr: "Titre manquant",
    en: "Title missing",
  },
  "admin.publish_error.base_price_amount.not_positive": {
    fr: "Le prix doit être supérieur à 0",
    en: "Price must be greater than 0",
  },
  "admin.publish_error.photos.empty": {
    fr: "Au moins une photo est requise",
    en: "At least one photo is required",
  },
  "admin.publish_error.prices.empty": {
    fr: "Au moins un prix est requis",
    en: "At least one price is required",
  },
  "admin.publish_error.media.empty": {
    fr: "Au moins un média est requis",
    en: "At least one media item is required",
  },
  "admin.publish_error.generic": {
    fr: "Champ invalide : {field}",
    en: "Invalid field: {field}",
  },

  "media_uploader.add": {
    fr: "Ajouter des photos / vidéos ({count} / {max})",
    en: "Add photos / videos ({count} / {max})",
  },
  "media_uploader.cover": {
    fr: "Couverture",
    en: "Cover",
  },
  "media_uploader.uploading": {
    fr: "Envoi…",
    en: "Uploading…",
  },
  "media_uploader.error.unsupported_format": {
    fr: "Format non supporté : {mime}",
    en: "Unsupported format: {mime}",
  },
  "media_uploader.error.image_too_large": {
    fr: "Image trop lourde (max {mb} Mo)",
    en: "Image too large (max {mb} MB)",
  },
  "media_uploader.error.video_too_large": {
    fr: "Vidéo trop lourde (max {mb} Mo)",
    en: "Video too large (max {mb} MB)",
  },
  "media_uploader.error.video_too_long": {
    fr: "Vidéo trop longue (max {seconds} s)",
    en: "Video too long (max {seconds} s)",
  },
  "media_uploader.error.upload_failed": {
    fr: "Échec de l'envoi.",
    en: "Upload failed.",
  },
  "media_uploader.error.unknown_mime": {
    fr: "inconnu",
    en: "unknown",
  },
} satisfies Dict;

export type TranslationKey = keyof typeof dict;

/** Match fr/en from BCP 47 tags (e.g. Accept-Language or navigator.languages). */
function localeFromLanguageTags(tags: Iterable<string>): Locale {
  for (const raw of tags) {
    const tag = raw.trim().split(";")[0]?.trim().toLowerCase() ?? "";
    if (!tag) continue;
    if (tag.startsWith("fr")) return "fr";
    if (tag.startsWith("en")) return "en";
  }
  return "fr";
}

/** Parse `Accept-Language` (or null). Falls back to fr when nothing matches. */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale {
  if (!header?.trim()) return "fr";
  return localeFromLanguageTags(header.split(","));
}

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
