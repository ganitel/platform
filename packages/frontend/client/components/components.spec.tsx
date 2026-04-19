import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MOCK_PROPERTIES, getMockPropertyDetail } from "@/mockData";
import { servicesService } from "@/services/services.service";

import { AccompaniedServices } from "./AccompaniedServices";
import { AmenitiesList } from "./AmenitiesList";
import { BookingFooter } from "./BookingFooter";
import { BottomNav } from "./BottomNav";
import { FiltersModal } from "./FiltersModal";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { HostInfo } from "./HostInfo";
import { HouseRules } from "./HouseRules";
import { ListingRules } from "./ListingRules";
import { Neighborhood } from "./Neighborhood";
import { PromotionBanner } from "./PromotionBanner";
import { PropertyAccessibility } from "./PropertyAccessibility";
import { PropertyAmenities } from "./PropertyAmenities";
import { PropertyCard } from "./PropertyCard";
import { PropertyDescription } from "./PropertyDescription";
import { PropertyImageGallery } from "./PropertyImageGallery";
import { PropertyInfo } from "./PropertyInfo";
import { PropertySearchResultCard, PropertySearchResultSkeleton } from "./PropertySearchResultCard";
import { ReviewsSection } from "./ReviewsSection";
import { SearchBar } from "./SearchBar";
import { SearchModal } from "./SearchModal";
import { SimilarProperties } from "./SimilarProperties";

vi.mock("@/services/services.service", () => ({
  servicesService: {
    getServices: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement, route: string = "/") => {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
};

describe("components smoke tests", () => {
  beforeEach(() => {
    vi.mocked(servicesService.getServices).mockResolvedValue({
      items: MOCK_PROPERTIES.slice(0, 4),
      page: 1,
      per_page: 4,
      total: 4,
      pages: 1,
    } as any);
  });

  const property = MOCK_PROPERTIES[0] as any;
  const propertyDetail = getMockPropertyDetail("1");
  const images = propertyDetail?.images ?? [property.images?.[0] || ""];

  it("renders Header", () => {
    renderWithRouter(<Header />);
    expect(screen.getByAltText("Menu")).toBeInTheDocument();
  });

  it("renders Footer", () => {
    render(<Footer />);
    expect(screen.getByText("Useful Links")).toBeInTheDocument();
  });

  it("renders BottomNav", () => {
    renderWithRouter(<BottomNav />);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders BookingFooter", () => {
    renderWithRouter(
      <BookingFooter price={120} nights={2} checkIn="2025-08-01" checkOut="2025-08-03" />
    );
    expect(screen.getByRole("button", { name: "Book this property" })).toBeInTheDocument();
  });

  it("renders PromotionBanner", () => {
    render(
      <PromotionBanner
        title="Join now"
        buttonText="Join"
        imageUrl="/images/banner.png"
        variant="green"
      />
    );
    expect(screen.getByText("Join now")).toBeInTheDocument();
  });

  it("renders SearchBar", () => {
    renderWithRouter(<SearchBar />);
    expect(screen.getByText("Find a Stay, Make a Deal")).toBeInTheDocument();
  });

  it("renders SearchModal", () => {
    renderWithRouter(<SearchModal isOpen onClose={() => {}} />);
    expect(screen.getByPlaceholderText("Enter Your Destination")).toBeInTheDocument();
  });

  it("renders FiltersModal", () => {
    render(
      <FiltersModal
        isOpen
        onClose={() => {}}
        onApply={() => {}}
      />
    );
    expect(screen.getByText("Filters")).toBeInTheDocument();
  });

  it("renders AmenitiesList", () => {
    render(<AmenitiesList />);
    expect(screen.getByText("What you will find")).toBeInTheDocument();
  });

  it("renders AccompaniedServices", () => {
    render(<AccompaniedServices />);
    expect(screen.getByText("For your accessibility and convenience")).toBeInTheDocument();
  });

  it("renders PropertyCard", () => {
    renderWithRouter(<PropertyCard property={property} />);
    expect(screen.getByText(property.title)).toBeInTheDocument();
  });

  it("renders PropertySearchResultCard", () => {
    renderWithRouter(<PropertySearchResultCard property={property} />);
    expect(screen.getByText(property.title)).toBeInTheDocument();
  });

  it("renders PropertySearchResultSkeleton", () => {
    const { container } = render(<PropertySearchResultSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders PropertyInfo", () => {
    render(
      <PropertyInfo
        name="Test Property"
        location="Test City"
        price={120}
        nights={2}
        rating="4.9"
        reviews={12}
        bedrooms={2}
        bathrooms={1}
        livingrooms={1}
        maxGuests={3}
      />
    );
    expect(screen.getByText("Test Property")).toBeInTheDocument();
  });

  it("renders PropertyImageGallery", () => {
    renderWithRouter(
      <PropertyImageGallery
        images={images}
        property={property}
      />
    );
    expect(screen.getByAltText("Property Main")).toBeInTheDocument();
  });

  it("renders PropertyDescription", () => {
    render(<PropertyDescription description="Nice place" price={120} />);
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("renders PropertyAmenities", () => {
    render(
      <PropertyAmenities
        bedrooms={2}
        bathrooms={1}
        livingrooms={1}
        balconies={1}
        maxGuests={4}
      />
    );
    expect(screen.getByText("Max guests : 4")).toBeInTheDocument();
  });

  it("renders PropertyAccessibility", () => {
    render(<PropertyAccessibility />);
    expect(screen.getByText("For your accessibility and convenience")).toBeInTheDocument();
  });

  it("renders HostInfo", () => {
    render(
      <HostInfo
        host={{
          name: "Host",
          rating: "5.0",
          reviews: 12,
          avatar: "/images/avatar.png",
          message: "Welcome",
        }}
      />
    );
    expect(screen.getByText("Meet your host")).toBeInTheDocument();
  });

  it("renders HouseRules", () => {
    render(<HouseRules />);
    expect(screen.getByText("House Rules")).toBeInTheDocument();
  });

  it("renders ListingRules", () => {
    render(<ListingRules />);
    expect(screen.getByText("Listing rules")).toBeInTheDocument();
  });

  it("renders Neighborhood", () => {
    render(<Neighborhood />);
    expect(screen.getByText("Check out the neighbourhood")).toBeInTheDocument();
  });

  it("renders ReviewsSection", () => {
    render(<ReviewsSection propertyId="1" rating={4.9} totalReviews={10} />);
    expect(screen.getByText("Ratings and Reviews")).toBeInTheDocument();
  });

  it("renders SimilarProperties", () => {
    render(<SimilarProperties />);
    expect(screen.getByText("Properties you may also like")).toBeInTheDocument();
  });
});
