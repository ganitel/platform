import { Navigate, useLocation } from "react-router-dom";
import { useBookingContext } from "@/contexts/BookingContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface BookingGuardProps {
  children: React.ReactNode;
}

export const BookingGuard = ({ children }: BookingGuardProps) => {
  const { booking } = useBookingContext();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (!booking?.propertyId) {
      toast({
        title: "Session expirée",
        description: "Veuillez sélectionner une propriété pour recommencer votre réservation.",
        variant: "destructive",
      });
    }
  }, [booking, toast]);

  if (!booking?.propertyId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default BookingGuard;
