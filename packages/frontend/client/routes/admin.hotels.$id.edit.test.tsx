import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/components/admin-guard", () => ({
  AdminGuard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/properties/components/hotel-form", () => ({
  HotelForm: () => <div data-testid="hotel-form" />,
}));
vi.mock("@/features/properties/components/room-type-manager", () => ({
  RoomTypeManager: ({ propertyId }: { propertyId: string }) => (
    <div data-testid="room-type-manager" data-property-id={propertyId} />
  ),
}));

const getProperty = vi.fn();
vi.mock("@/features/properties/api", () => ({
  getProperty: (id: string) => getProperty(id),
  updateProperty: vi.fn(),
}));

import AdminHotelsEditRoute from "./admin.hotels.$id.edit";

const HOTEL = {
  id: "hotel-1",
  title: "Hôtel Wouri",
  media: [],
};

function renderEditPage(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/admin/hotels/:id/edit"
            element={<AdminHotelsEditRoute />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AdminHotelsEditPage rooms section", () => {
  beforeEach(() => {
    getProperty.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders the room manager for the hotel once the detail loads", async () => {
    getProperty.mockResolvedValue(HOTEL);
    renderEditPage("/admin/hotels/hotel-1/edit");

    const manager = await screen.findByTestId("room-type-manager");
    expect(manager).toHaveAttribute("data-property-id", "hotel-1");
    expect(screen.getByTestId("hotel-form")).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls to the rooms section mounting after async load when navigated with #rooms", async () => {
    let resolveDetail: (value: typeof HOTEL) => void;
    getProperty.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDetail = resolve;
        }),
    );
    renderEditPage("/admin/hotels/hotel-1/edit#rooms");

    expect(screen.queryByTestId("room-type-manager")).not.toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    resolveDetail!(HOTEL);
    await screen.findByTestId("room-type-manager");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("shows a translated message instead of the raw code when the load fails", async () => {
    const { ApiError } = await import("@/shared/api/client");
    getProperty.mockRejectedValue(
      new ApiError("property.not_found", 404, {
        type: "about:blank#property.not_found",
        title: "property.not_found",
        status: 404,
      }),
    );
    renderEditPage("/admin/hotels/hotel-1/edit");

    expect(
      await screen.findByText(/logement introuvable|stay not found/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/property\.not_found/)).not.toBeInTheDocument();
  });
});
