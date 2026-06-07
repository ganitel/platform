import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { PropertyCard } from "./property-card";
import type { PropertyPublic } from "@/features/properties/types";

const BASE: PropertyPublic = {
  id: "prop-1",
  kind: "rental",
  title: "Villa Bonanjo",
  property_type: "villa",
  address: null,
  city: "Douala",
  country_code: "CM",
  location: { lat: 4.05, lng: 9.7 },
  capacity: 6,
  bedrooms: 3,
  beds: 4,
  bathrooms: 2,
  prices: [{ amount: "85000", currency: "XAF" }],
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
  summary: null,
};

const HOTEL: PropertyPublic = {
  ...BASE,
  id: "hotel-1",
  kind: "hotel",
  title: "Hotel Limbola",
  property_type: "hotel",
  capacity: null,
  bedrooms: 0,
  beds: null,
  bathrooms: null,
  prices: [],
  summary: {
    min_price: { amount: "45000", currency: "XAF" },
    max_capacity: 4,
    total_inventory: 12,
  },
};

function renderCard(property: PropertyPublic) {
  return render(
    <MemoryRouter>
      <PropertyCard property={property} />
    </MemoryRouter>,
  );
}

describe("PropertyCard", () => {
  it("shows capacity and bedrooms from the property columns for rentals", () => {
    renderCard(BASE);
    const stats = screen.getByText(/6/);
    expect(stats.textContent).toContain("3");
  });

  it("shows the room inventory from the hotel summary, not the bedrooms column", () => {
    renderCard(HOTEL);
    const stats = screen.getByText(/12/);
    expect(stats.textContent).not.toContain("0");
  });

  it("shows the minimum room price for hotels even though property.prices is empty", () => {
    renderCard(HOTEL);
    expect(screen.getByText(/45[\s\u00a0\u202f]?000/)).toBeInTheDocument();
  });

  it("hides the price line for hotels with no active rooms", () => {
    renderCard({
      ...HOTEL,
      summary: { min_price: null, max_capacity: 0, total_inventory: 0 },
    });
    expect(
      screen.queryByText(/45[\s\u00a0\u202f]?000/),
    ).not.toBeInTheDocument();
  });
});
