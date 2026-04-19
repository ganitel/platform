import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Handshake, Plus, Minus, Calendar, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookingContext } from "@/contexts/BookingContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface BookingMethodDrawerProps {
  propertyData: any;
  trigger: React.ReactNode;
}

interface BookingOption {
  id: "book" | "negotiate";
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function BookingMethodDrawer({ propertyData, trigger }: BookingMethodDrawerProps) {
  const navigate = useNavigate();
  const { updateBooking, booking } = useBookingContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"book" | "negotiate">("book");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<string>("14:00");
  const [checkOut, setCheckOut] = useState<string>("");
  const [checkOutTime, setCheckOutTime] = useState<string>("11:00");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [nights, setNights] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bookingOptions: BookingOption[] = [
    {
      id: "book",
      title: "Book instantly",
      description:
        "Secure your stay right away at the listed price. No waiting, no back-and-forth — just pack your bags.",
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: "negotiate",
      title: "Negotiate your stay",
      description:
        "Prefer to discuss the price first? Send an offer to the host and agree on a rate that works for both of you.",
      icon: <Handshake className="w-4 h-4" />,
    },
  ];

  // Load persisted booking data on mount
  useEffect(() => {
    if (booking?.checkIn) {
      const [date, time] = booking.checkIn.split('T');
      if (date) setCheckIn(date);
      if (time) setCheckInTime(time);
    }
    if (booking?.checkOut) {
      const [date, time] = booking.checkOut.split('T');
      if (date) setCheckOut(date);
      if (time) setCheckOutTime(time);
    }
    if (booking?.guests?.adults) setAdults(booking.guests.adults);
    if (booking?.guests?.children) setChildren(booking.guests.children);
    if (booking?.guests?.infants) setInfants(booking.guests.infants);
  }, [booking]);

  // Calculate nights
  useEffect(() => {
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const diff = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      setNights(Math.max(diff, 1));
    }
  }, [checkIn, checkOut]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!checkIn) newErrors.checkIn = "Check-in date is required";
    if (!checkOut) newErrors.checkOut = "Check-out date is required";
    
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      if (checkOutDate <= checkInDate) {
        newErrors.dates = "Check-out must be after check-in";
      }
    }
    
    const totalGuests = adults + children + infants;
    if (adults === 0) newErrors.guests = "At least 1 adult is required";
    if (propertyData?.max_guests && totalGuests > propertyData.max_guests) {
      newErrors.guests = `Maximum ${propertyData.max_guests} guests allowed`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) return;

    const bookingMethod: "instant" | "negotiate" = selectedOption === "book" ? "instant" : "negotiate";
    
    const guests = {
      adults,
      children,
      infants,
    };

    const checkInDateTime = `${checkIn}T${checkInTime}`;
    const checkOutDateTime = `${checkOut}T${checkOutTime}`;

    updateBooking({
      propertyId: propertyData?.id || "",
      propertyData,
      checkIn: checkInDateTime,
      checkOut: checkOutDateTime,
      guests,
      bookingMethod,
    });

    setIsOpen(false);

    if (selectedOption === "book") {
      navigate("/booking/confirm", { 
        state: { 
          propertyData, 
          bookingData: {
            checkIn: checkInDateTime,
            checkOut: checkOutDateTime,
            guests,
            nights,
            bookingMethod: "instant",
          }
        } 
      });
    } else if (selectedOption === "negotiate") {
      navigate("/booking/negotiate", { 
        state: { 
          propertyData,
          bookingData: {
            checkIn: checkInDateTime,
            checkOut: checkOutDateTime,
            guests,
            nights,
          }
        } 
      });
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-gray-100 flex items-center justify-between py-3">
          <DrawerTitle className="text-lg font-bold">Choose method</DrawerTitle>
          <DrawerClose asChild>
            <button className="p-1 hover:bg-gray-100 rounded-full transition">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </DrawerClose>
        </DrawerHeader>
        
        <div className="overflow-y-auto px-4 py-6 space-y-6 pb-32">
          {/* Dates Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-ganitel-secondary" />
              When do you want to stay?
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={cn(
                    "w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ganitel-secondary text-sm bg-ganitel-neutral-2",
                    errors.checkIn ? "border-red-500" : "border-gray-200"
                  )}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={cn(
                    "w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ganitel-secondary text-sm bg-ganitel-neutral-2",
                    errors.checkOut ? "border-red-500" : "border-gray-200"
                  )}
                />
              </div>
            </div>
            {errors.dates && <p className="text-red-500 text-xs">{errors.dates}</p>}
          </div>

          {/* Guests Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-ganitel-secondary" />
              How many guests?
            </h3>
            
            <div className="space-y-3 bg-ganitel-neutral-2 p-4 rounded-xl">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Adults</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setAdults(Math.max(1, adults - 1))} className="p-1 bg-white border border-gray-200 rounded-md">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center text-sm font-bold">{adults}</span>
                  <button onClick={() => setAdults(adults + 1)} className="p-1 bg-white border border-gray-200 rounded-md">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {/* Children */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Children</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setChildren(Math.max(0, children - 1))} className="p-1 bg-white border border-gray-200 rounded-md">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center text-sm font-bold">{children}</span>
                  <button onClick={() => setChildren(children + 1)} className="p-1 bg-white border border-gray-200 rounded-md">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Method Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">How would you like to book?</h3>
            <div className="grid gap-3">
              {bookingOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border-2 transition text-left",
                    selectedOption === option.id
                      ? "border-ganitel-primary bg-ganitel-neutral-1"
                      : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="mt-1">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      selectedOption === option.id ? "border-ganitel-primary bg-ganitel-primary" : "border-gray-300"
                    )}>
                      {selectedOption === option.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                       <span className="p-1 bg-gray-100 rounded-md">{option.icon}</span>
                       {option.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-ganitel-primary">
                  ${((propertyData?.pricing?.base_price || propertyData?.price_per_night || propertyData?.price || 0) * (nights || 1)).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 font-medium">/ {nights || 1} Nights</span>
              </div>
              <p className="text-xs text-gray-500">
                {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { day: 'numeric', month: 'long' }) : '23 July'} - {checkOut ? new Date(checkOut).toLocaleDateString('en-US', { day: 'numeric', month: 'long' }) : '30 July'}
              </p>
            </div>
            <Button
              onClick={handleContinue}
              className="bg-ganitel-secondary hover:bg-ganitel-secondary/90 text-white px-10 py-7 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all"
            >
              Continue
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
