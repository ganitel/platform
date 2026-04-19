/**
 * WishlistContext — Contexte global des favoris (Wishlist) et des collections
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

import type { ServiceListItem } from '@shared/api';
import { wishlistsService, type WishlistEntry, type WishlistCollection } from '@/services/wishlists.service';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types du contexte
// ---------------------------------------------------------------------------

export interface WishlistContextValue {
  /** IDs de toutes les propriétés favorites (Set pour lookup O(1)) */
  favoritedIds: Set<string>;

  /** Entrées complètes (avec snapshot) */
  entries: WishlistEntry[];

  /** Collections de propriétés (folders) */
  collections: WishlistCollection[];

  /** Nombre total de favoris */
  count: number;

  /** Vérifie si une propriété est dans les favoris */
  isFavorited: (propertyId: string) => boolean;

  /** Vérifie si une propriété est dans la collection Favorites (sans collectionId) */
  isInFavorites: (propertyId: string) => boolean;

  /** Ajoute une propriété aux favoris */
  addProperty: (property: ServiceListItem, collectionId?: string) => void;

  /** Ajoute une propriété aux favorites (collection par défaut) */
  addToFavorites: (property: ServiceListItem) => void;

  /** Retire une propriété des favoris */
  removeProperty: (propertyId: string) => void;

  /** Retire une propriété uniquement des favorites */
  removeFromFavorites: (propertyId: string) => void;

  /** Toggle : ajoute ou retire selon l'état actuel */
  toggleProperty: (property: ServiceListItem) => void;

  /** Ouvre le picker pour choisir une collection */
  openCollectionPicker: (property: ServiceListItem) => void;

  /** Vérifie si une collection est dans la liste */
  isInWishlist: (collectionId: string) => boolean;

  /** Crée une nouvelle collection */
  createCollection: (name: string, imageUrl: string, description?: string) => void;

  /** Ajoute une collection existante */
  addCollection: (collection: WishlistCollection) => void;

  /** Met à jour une collection existante */
  updateCollection: (collectionId: string, updates: Partial<WishlistCollection>) => void;

  /** Retire une collection */
  removeCollection: (collectionId: string) => void;

  /** Vide complètement la wishlist */
  clearWishlist: () => void;
}

// ---------------------------------------------------------------------------
// Création du contexte
// ---------------------------------------------------------------------------

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helper : snapshot minimal d'une propriété
// ---------------------------------------------------------------------------

