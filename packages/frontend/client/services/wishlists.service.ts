/**
 * Wishlists Service — Local-First (sans backend)
 *
 * Toutes les opérations localStorage sont SYNCHRONES (comme BookingContext).
 * Les méthodes retournent des valeurs directes (pas de Promise) pour éviter
 * toute latence artificielle.
 *
 * Migration future : remplacer les corps par des appels `apiClient.*`
 * sans changer les signatures publiques.
 */

import type { ServiceListItem } from '@shared/api';
import { apiClient } from '@/lib/axios';

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

export interface WishlistEntry {
  propertyId: string;
  collectionId?: string; // Link to a specific collection
  addedAt: string; // ISO 8601
  /** Snapshot léger pour l'affichage hors-ligne (page favoris) */
  snapshot?: {
    id: string;
    title: string;
    main_image_url: string;
    price_per_night: number;
    currency: string;
    rating: number;
    location: {
      city: string;
      country: string;
      address: string;
    };
    type: string;
    bedrooms: number;
    bathrooms: number;
    max_guests: number;
    review_count: number;
  };
}

export interface WishlistCollection {
  id: string;
  name: string;
  count: number;
  imageUrl: string;
  description?: string;
  activeAlerts?: number;
}

export interface WishlistData {
  entries: WishlistEntry[];
  collections: WishlistCollection[];
  updatedAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Clé localStorage (versionnée pour éviter les conflits de schéma)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ganitel-wishlist-v2';

// ---------------------------------------------------------------------------
// Helpers internes (synchrones)
// ---------------------------------------------------------------------------

function read(): WishlistData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], collections: [], updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as WishlistData;
    return {
      entries: Array.isArray(parsed?.entries) ? parsed.entries : [],
      collections: Array.isArray(parsed?.collections) ? parsed.collections : [],
      updatedAt: parsed?.updatedAt || new Date().toISOString()
    };
  } catch {
    return { entries: [], collections: [], updatedAt: new Date().toISOString() };
  }
}

function write(data: WishlistData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('[WishlistService] localStorage write failed');
  }
}

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Service public (synchrone)
// ---------------------------------------------------------------------------

export const wishlistsService = {
  /** Lecture initiale (utilisée pour l'initialisation lazy du useState) */
  getInitialData(): WishlistData {
    return read();
  },

  /** Persiste un tableau d'entrées mis à jour */
  saveEntries(entries: WishlistEntry[]): void {
    const current = read();
    write({ ...current, entries, updatedAt: now() });
  },

  /** Persiste un tableau de collections mis à jour */
  saveCollections(collections: WishlistCollection[]): void {
    const current = read();
    write({ ...current, collections, updatedAt: now() });
  },

  /** Vide complètement la wishlist */
  clear(): void {
    write({ entries: [], collections: [], updatedAt: now() });
  },

  /** Toggle wishlist state for a service (backend) */
  async toggleService(serviceId: string) {
    const response = await apiClient.post(`/wishlists/services/${serviceId}/toggle`);
    return response.data;
  },

  /** Fetch current user wishlist (backend) */
  async getMyWishlist() {
    const response = await apiClient.get('/wishlists/me');
    return response.data;
  },
};
