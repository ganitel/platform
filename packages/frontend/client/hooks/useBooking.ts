import {
  useQuery,
  useMutation,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { bookingsService } from '@/services/bookings.service';
import { Booking, BookingRequest, Paginated } from '@shared/api';
import { queryClient } from '@/lib/query-client';

/**
 * Structure hiérarchique des clés de requête pour les réservations
 *
 * Pattern:
 * - all: clé racine pour toutes les réservations
 * - detail: une réservation spécifique par ID
 * - my: les réservations de l'utilisateur courant avec filtrage par statut
 * - pricing: calcul du prix pour dates/propriété données
 *
 * @example
 * bookingsQueryKeys.all → ['bookings']
 * bookingsQueryKeys.booking('123') → ['bookings', 'detail', '123']
 * bookingsQueryKeys.myBookings('upcoming') → ['bookings', 'my', 'upcoming']
 * bookingsQueryKeys.pricing('prop-1', '2024-02-15', '2024-02-20')
 *   → ['bookings', 'pricing', 'prop-1', '2024-02-15', '2024-02-20']
 */
export const bookingsQueryKeys = {
  // Racine: toutes les requêtes concernant les réservations
  all: ['bookings'] as const,

  // Une réservation spécifique par son ID
  // Clé varie donc chaque réservation a son propre cache
  booking: (id: string) =>
    [...bookingsQueryKeys.all, 'detail', id] as const,

  // Les réservations de l'utilisateur actuel
  // Peut être filtré par statut: 'upcoming', 'past', 'cancelled'
  myBookings: (status?: string) =>
    [...bookingsQueryKeys.all, 'my', status || 'all'] as const,

  // Calcul dynamique du prix
  // Varie avec propriété et dates
  pricing: (propertyId: string, checkIn: string, checkOut: string) =>
    [...bookingsQueryKeys.all, 'pricing', propertyId, checkIn, checkOut] as const,
};

/**
 * Configuration de cache centralisée pour les réservations
 *
 * Patterns de cache:
 * - Réservations individuelles: cache court (5 min) - peuvent changer
 * - Mes réservations: très court (2 min) - l'utilisateur crée/annule souvent
 * - Pricing: court (5 min) - prix changent, autres bookings arrivent
 */
const CACHE_CONFIG = {
  // Détail d'une réservation: peut être annulée, modifiée
  // 5 min: l'utilisateur peut revenir rapidement voir la même réservation
  bookingStaleTime: 5 * 60 * 1000,

  // 15 min: garde la réservation en mémoire si l'utilisateur navigue
  bookingGcTime: 15 * 60 * 1000,

  // Mes réservations: changent souvent (création, annulation, modification)
  // 2 min: très court car utilisateur crée/annule fréquemment
  myBookingsStaleTime: 2 * 60 * 1000,

  // 10 min: pas long, utilisateur recréé rapidement si needed
  myBookingsGcTime: 10 * 60 * 1000,

  // Pricing: dynamique (autres bookings changent dates, prix changent)
  // 5 min: utilisateur ne verra pas prix périmé en remplissant formulaire
  pricingStaleTime: 5 * 60 * 1000,

  // 10 min: pas très long car prix changent rapidement
  pricingGcTime: 10 * 60 * 1000,
};

/**
 * Hook pour charger une réservation spécifique
 *
 * Cas d'usage: Afficher détails d'une réservation confirmée
 *
 * Flux:
 * 1. Utilisateur clique "Voir détails" d'une réservation
 * 2. Navigation vers /bookings/:id
 * 3. Hook charge toutes les infos (dates, prix, hôte, détails)
 * 4. Détails en cache 15 min au cas où revient
 *
 * @param bookingId - ID unique de la réservation (ou undefined)
 * @param enabled - Désactive si undefined bookingId
 * @returns UseQueryResult avec détails complets de la réservation
 *
 * @example
 * const { data: booking, isPending } = useBooking('booking-456');
 *
 * if (isPending) return <LoadingSpinner />;
 *
 * return (
 *   <div>
 *     <h2>{booking?.property.title}</h2>
 *     <p>Check-in: {booking?.checkIn}</p>
 *     <p>Total: {booking?.totalPrice}€</p>
 *   </div>
 * );
 *
 * @note
 * - Clé unique par réservation
 * - 5 min staleTime: réservation peut être modifiée/annulée
 * - 15 min gcTime: utilisateur revient voir les mêmes réservations
 */
export const useBooking = (
  bookingId: string | undefined,
  enabled: boolean = true
): UseQueryResult<Booking, Error> => {
  return useQuery({
    // Clé vide si pas d'ID (ne execute pas queryFn)
    queryKey: bookingId ? bookingsQueryKeys.booking(bookingId) : [],

    queryFn: () => {
      if (!bookingId) throw new Error('Booking ID is required');
      return bookingsService.getBooking(bookingId);
    },

    // Désactive si pas d'ID ou si enabled=false
    enabled: enabled && !!bookingId,

    // 5 min: réservation peut changer (annulation, modification)
    staleTime: CACHE_CONFIG.bookingStaleTime,

    // 15 min: utilisateur revient souvent vérifier ses réservations
    gcTime: CACHE_CONFIG.bookingGcTime,
  });
};

/**
 * Hook pour lister ses propres réservations
 *
 * Cas d'usage: Page "Mes réservations" avec filtrage par statut
 *
 * Flux:
 * 1. Utilisateur navigue vers /my/bookings
 * 2. Hook charge toutes SES réservations (filtrées)
 * 3. Affiche upcoming, past, cancelled
 * 4. Cache très court (2 min) car changent souvent
 *
 * Statuts possibles:
 * - 'upcoming': réservations futures
 * - 'past': réservations passées
 * - 'cancelled': réservations annulées
 * - undefined ou 'all': toutes les réservations
 *
 * @param status - Filtre par statut de réservation (optionnel)
 * @param enabled - Désactive conditionnel
 * @returns UseQueryResult avec liste paginée des réservations
 *
 * @example
 * // Charger les réservations futures
 * const { data: upcomingBookings } = useMyBookings('upcoming');
 *
 * // Charger TOUTES les réservations
 * const { data: allBookings } = useMyBookings();
 *
 * // Avec state pour changement dynamique de filtre
 * const [filter, setFilter] = useState<'upcoming' | 'past'>();
 * const { data: bookings } = useMyBookings(filter);
 *
 * @note
 * - Cache très court (2 min) car utilisateur crée/annule fréquemment
 * - Chaque statut a sa propre clé de cache (indépendance)
 * - Le filter change queryKey automatiquement = nouveau fetch
 */
export const useMyBookings = (
  status?: string,
  enabled: boolean = true
): UseQueryResult<Paginated<Booking>, Error> => {
  return useQuery({
    // Clé inclut le statut du filtre
    // Exemple: ['bookings', 'my', 'upcoming'] vs ['bookings', 'my', 'past']
    // Chaque filtre = son cache indépendant
    queryKey: bookingsQueryKeys.myBookings(status),

    queryFn: () => bookingsService.getMyBookings(status),

    enabled,

    // 2 MIN: TRÈS COURT car utilisateur crée/annule souvent
    // Après créer une réservation, utilisateur voir quasiment immédiatement
    staleTime: CACHE_CONFIG.myBookingsStaleTime,

    // 10 min: pas très long, données peu durables
    gcTime: CACHE_CONFIG.myBookingsGcTime,
  });
};

/**
 * Hook pour calculer le prix d'une future réservation
 *
 * STUB: Aucun endpoint backend correspondant.
 * Retourne un calcul local basé sur les paramètres fournis.
 * À connecter à un vrai endpoint quand disponible côté backend.
 */
export const useCalculatePricing = (
  propertyId: string | undefined,
  checkIn: string | undefined,
  checkOut: string | undefined,
  guests?: {
    adults: number;
    children: number;
    infants: number;
  },
  enabled: boolean = true
): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey:
      propertyId && checkIn && checkOut
        ? bookingsQueryKeys.pricing(propertyId, checkIn, checkOut)
        : [],

    queryFn: () => {
      if (!propertyId || !checkIn || !checkOut) {
        throw new Error('Property ID and date range are required');
      }
      // Stub: return empty pricing structure until backend endpoint exists
      return Promise.resolve({
        propertyId,
        checkIn,
        checkOut,
        guests: guests || { adults: 1, children: 0, infants: 0 },
        nights: 0,
        basePrice: 0,
        serviceFee: 0,
        taxes: 0,
        total: 0,
      });
    },

    enabled:
      enabled && !!propertyId && !!checkIn && !!checkOut,

    staleTime: CACHE_CONFIG.pricingStaleTime,
    gcTime: CACHE_CONFIG.pricingGcTime,
  });
};

