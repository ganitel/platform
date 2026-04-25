import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

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
  propertyData?: Record<string, unknown>;
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

  // Sync booking state to sessionStorage (write to external system, not setState)
  useEffect(() => {
    if (booking) {
      sessionStorage.setItem("ganitel_booking", JSON.stringify(booking));
    } else {
      sessionStorage.removeItem("ganitel_booking");
    }
  }, [booking]);

  const setBooking = useCallback((newBooking: BookingData) => {
    setBookingState(newBooking);
  }, []);

  const updateBooking = useCallback((updates: Partial<BookingData>) => {
    setBookingState((prev) => (prev ? { ...prev, ...updates } : (updates as BookingData)));
  }, []);

  const clearBooking = useCallback(() => {
    setBookingState(null);
  }, []);

  const calculateNights = useCallback(() => {
    if (!booking?.checkIn || !booking?.checkOut) return 0;
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    return Math.max(Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)), 0);
  }, [booking]);

  const getTotalGuests = useCallback(() => {
    return toBackendGuestCount(booking?.guests);
  }, [booking]);

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