function buildSnapshot(property: ServiceListItem): WishlistEntry['snapshot'] {
  return {
    id: property.id,
    title: property.title,
    main_image_url: property.images?.[0] || '',
    price_per_night: property.pricing.base_price,
    currency: property.pricing.currency,
    rating: property.rating.average,
    location: property.location,
    type: property.accommodation_type || property.service_type,
    bedrooms: property.capacity.bedrooms || 0,
    bathrooms: property.capacity.bathrooms || 0,
    max_guests: property.capacity.max_guests,
    review_count: property.rating.count,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(() => {
    const initial = wishlistsService.getInitialData();
    // Default mock collections if empty
    if (initial.collections.length === 0) {
      initial.collections = [
        {
          id: "col-default",
          name: "My favorites",
          count: 0,
          imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=300&h=300",
          activeAlerts: 0
        }
      ];
    }
    return initial;
  });

  const [pickingProperty, setPickingProperty] = useState<ServiceListItem | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");

  const entries = data.entries;
  const collections = data.collections;

  // ---------------------------------------------------------------------------
  // Actions Propriétés
  // ---------------------------------------------------------------------------

  const addProperty = useCallback((property: ServiceListItem, collectionId?: string) => {
    setData((prev) => {
      // If already in this collection, don't duplicate
      if (prev.entries.some((e) => e.propertyId === property.id && e.collectionId === collectionId)) return prev;

      const nextEntries = [
        ...prev.entries,
        {
          propertyId: property.id,
          collectionId,
          addedAt: new Date().toISOString(),
          snapshot: buildSnapshot(property),
        },
      ];
      wishlistsService.saveEntries(nextEntries);

      let nextCollections = prev.collections;
      if (collectionId) {
        nextCollections = prev.collections.map(c =>
          c.id === collectionId ? { ...c, count: c.count + 1 } : c
        );
        wishlistsService.saveCollections(nextCollections);
      }

      toast.success(`Added to ${collectionId ? prev.collections.find(c => c.id === collectionId)?.name : 'Favorites'}`);
      return { ...prev, entries: nextEntries, collections: nextCollections };
    });
  }, []);

  const addToFavorites = useCallback((property: ServiceListItem) => {
    setData((prev) => {
      const alreadyFavorite = prev.entries.some(
        (entry) => entry.propertyId === property.id && !entry.collectionId,
      );
      if (alreadyFavorite) return prev;

      const nextEntries = [
        ...prev.entries,
        {
          propertyId: property.id,
          collectionId: undefined,
          addedAt: new Date().toISOString(),
          snapshot: buildSnapshot(property),
        },
      ];
      wishlistsService.saveEntries(nextEntries);

      toast.success("Added to Favorites");
      return { ...prev, entries: nextEntries };
    });
  }, []);

  const removeProperty = useCallback((propertyId: string) => {
    setData((prev) => {
      const entry = prev.entries.find(e => e.propertyId === propertyId);
      const nextEntries = prev.entries.filter((e) => e.propertyId !== propertyId);
      wishlistsService.saveEntries(nextEntries);

      let nextCollections = prev.collections;
      if (entry?.collectionId) {
        nextCollections = prev.collections.map(c =>
          c.id === entry.collectionId ? { ...c, count: Math.max(0, c.count - 1) } : c
        );
        wishlistsService.saveCollections(nextCollections);
      }

      return { ...prev, entries: nextEntries, collections: nextCollections };
    });
  }, []);

  const removeFromFavorites = useCallback((propertyId: string) => {
    setData((prev) => {
      const nextEntries = prev.entries.filter(
        (entry) => !(entry.propertyId === propertyId && !entry.collectionId),
      );
      wishlistsService.saveEntries(nextEntries);
      return { ...prev, entries: nextEntries };
    });
  }, []);

  const toggleProperty = useCallback((property: ServiceListItem) => {
    setData((prev) => {
      const isFav = prev.entries.some((e) => e.propertyId === property.id);
      if (isFav) {
        // Handle removal (if in multiple collections, this removes all - or we could refine)
        const entriesToRemove = prev.entries.filter(e => e.propertyId === property.id);
        const nextEntries = prev.entries.filter((e) => e.propertyId !== property.id);
        wishlistsService.saveEntries(nextEntries);

        let nextCollections = prev.collections;
        entriesToRemove.forEach(entry => {
          if (entry.collectionId) {
            nextCollections = nextCollections.map(c =>
              c.id === entry.collectionId ? { ...c, count: Math.max(0, c.count - 1) } : c
            );
          }
        });
        wishlistsService.saveCollections(nextCollections);

        return { ...prev, entries: nextEntries, collections: nextCollections };
      } else {
        // Trigger collection picker
        setPickingProperty(property);
        return prev;
      }
    });
  }, []);

  const openCollectionPicker = useCallback((property: ServiceListItem) => {
    setSelectedCollectionId(null);
    setNewCollectionName("");
    setPickingProperty(property);
  }, []);

  const addPropertyToNewCollection = useCallback((property: ServiceListItem, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setData((prev) => {
      const cityName = property.location?.city?.trim();
      const countryName = property.location?.country?.trim();
      const cityLabel = cityName && countryName ? `${cityName} ${countryName}` : cityName || "";
      const normalizedCity = cityName?.toLowerCase() || "";
      const normalizedName = trimmedName.toLowerCase();
      const fullName =
        cityName && !normalizedName.startsWith(normalizedCity)
          ? `${cityName} - ${trimmedName}`
          : trimmedName;

      const id = `col-${Date.now()}`;
      const newCollection: WishlistCollection = {
        id,
        name: fullName,
        imageUrl: property.images?.[0] || '',
        count: 1,
        description: cityLabel ? `Collection for ${cityLabel}` : "Created from search results",
        activeAlerts: 0,
      };

      const nextEntries = [
        ...prev.entries,
        {
          propertyId: property.id,
          collectionId: id,
          addedAt: new Date().toISOString(),
          snapshot: buildSnapshot(property),
        },
      ];
      const nextCollections = [...prev.collections, newCollection];

      wishlistsService.saveEntries(nextEntries);
      wishlistsService.saveCollections(nextCollections);

      toast.success(`Added to ${newCollection.name}`);
      return { ...prev, entries: nextEntries, collections: nextCollections };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Actions Collections
  // ---------------------------------------------------------------------------

  const createCollection = useCallback((name: string, imageUrl: string, description?: string) => {
    setData((prev) => {
      const id = `col-${Date.now()}`;
      const nextCollections = [
        ...prev.collections,
        { id, name, imageUrl, count: 0, description, activeAlerts: 0 }
      ];
      wishlistsService.saveCollections(nextCollections);
      return { ...prev, collections: nextCollections };
    });
  }, []);

  const addCollection = useCallback((collection: WishlistCollection) => {
    setData((prev) => {
      if (prev.collections.some((c) => c.id === collection.id)) return prev;
      const nextCollections = [...prev.collections, collection];
      wishlistsService.saveCollections(nextCollections);
      return { ...prev, collections: nextCollections };
    });
  }, []);

  const updateCollection = useCallback((collectionId: string, updates: Partial<WishlistCollection>) => {
    setData((prev) => {
      const nextCollections = prev.collections.map(c =>
        c.id === collectionId ? { ...c, ...updates } : c
      );
      wishlistsService.saveCollections(nextCollections);
      return { ...prev, collections: nextCollections };
    });
  }, []);

  const removeCollection = useCallback((collectionId: string) => {
    setData((prev) => {
      const nextCollections = prev.collections.filter((c) => c.id !== collectionId);
      const nextEntries = prev.entries.map(e =>
        e.collectionId === collectionId ? { ...e, collectionId: undefined } : e
      );

      wishlistsService.saveCollections(nextCollections);
      wishlistsService.saveEntries(nextEntries);

      return { ...prev, collections: nextCollections, entries: nextEntries };
    });
  }, []);

  const isInWishlist = (collectionId: string) => {
    return collections.some((c) => c.id === collectionId);
  };

  const clearWishlist = useCallback(() => {
    setData({ entries: [], collections: [], updatedAt: new Date().toISOString() });
    wishlistsService.clear();
  }, []);

  // ---------------------------------------------------------------------------
  // Valeur mémoïsée du contexte
  // ---------------------------------------------------------------------------

  const favoritedIds = useMemo(
    () => new Set(entries.map((e) => e.propertyId)),
    [entries],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      favoritedIds,
      entries,
      collections,
      count: entries.length,
      isFavorited: (propertyId: string) => favoritedIds.has(propertyId),
      isInFavorites: (propertyId: string) =>
        entries.some((entry) => entry.propertyId === propertyId && !entry.collectionId),
      addProperty,
      addToFavorites,
      removeProperty,
      removeFromFavorites,
      toggleProperty,
      openCollectionPicker,
      isInWishlist,
      createCollection,
      addCollection,
      updateCollection,
      removeCollection,
      clearWishlist,
    }),
    [
      favoritedIds,
      entries,
      collections,
      addProperty,
      addToFavorites,
      removeProperty,
      removeFromFavorites,
      toggleProperty,
      openCollectionPicker,
      isInWishlist,
      createCollection,
      addCollection,
      updateCollection,
      removeCollection,
      clearWishlist,
    ],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}

      {/* Global Collection Picker Bottom Sheet */}
      <Drawer open={!!pickingProperty} onOpenChange={(open) => !open && setPickingProperty(null)}>
        <DrawerContent className="rounded-t-2xl border border-ganitel-stroke-neutral p-0">
          <div className="mx-auto mt-3 h-px w-[33px] bg-[#E1E0DF]" />
          <div className="px-4 pb-6 pt-6">
            <DrawerHeader className="p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path
                    d="M16.5518 6.66667H27.9998C28.3535 6.66667 28.6926 6.80714 28.9426 7.05719C29.1927 7.30724 29.3332 7.64638 29.3332 8V26.6667C29.3332 27.0203 29.1927 27.3594 28.9426 27.6095C28.6926 27.8595 28.3535 28 27.9998 28H3.99984C3.64622 28 3.30708 27.8595 3.05703 27.6095C2.80698 27.3594 2.6665 27.0203 2.6665 26.6667V5.33333C2.6665 4.97971 2.80698 4.64057 3.05703 4.39052C3.30708 4.14048 3.64622 4 3.99984 4H13.8852L16.5518 6.66667ZM5.33317 9.33333V25.3333H26.6665V9.33333H5.33317Z"
                    fill="#000000"
                  />
                </svg>
                <DrawerTitle className="text-[28px] font-bold leading-7 text-ganitel-text-title">
                  Add to a collection
                </DrawerTitle>
                </div>
                <button
                  type="button"
                  onClick={() => setPickingProperty(null)}
                  className="flex h-6 w-6 items-center justify-center text-[#18100C]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DrawerHeader>

            {(() => {
              const cityName = pickingProperty?.location?.city?.trim();
              const countryName = pickingProperty?.location?.country?.trim();
              const cityLabel = cityName && countryName ? `${cityName} ${countryName}` : cityName || "";
              const normalizedCity = cityName?.toLowerCase() || "";
              const cityMatches = cityName
                ? collections.filter((collection) => collection.name.toLowerCase().startsWith(normalizedCity))
                : collections;
              const visibleCollections = cityMatches.length > 0 ? cityMatches : collections;

              return (
                <div className="mt-8 flex flex-col gap-6">
                  {cityLabel ? (
                    <div className="flex items-center gap-2">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 2C9.87827 2 7.84344 2.84285 6.34315 4.34315C4.84285 5.84344 4 7.87827 4 10C4 11.892 4.402 13.13 5.5 14.5L12 22L18.5 14.5C19.598 13.13 20 11.892 20 10C20 7.87827 19.1571 5.84344 17.6569 4.34315C16.1566 2.84285 14.1217 2 12 2Z"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-[14px] font-normal leading-4 tracking-[-0.28px] text-[#67615F]">
                        city detected :
                      </span>
                      <span className="text-[16px] font-normal leading-4 tracking-[-0.32px] text-[#18100C]">
                        {cityLabel}
                      </span>
                    </div>
                  ) : null}

                  <div className="h-px w-full bg-[#E1E0DF]" />

                  <div className="flex flex-col gap-3">
                    {visibleCollections.length === 0 ? (
                      <div className="rounded-lg bg-[#F6F5F5] px-4 py-3 text-[14px] text-[#67615F]">
                        No collections yet. Create one below.
                      </div>
                    ) : (
                      visibleCollections.map((collection) => {
                        const name = collection.name;
                        const displayCity = cityName && name.toLowerCase().startsWith(normalizedCity);
                        const suffix = displayCity ? name.slice(cityName.length) : "";

                        return (
                          <button
                            key={collection.id}
                            type="button"
                            onClick={() => setSelectedCollectionId(collection.id)}
                            className="flex items-center gap-2 text-left"
                          >
                            <span
                              className={
                                selectedCollectionId === collection.id
                                  ? "h-4 w-4 rounded-full border border-[#18100C] bg-[#18100C]"
                                  : "h-4 w-4 rounded-full border border-[#777]"
                              }
                              aria-hidden="true"
                            />
                            <span className="text-[16px] font-normal leading-4 tracking-[-0.32px]">
                              <span className="text-[#18100C]">
                                {displayCity ? cityName : name}
                              </span>
                              {displayCity ? (
                                <span className="text-[#67615F]">{suffix}</span>
                              ) : null}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="h-px w-full bg-[#E1E0DF]" />

                  <div className="flex flex-col gap-3">
                    <span className="text-[16px] font-normal leading-4 tracking-[-0.32px] text-[#18100C]">
                      Create a new collection
                    </span>
                    <input
                      value={newCollectionName}
                      onChange={(event) => setNewCollectionName(event.target.value)}
                      placeholder="collection name"
                      className="h-11 w-full rounded-lg bg-[#F6F5F5] px-4 text-[16px] font-normal leading-4 tracking-[-0.32px] text-[#18100C] placeholder:text-[#67615F]"
                    />
                    {pickingProperty ? (
                      <div className="flex items-center gap-2">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M3 6.25C3 5.38805 3.34241 4.5614 3.9519 3.9519C4.5614 3.34241 5.38805 3 6.25 3H15.75C16.612 3 17.4386 3.34241 18.0481 3.9519C18.6576 4.5614 19 5.38805 19 6.25V15.75C19 16.612 18.6576 17.4386 18.0481 18.0481C17.4386 18.6576 16.612 19 15.75 19H6.25C5.38805 19 4.5614 18.6576 3.9519 18.0481C3.34241 17.4386 3 16.612 3 15.75V6.25ZM15.28 9.03C15.4125 8.88783 15.4846 8.69978 15.4812 8.50548C15.4777 8.31118 15.399 8.12579 15.2616 7.98838C15.1242 7.85097 14.9388 7.77225 14.7445 7.76883C14.5502 7.7654 14.3622 7.83752 14.22 7.97L10 12.19L8.03 10.22C7.96134 10.1463 7.87854 10.0872 7.78654 10.0462C7.69454 10.0052 7.59523 9.98318 7.49452 9.98141C7.39382 9.97963 7.29379 9.99816 7.2004 10.0359C7.10701 10.0736 7.02218 10.1297 6.95096 10.201C6.87974 10.2722 6.8236 10.357 6.78588 10.4504C6.74816 10.5438 6.72963 10.6438 6.73141 10.7445C6.73319 10.8452 6.75523 10.9445 6.79622 11.0365C6.83721 11.1285 6.89631 11.2113 6.97 11.28L9.47 13.78C9.61063 13.9205 9.80125 13.9993 10 13.9993C10.1988 13.9993 10.3894 13.9205 10.53 13.78L15.28 9.03ZM6.5 20C6.79406 20.4602 7.19934 20.8388 7.67841 21.101C8.15748 21.3632 8.69489 21.5004 9.241 21.5H16.246C16.936 21.5 17.6192 21.3641 18.2566 21.1001C18.8941 20.836 19.4733 20.449 19.9611 19.9611C20.449 19.4733 20.836 18.8941 21.1001 18.2566C21.3641 17.6192 21.5 16.936 21.5 16.246V9.241C21.5003 8.69479 21.3629 8.15732 21.1006 7.67825C20.8382 7.19917 20.4594 6.79394 19.999 6.5V16.246C19.9991 16.7389 19.9022 17.2271 19.7136 17.6825C19.5251 18.138 19.2486 18.5518 18.9001 18.9004C18.5516 19.249 18.1378 19.5256 17.6824 19.7142C17.227 19.9029 16.7389 20 16.246 20H6.5Z"
                            fill="#000000"
                          />
                        </svg>
                        <span className="text-[14px] font-bold leading-4 tracking-[-0.28px] text-[#18100C]">
                          Add {pickingProperty.title}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="px-4 pb-6">
            <button
              type="button"
              onClick={() => {
                if (!pickingProperty) return;
                const trimmedName = newCollectionName.trim();

                if (trimmedName) {
                  addPropertyToNewCollection(pickingProperty, trimmedName);
                  setPickingProperty(null);
                  setSelectedCollectionId(null);
                  setNewCollectionName("");
                  return;
                }

                if (!selectedCollectionId) {
                  toast.error("Please choose a collection or create a new one");
                  return;
                }

                addProperty(pickingProperty, selectedCollectionId);
                setPickingProperty(null);
                setSelectedCollectionId(null);
                setNewCollectionName("");
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#18100C] text-[16px] font-normal leading-4 tracking-[-0.32px] text-white"
            >
              Add to collection
              <span className="flex items-center rounded bg-[rgba(116,112,109,0.40)] p-0.5">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M15.8337 9.99992H4.16699" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.667 14.1667L15.8337 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.667 5.83325L15.8337 9.99992" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </WishlistContext.Provider>
  );
}


export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a <WishlistProvider>');
  }
  return context;
}

export type { WishlistEntry, WishlistCollection };