/**
 * Hook pour créer une nouvelle réservation
 *
 * Flux complet:
 * 1. Utilisateur remplit formulaire de réservation
 * 2. Appelle mutate() avec données (propriété, dates, paiement)
 * 3. Serveur valide, crée réservation, traite paiement
 * 4. Si succès: invalide liste des réservations (refetch auto)
 * 5. Utilisateur redirigé vers confirmation
 *
 * Points clés:
 * - onSuccess: invalide le cache "mes réservations"
 * - L'utilisateur verra IMMÉDIATEMENT sa nouvelle réservation
 * - Pas besoin de refetch manuel (invalidation automatique)
 *
 * @returns UseMutationResult permettant de créer une réservation
 *
 * @example
 * const { mutate: bookNow, isPending, error } = useCreateBooking();
 *
 * const handleBook = (formData: BookingRequest) => {
 *   bookNow(formData, {
 *     // Si succès
 *     onSuccess: (booking) => {
 *       showSuccess(`Réservation ${booking.id} créée!`);
 *       navigate(`/bookings/${booking.id}`);
 *     },
 *     // Si erreur
 *     onError: (error) => {
 *       showError(error.message); // "Payment declined", etc.
 *     }
 *   });
 * };
 *
 * <button
 *   onClick={() => handleBook(formData)}
 *   disabled={isPending}
 * >
 *   {isPending ? 'Réservation en cours...' : 'Confirmer réservation'}
 * </button>
 *
 * @note
 * - Invalidation automatique via onSuccess
 * - La liste "mes réservations" se remet à jour toute seule
 * - Aucun refetch manuel ni setQueryData() requis
 * - Erreur possible: "Payment declined", "Dates unavailable", etc.
 */
