import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLElement.prototype, "showPicker", {
  writable: true,
  value: vi.fn(),
});

if (!navigator.clipboard) {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn(),
    },
  });
}

if (!navigator.share) {
  Object.assign(navigator, {
    share: vi.fn(() => Promise.resolve()),
  });
}

vi.mock("@/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/hooks")>("@/hooks");
  return {
    ...actual,
    useWishlistState: () => ({
      entries: [],
      collections: [],
      addProperty: vi.fn(),
      addToFavorites: vi.fn(),
      removeProperty: vi.fn(),
      removeFromFavorites: vi.fn(),
      toggleProperty: vi.fn(),
      openCollectionPicker: vi.fn(),
      isFavorited: () => false,
      isInFavorites: () => false,
      isInWishlist: () => false,
      createCollection: vi.fn(),
      addCollection: vi.fn(),
      updateCollection: vi.fn(),
      removeCollection: vi.fn(),
      clearWishlist: vi.fn(),
      count: 0,
      favoritedIds: new Set<string>(),
    }),
    usePropertyWishlistToggle: () => ({
      isFavorited: false,
      toggle: vi.fn(),
    }),
    useServiceDetail: () => ({
      data: {
        id: "svc-test",
        title: "Test Property",
        description: "Test description",
        service_type: "accommodation",
        status: "active",
        provider_id: "provider-1",
        location: {
          country: "Cameroon",
          city: "Yaounde",
          address: "Test address",
        },
        pricing: {
          base_price: 120,
          currency: "USD",
          price_per: "night",
        },
        capacity: {
          max_guests: 2,
          bedrooms: 1,
          bathrooms: 1,
          beds: 1,
        },
        rating: {
          average: 4.8,
          count: 12,
        },
        images: ["/placeholder.svg"],
      },
      isLoading: false,
      isError: false,
      isSuccess: true,
    }),
  };
});

vi.mock("@/hooks/useServices", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useServices")>("@/hooks/useServices");
  return {
    ...actual,
    useServiceReviews: () => ({
      data: { items: [], total: 0, page: 1, pages: 1, per_page: 10 },
      isLoading: false,
      isError: false,
      isSuccess: true,
    }),
  };
});

vi.mock("@/hooks/useProfile", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useProfile")>("@/hooks/useProfile");

  const mockUser = {
    id: 'mock-user-1',
    email: 'demo@ganitel.com',
    phone: '+237600000000',
    first_name: 'Demo',
    last_name: 'User',
    user_type: 'traveler',
    status: 'active',
    is_verified: true,
    country: 'Cameroon',
    city: 'Douala',
    language: 'fr',
    currency: 'XAF',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    ...actual,
    useProfile: () => ({
      data: mockUser,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useUpdateProfile: () => ({
      mutateAsync: vi.fn().mockResolvedValue(mockUser),
      isLoading: false,
    }),
    useUploadAvatar: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ url: "", filename: "", size: 0 }),
      isLoading: false,
    }),
  };
});
