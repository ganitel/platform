/**
 * Wishlist Hooks — Couche déclarative sur le WishlistContext
 *
 * Chaque hook expose une tranche précise de l'état pour minimiser
 * les re-renders dans les composants consumers.
 */

import { useCallback } from 'react';
import type { ServiceListItem } from '@shared/api';
import { useWishlist } from '@/contexts/WishlistContext';

// ---------------------------------------------------------------------------
// Query keys (prêts pour une intégration React Query côté backend)
// ---------------------------------------------------------------------------

export const wishlistQueryKeys = {
    all: ['wishlist'] as const,
    entries: () => [...wishlistQueryKeys.all, 'entries'] as const,
    ids: () => [...wishlistQueryKeys.all, 'ids'] as const,
    count: () => [...wishlistQueryKeys.all, 'count'] as const,
};

// ---------------------------------------------------------------------------
// Hook : état complet de la wishlist
// ---------------------------------------------------------------------------

/**
 * Réexporte `useWishlist` avec un nom sémantique.
 * Utilisable quand on a besoin de l'ensemble de l'état.
 */
export function useWishlistState() {
    return useWishlist();
}

// ---------------------------------------------------------------------------
// Hook : toggle par propriété (boutons de carte, PropertyCard, etc.)
// ---------------------------------------------------------------------------

/**
 * Retourne le statut favori et un handler de toggle pour une propriété.
 *
 * @example
 * ```tsx
 * const { isFavorited, toggle } = usePropertyWishlistToggle(property);
 * <button onClick={toggle}>{isFavorited ? '❤️' : '🤍'}</button>
 * ```
 */
export function usePropertyWishlistToggle(property: ServiceListItem) {
    const { isFavorited, toggleProperty } = useWishlist();

    const toggle = useCallback(() => {
        if (property) toggleProperty(property);
    }, [toggleProperty, property]);

    return {
        isFavorited: property ? isFavorited(property.id) : false,
        toggle,
    };
}

// ---------------------------------------------------------------------------
// Hook : liste des entrées (page "Mes Favoris")
// ---------------------------------------------------------------------------

/**
 * Retourne les entrées complètes de la wishlist avec leurs snapshots.
 * Optimisé pour la page de listing des favoris.
 */
export function useWishlistEntries() {
    const { entries, count, clearWishlist } = useWishlist();

    return {
        entries,
        count,
        clearWishlist,
        isEmpty: entries.length === 0,
    };
}

// ---------------------------------------------------------------------------
// Hook : opérations CRUD uniquement
// ---------------------------------------------------------------------------

/**
 * Expose uniquement les méthodes de mutation.
 * Idéal pour les composants qui ne lisent pas l'état.
 */
export function useWishlistActions() {
    const { addProperty, removeProperty, toggleProperty, clearWishlist } =
        useWishlist();
    return { addProperty, removeProperty, toggleProperty, clearWishlist };
}

// ---------------------------------------------------------------------------
// Hook : compteur (BottomNav, badges, etc.)
// ---------------------------------------------------------------------------

/**
 * Retourne uniquement le nombre de favoris.
 * Minimise les re-renders pour les composants qui n'ont besoin que du badge.
 */
export function useWishlistCount(): number {
    const { count } = useWishlist();
    return count;
}