export const useCreateBooking = (): UseMutationResult<
  Booking,
  Error,
  BookingRequest,
  unknown
> => {
  return useMutation({
    // Fonction qui exécute la création de réservation
    mutationFn: (data: BookingRequest) =>
      bookingsService.createBooking(data),

    /**
     * Callback appelé quand la création réussit
     *
     * Invalidation stratégique:
     * - On invalide uniquement la liste "mes réservations"
     * - Pas besoin d'invalider les détails des autres (pas affectés)
     * - Not invalidating availability volontairement (l'utilisateur le sait)
     *
     * Processus:
     * 1. Mutation réussie sur le serveur
     * 2. onSuccess déclenché
     * 3. queryClient.invalidateQueries() marque cache 'my' comme stale
     * 4. Prochaine fois qu'un composant demande useMyBookings()
     * 5. Il refetch depuis le serveur
     * 6. Le composant se rerender avec la nouvelle réservation
     */
    onSuccess: () => {
      // Invalide la liste des PROPRES réservations de l'utilisateur
      // Force un refetch au prochain appel à useMyBookings()
      queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.myBookings(),
      });
    },
  });
};

/**
 * Hook pour annuler une réservation existante
 *
 * Cas d'usage: Bouton "Annuler la réservation" avec raison optionnelle
 *
 * Flux:
 * 1. Utilisateur clique "Annuler"
 * 2. Peut entrer raison de l'annulation (optionnel)
 * 3. Appelle mutate({ bookingId, reason })
 * 4. Serveur invalide la réservation (peut libérer refund)
 * 5. Si succès: invalide détail ET liste (cohérence)
 * 6. UI se met à jour automatiquement
 *
 * Points clés:
 * - Invalide DEUX caches: le détail ET la liste
 * - Important pour cohérence UI
 *
 * @returns UseMutationResult à passer { bookingId, reason? }
 *
 * @example
 * const { mutate: cancelBooking, isPending } = useCancelBooking();
 *
 * const handleCancel = (bookingId: string) => {
 *   if (confirm('Êtes-vous sûr de vouloir annuler?')) {
 *     cancelBooking(
 *       {
 *         bookingId,
 *         reason: 'Plans changed'
 *       },
 *       {
 *         onSuccess: () => {
 *           showSuccess('Réservation annulée');
 *           navigate('/my/bookings');
 *         },
 *         onError: (error) => {
 *           showError(`Erreur: ${error.message}`);
 *         }
 *       }
 *     );
 *   }
 * };
 *
 * <button
 *   onClick={() => handleCancel(bookingId)}
 *   disabled={isPending}
 *   className="danger"
 * >
 *   {isPending ? 'Annulation...' : 'Annuler la réservation'}
 * </button>
 *
 * @note
 * - Invalide le détail de la réservation (statut change)
 * - Invalide la liste (la réservation peut disparaître ou changer de catégorie)
 * - Peut avoir délais de remboursement selon conditions
 */
export const useCancelBooking = (): UseMutationResult<
  Booking,
  Error,
  { bookingId: string; reason?: string },
  unknown
> => {
  return useMutation({
    // Exécute l'annulation avec bookingId et raison optionnelle
    mutationFn: ({ bookingId, reason }) =>
      bookingsService.cancelBooking(bookingId, reason),

    /**
     * Callback de succès avec invalidation double
     *
     * Pourquoi invalider 2 caches?
     * - Le détail change: status → 'cancelled' (utilisateur voit sur page détail)
     * - La liste change: la réservation peut disparaître de 'upcoming' (si filtrée)
     *
     * Des deux invalidations:
     * 1. bookingsQueryKeys.booking(bookingId) - le détail spécifique
     * 2. bookingsQueryKeys.myBookings() - toute la liste
     *
     * queryClient refetch les deux au prochain render
     */
    onSuccess: (data) => {
      // Invalide le détail spécifique (statut change à 'cancelled')
      queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.booking(data.id),
      });

      // Invalide la liste complète (catégories filter peuvent changer)
      queryClient.invalidateQueries({
        queryKey: bookingsQueryKeys.myBookings(),
      });
    },
  });
};
