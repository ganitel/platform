import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/hooks/use-prelaunch", () => ({
  usePrelaunch: () => true,
}));
vi.mock("@/features/properties/components/property-gallery", () => ({
  PropertyGallery: () => <div data-testid="gallery" />,
}));
vi.mock("@/shared/components/mobile-detail-panel", () => ({
  MobileDetailPanel: () => null,
}));
vi.mock("@/shared/components/phone-input", () => ({
  PhoneInput: () => <input data-testid="phone" />,
}));

import PropertyDetailRoute from "./properties.$id";

const ROOM = {
  id: "room-1",
  title: "Coastline view duplex",
  description: "Sea view",
  bed_config: [{ type: "king", count: 1 }],
  max_guests: 2,
  amenities: [],
  private_bathroom: true,
  inventory_count: 2,
  position: 0,
  active: true,
  prices: [{ amount: "55000", currency: "XAF" }],
  media: [],
};

const INACTIVE_ROOM = {
  ...ROOM,
  id: "room-2",
  title: "Retired suite",
  active: false,
};

const HOTEL = {
  id: "hotel-1",
  kind: "hotel",
  title: "Hotel Limbola",
  property_type: "eco_lodge",
  address: null,
  city: "Kribi",
  country_code: "CM",
  location: { lat: 2.94, lng: 9.91 },
  capacity: null,
  bedrooms: 0,
  beds: null,
  bathrooms: null,
  prices: [],
  amenities: [],
  showcase_amenities: {
    has_wifi: false,
    has_ac: false,
    has_gym: false,
    smoking_allowed: false,
    pets_allowed: false,
    highlights: {},
  },
  listing_metadata: {
    parking_available: "none",
    elevator: false,
    accessible: false,
    private_bathroom: false,
    kitchen_type: "none",
    events_allowed: false,
    family_friendly: false,
    child_friendly: false,
    pets_allowed: false,
    smoking_allowed: false,
    check_in_time: null,
    check_out_time: null,
  },
  cover_media: null,
  distance_km: null,
  summary: {
    min_price: { amount: "55000", currency: "XAF" },
    max_capacity: 2,
    total_inventory: 2,
  },
  description: "By the sea.",
  house_rules: null,
  cancellation_policy: "flexible",
  content_language: "fr",
  status: "published",
  host: { id: "host-1", display_name: "Ganitel", avatar_url: null },
  media: [],
  created_at: "2026-01-01T00:00:00Z",
  published_at: "2026-01-02T00:00:00Z",
  rooms: [ROOM, INACTIVE_ROOM],
};

function renderDetail(property: typeof HOTEL) {
  const props = {
    loaderData: { property, locale: "fr" },
    params: { id: property.id },
    matches: [],
  } as unknown as Parameters<typeof PropertyDetailRoute>[0];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, enabled: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PropertyDetailRoute {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PropertyDetailRoute — prelaunch hotel", () => {
  it("lists active rooms in the page body, hiding inactive ones", () => {
    renderDetail(HOTEL);
    expect(screen.getByText("Coastline view duplex")).toBeInTheDocument();
    expect(screen.queryByText("Retired suite")).not.toBeInTheDocument();
  });

  it("hides the waitlist form until a room is chosen, then shows it with the room context", () => {
    renderDetail(HOTEL);
    expect(document.querySelector('input[type="email"]')).toBeNull();

    const roomCard = document.querySelector('[data-room-id="room-1"]');
    const chooseButton = roomCard?.querySelector("button");
    expect(chooseButton).toBeTruthy();
    fireEvent.click(chooseButton!);

    expect(document.querySelector('input[type="email"]')).toBeTruthy();
    expect(screen.getByTestId("waitlist-calendar")).toBeInTheDocument();
    expect(screen.getAllByText("Coastline view duplex").length).toBeGreaterThan(
      1,
    );
  });

  it("shows the waitlist form directly when the hotel has no active rooms", () => {
    renderDetail({ ...HOTEL, rooms: [INACTIVE_ROOM] });
    expect(document.querySelector('input[type="email"]')).toBeTruthy();
  });
});
