import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import PropertyDetails from "./pages/PropertyDetails";
import BookOrNegotiate from "./pages/BookOrNegotiate";
import TravelerInformation from "./pages/TravelerInformation";
import ReviewInformation from "./pages/ReviewInformation";
import PaymentMethod from "./pages/PaymentMethod";
import PaymentProgress from "./pages/PaymentProgress";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import MyWishlist from "./pages/MyWishlist";
import MyBookings from "./pages/MyBookings";
import RequestSent from "./pages/RequestSent";
import Negotiation from "./pages/Negotiation";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Profile from "./pages/Profile";
import PersonalInformation from "./pages/PersonalInformation";
import EditPersonalInformation from "./pages/EditPersonalInformation";
import NotificationSettings from "./pages/NotificationSettings";
import LanguageSelection from "./pages/LanguageSelection";
import MyProperties from "./pages/MyProperties";
import Payments from "./pages/Payments";
import About from "./pages/About";
import Help from "./pages/Help";
import Offers from "./pages/Offers";
// import Support from "./pages/Support";
// import Policies from "./pages/Policies";
import { WishlistProvider } from "./contexts/WishlistContext";
import { BookingProvider } from "./contexts/BookingContext";
import ProtectedRoute from "./components/ProtectedRoute";
import BookingGuard from "./components/BookingGuard";
import { AuthProvider } from "./contexts/AuthContext";
import OAuthCallback from "./pages/OAuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BookingProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route path="/offers" element={<Offers />} />
            {/* <Route path="/support" element={<Support />} /> */}
            {/* <Route path="/policies" element={<Policies />} /> */}
            
            {/* Protected User Routes */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/personal-information" element={<ProtectedRoute><PersonalInformation /></ProtectedRoute>} />
            <Route path="/profile/personal-information/edit" element={<ProtectedRoute><EditPersonalInformation /></ProtectedRoute>} />
            <Route path="/profile/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
            <Route path="/profile/language" element={<ProtectedRoute><LanguageSelection /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/my-properties" element={<ProtectedRoute><MyProperties /></ProtectedRoute>} />
            <Route path="/my-wishlist" element={<ProtectedRoute><MyWishlist /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            
            <Route path="/property/:id" element={<PropertyDetails />} />
            
            {/* Protected Booking Routes */}
            <Route path="/booking/method" element={<ProtectedRoute><BookOrNegotiate /></ProtectedRoute>} />
            
            <Route path="/booking/negotiate" element={
              <ProtectedRoute>
                <BookingGuard>
                  <Negotiation />
                </BookingGuard>
              </ProtectedRoute>
            } />
            
            <Route path="/booking/request-sent" element={
              <ProtectedRoute>
                <BookingGuard>
                  <RequestSent />
                </BookingGuard>
              </ProtectedRoute>
            } />
            
            <Route path="/booking/confirm" element={
              <ProtectedRoute>
                <BookingGuard>
                  <TravelerInformation />
                </BookingGuard>
              </ProtectedRoute>
            } />
            
            <Route path="/booking/review" element={
              <ProtectedRoute>
                <BookingGuard>
                  <ReviewInformation />
                </BookingGuard>
              </ProtectedRoute>
            } />
            
            <Route path="/booking/payment" element={
              <ProtectedRoute>
                <BookingGuard>
                  <PaymentMethod />
                </BookingGuard>
              </ProtectedRoute>
            } />
            
            <Route path="/booking/payment-progress" element={
              <ProtectedRoute>
                <BookingGuard>
                  <PaymentProgress />
                </BookingGuard>
              </ProtectedRoute>
            } />
            
            <Route path="/booking/payment-success" element={
              <ProtectedRoute>
                <BookingGuard>
                  <PaymentSuccess />
                </BookingGuard>
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WishlistProvider>
  </BookingProvider>
</AuthProvider>
</QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
