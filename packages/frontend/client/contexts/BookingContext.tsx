import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface GuestBreakdown {
  adults: number;
  children: number;
  infants: number;
}

/** Convert UI guest breakdown to backend numeric guests format. */
export function toBackendGuestCount(guests?: Partial<GuestBreakdown> | null): number {
  if (!guests) return 1;
  const adults = guests.adults ?? 0;
  const children = guests.children ?? 0;
  const infants = guests.infants ?? 0;
  return Math.max(1, adults + children + infants);
}

export interface BookingData {
  propertyId: string;
  propertyData?: any; // PropertyDetail
  checkIn?: string; // ISO 8601
  checkOut?: string; // ISO 8601
  guests: GuestBreakdown;
  bookingMethod?: "instant" | "negotiate";
  travelerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  negotiationData?: {
    proposedPrice?: number;
    message?: string;
  };
}

interface BookingContextType {
  booking: BookingData | null;
  setBooking: (booking: BookingData) => void;
  updateBooking: (updates: Partial<BookingData>) => void;
  clearBooking: () => void;
  calculateNights: () => number;
  /** Convert guests object { adults, children, infants } to a single number for the backend */
  getTotalGuests: () => number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  // Initialize from sessionStorage
  const [booking, setBookingState] = useState<BookingData | null>(() => {
    try {
      const stored = sessionStorage.getItem("ganitel_booking");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setBooking = useCallback((booking: BookingData) => {
    setBookingState(booking);
    // Persist to sessionStorage
    sessionStorage.setItem("ganitel_booking", JSON.stringify(booking));
  }, []);

  const updateBooking = useCallback((updates: Partial<BookingData>) => {
    setBookingState((prev) => {
      const updated = prev ? { ...prev, ...updates } : (updates as BookingData);
      sessionStorage.setItem("ganitel_booking", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearBooking = useCallback(() => {
    setBookingState(null);
    sessionStorage.removeItem("ganitel_booking");
  }, []);

  const calculateNights = useCallback(() => {
    if (!booking?.checkIn || !booking?.checkOut) return 0;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(nights, 0);
  }, [booking?.checkIn, booking?.checkOut]);

  const getTotalGuests = useCallback(() => {
    return toBackendGuestCount(booking?.guests);
  }, [booking?.guests]);

  return (
    <BookingContext.Provider
      value={{
        booking,
        setBooking,
        updateBooking,
        clearBooking,
        calculateNights,
        getTotalGuests,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingContext() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBookingContext must be used within BookingProvider");
  }
  return context;
}
