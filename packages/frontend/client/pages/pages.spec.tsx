import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BookingProvider } from "@/contexts/BookingContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Index from "./Index";
import SearchResults from "./SearchResults";
import PropertyDetails from "./PropertyDetails";
import MyWishlist from "./MyWishlist";
import BookOrNegotiate from "./BookOrNegotiate";
import Negotiation from "./Negotiation";
import PaymentMethod from "./PaymentMethod";
import PaymentProgress from "./PaymentProgress";
import PaymentSuccess from "./PaymentSuccess";
import ReviewInformation from "./ReviewInformation";
import RequestSent from "./RequestSent";
import TravelerInformation from "./TravelerInformation";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import Profile from "./Profile";
import NotFound from "./NotFound";

const renderPage = (
  element: React.ReactElement,
  { route = "/", path = "/" }: { route?: string; path?: string } = {}
) => {
  const queryClient = new QueryClient();
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BookingProvider>
            <Routes>
              <Route path={path} element={element} />
            </Routes>
          </BookingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe("pages smoke tests", () => {
  it("renders Index", () => {
    renderPage(<Index />);
    expect(screen.getByText("Your Stay, Your Price!")).toBeInTheDocument();
  });

  it("renders SearchResults", () => {
    renderPage(<SearchResults />, { route: "/search?destination=Yaounde", path: "/search" });
    expect(screen.getByText(/Your Results/)).toBeInTheDocument();
  });

  it("renders PropertyDetails", async () => {
    vi.useFakeTimers();
    renderPage(<PropertyDetails />, { route: "/property/1", path: "/property/:id" });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByText("Description")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("renders MyWishlist", () => {
    renderPage(<MyWishlist />, { route: "/my-wishlist", path: "/my-wishlist" });
    expect(screen.getByText(/favorites/i)).toBeInTheDocument();
  });

  it("renders BookOrNegotiate", () => {
    renderPage(<BookOrNegotiate />, { route: "/booking/method", path: "/booking/method" });
    expect(screen.getByText("Book instantly")).toBeInTheDocument();
  });

  it("renders Negotiation", () => {
    renderPage(<Negotiation />, { route: "/booking/negotiate", path: "/booking/negotiate" });
    expect(screen.getByText("Negotiate your Stay")).toBeInTheDocument();
  });

  it("renders PaymentMethod", () => {
    renderPage(<PaymentMethod />, { route: "/booking/payment", path: "/booking/payment" });
    expect(screen.getAllByText("Payment Method").length).toBeGreaterThan(0);
  });

  it("renders PaymentProgress", () => {
    renderPage(<PaymentProgress />, { route: "/booking/payment-progress", path: "/booking/payment-progress" });
    expect(screen.getByText("Payment in Progress")).toBeInTheDocument();
  });

  it("renders PaymentSuccess", () => {
    renderPage(<PaymentSuccess />, { route: "/booking/payment-success", path: "/booking/payment-success" });
    expect(screen.getByText("Booking confirmed!")).toBeInTheDocument();
  });

  it("renders ReviewInformation", () => {
    renderPage(<ReviewInformation />, { route: "/booking/review", path: "/booking/review" });
    expect(screen.getByText("Review Information")).toBeInTheDocument();
  });

  it("renders RequestSent", () => {
    renderPage(<RequestSent />, { route: "/booking/request-sent", path: "/booking/request-sent" });
    expect(screen.getByText("Negotiation request sent")).toBeInTheDocument();
  });

  it("renders TravelerInformation", () => {
    renderPage(<TravelerInformation />, { route: "/booking/confirm", path: "/booking/confirm" });
    expect(screen.getByText("Traveler Information")).toBeInTheDocument();
  });

  it("renders SignIn", () => {
    renderPage(<SignIn />, { route: "/sign-in", path: "/sign-in" });
    expect(screen.getByText("Connexion")).toBeInTheDocument();
  });

  it("renders SignUp", () => {
    renderPage(<SignUp />, { route: "/sign-up", path: "/sign-up" });
    expect(screen.getByText("Inscription")).toBeInTheDocument();
  });

  it("renders Profile", () => {
    renderPage(<Profile />, { route: "/profile", path: "/profile" });
    expect(screen.getByText("COMPTE")).toBeInTheDocument();
  });

  it("renders NotFound", () => {
    renderPage(<NotFound />, { route: "/does-not-exist", path: "*" });
    expect(screen.getByText("404")).toBeInTheDocument();
  });
});
