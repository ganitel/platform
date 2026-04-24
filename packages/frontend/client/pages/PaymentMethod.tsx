import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Receipt,
  Mail,
  ChevronDown,
  ChevronUp,
  User,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBookingContext } from "@/contexts/BookingContext";
import { z } from "zod";

type PaymentMethodType = "card" | "mobile" | "orange" | "paypal";

// Validation schemas
const cardSchema = z.object({
  cardholder: z.string().min(3, "Cardholder name must be at least 3 characters"),
  cardNumber: z.string().regex(/^\d{16}$/, "Must be 16 digits"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid date (MM/YY)"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
});

const mobileSchema = z.object({
  phone: z.string().regex(/^\+\d{1,4}\s?\d{6,14}$/, "Invalid phone number format"),
});

const orangeSchema = z.object({
  phone: z.string().regex(/^\+\d{1,4}\s?\d{6,14}$/, "Invalid phone number format"),
});

const paypalSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export default function PaymentMethod() {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking } = useBookingContext();
  
  const propertyData = location.state?.propertyData || booking?.propertyData;
  const bookingData = location.state?.bookingData;
  const travelerData = location.state?.travelerData;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("mobile");
  const [cardData, setCardData] = useState({
    cardholder: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });
  const [mobileData, setMobileData] = useState({
    phone: "+237",
  });
  const [orangeData, setOrangeData] = useState({
    phone: "+237",
  });
  const [paypalData, setPaypalData] = useState({
    email: "",
  });
  const [_errors, setErrors] = useState<Record<string, string>>({});

  // Calculate pricing details
  const calculateNights = () => {
    if (booking?.checkIn && booking?.checkOut) {
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);
      const diff = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(diff, 1);
    }
    return bookingData?.pricing?.nights || 1;
  };

  const nights = calculateNights();
  const pricePerNight = bookingData?.pricing?.price_per_night || propertyData?.pricing?.base_price || propertyData?.price_per_night || propertyData?.price || 0;
  const subtotal = bookingData?.pricing?.subtotal || (nights * pricePerNight);
  const serviceFee = bookingData?.pricing?.service_fee || propertyData?.service_fee || 0;
  const cleaningFee = bookingData?.pricing?.cleaning_fee || propertyData?.cleaning_fee || 0;
  const taxes = bookingData?.pricing?.taxes || propertyData?.taxes || 0;
  const total = bookingData?.pricing?.total || (subtotal + serviceFee + cleaningFee + taxes);
  const _currency = bookingData?.pricing?.currency || propertyData?.pricing?.currency || propertyData?.currency || "USD";

  const handlePay = () => {
    // Validate based on payment method
    try {
      if (paymentMethod === "card") {
        cardSchema.parse(cardData);
      } else if (paymentMethod === "mobile") {
        mobileSchema.parse(mobileData);
      } else if (paymentMethod === "orange") {
        orangeSchema.parse(orangeData);
      } else if (paymentMethod === "paypal") {
        paypalSchema.parse(paypalData);
      }
      
      // Clear errors if validation passes
      setErrors({});
      
      // Navigate to payment progress
      navigate("/booking/payment-progress", {
        state: {
          propertyData,
          bookingData,
          travelerData,
          paymentMethod,
          paymentData:
            paymentMethod === "card"
              ? cardData
              : paymentMethod === "mobile"
                ? mobileData
                : paymentMethod === "orange"
                  ? orangeData
                  : paypalData,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const _handleEditReview = () => {
    navigate(-1); // Go back to ReviewInformation
  };

  // Calculate cancellation deadline (e.g., 7 days before check-in)
  const _getCancellationDeadline = () => {
    if (booking?.checkIn) {
      const checkInDate = new Date(booking.checkIn);
      const cancellationDate = new Date(checkInDate);
      cancellationDate.setDate(cancellationDate.getDate() - 7); // 7 days before check-in
      return cancellationDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    return "Jul 30, 2025"; // Default fallback
  };

  return (
    <div className="min-h-screen bg-ganitel-neutral-1 flex flex-col md:w-[360px] mx-auto pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => navigate("/")}
          className="p-0 w-6 h-6 flex items-center justify-center"
          aria-label="Go to home"
        >
          <img
            src="/icons/Menu, Burger, Square.svg"
            alt="Home"
            className="w-6 h-6"
          />
        </button>

        <div className="flex-1 flex justify-center">
          <svg width="77" height="24" viewBox="0 0 77 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0)">
              <path d="M10.2999 6.7069C9.2699 6.36053 8.14875 6.18916 6.93644 6.18916C6.00671 6.18916 5.12801 6.32771 4.30219 6.60846C3.47454 6.88555 2.73986 7.28662 2.09816 7.80982C1.45464 8.33303 0.942369 9.01484 0.565005 9.8516C0.187641 10.6902 -0.00195312 11.629 -0.00195312 12.67H4.60116C4.59752 12.6044 4.59569 12.5351 4.59569 12.4676C4.59569 11.6801 4.83268 11.0657 5.30485 10.6246C5.77883 10.1852 6.35672 10.1852 6.35672 9.96463C7.03671 9.96463C7.45236 9.96463 7.88077 10.0357 8.32011 10.1761V14.8211C7.92999 14.9214 7.50158 14.9706 7.03671 14.9706C6.70492 14.9706 6.40048 14.9196 6.12156 14.8193L3.39433 17.9859C3.60033 18.0752 3.81362 18.1518 4.03603 18.2229C4.82357 18.4726 5.68039 18.5966 6.60101 18.5966C7.22266 18.5966 7.79691 18.5419 8.32011 18.4344V18.8208C8.32011 19.9092 7.53439 20.4524 5.9666 20.4524C5.20093 20.4524 4.53371 20.3157 3.96128 20.0423C3.45448 19.7998 2.97868 19.4443 2.53751 18.9831L0.116543 21.7887C0.721784 22.3921 1.5075 22.9007 2.47188 23.32C3.51282 23.774 4.77435 24 6.25281 24C7.21537 24 8.09041 23.8834 8.87431 23.6518C9.65821 23.4167 10.3564 23.0648 10.9671 22.5927C11.576 22.1205 12.0536 21.4806 12.3946 20.6748C12.7355 19.8709 12.905 18.9266 12.905 17.8492V8.03223C12.1995 7.49262 11.3317 7.05145 10.3017 6.7069H10.2999Z" fill="#18100C" />
              <path d="M24.4739 7.62755C23.3764 6.71969 21.8323 6.26211 19.8398 6.26211C18.9447 6.26211 18.0805 6.38607 17.2493 6.63036C16.4198 6.87464 15.7927 7.11893 15.3679 7.36503C14.945 7.60932 14.5931 7.85725 14.3106 8.10518C14.502 9.41775 15.12 10.3767 16.1664 10.9837C16.5237 10.7103 16.9922 10.4696 17.5719 10.2655C18.1553 10.0631 18.7733 9.96101 19.4278 9.96101C20.1843 9.96101 20.7294 10.085 21.0666 10.3347C21.4021 10.5845 21.5698 10.9053 21.5698 11.2955V11.6309C20.9062 11.4814 20.1679 11.3939 19.353 11.3702C17.6922 11.3447 16.3724 11.6582 15.3916 12.3091C14.4126 12.9617 13.9241 13.9224 13.9241 15.1931C13.9241 16.553 14.4236 17.563 15.4226 18.2193C16.4234 18.8737 17.8034 19.2019 19.5645 19.2019C21.8396 19.2019 24.0236 18.7953 26.1164 17.9823V11.8551C26.1164 9.9446 25.5695 8.53723 24.4739 7.62755ZM21.5698 16.0152C21.0302 16.1319 20.6 16.1903 20.2755 16.1903C19.7012 16.1903 19.2619 16.0863 18.9538 15.8785C18.6475 15.6707 18.4925 15.3845 18.4925 15.0181C18.4925 14.3217 19.0066 13.9735 20.0366 13.9735C20.6 13.9735 21.1104 14.0227 21.568 14.123V16.0171L21.5698 16.0152Z" fill="#18100C" />
              <path d="M38.4037 7.59653C37.4046 6.65955 35.8897 6.18916 33.8643 6.18916C33.0841 6.18916 32.333 6.26026 31.6093 6.40063C30.8874 6.54283 30.2621 6.72695 29.7279 6.94936C29.1974 7.17359 28.749 7.39235 28.3844 7.60929C28.0198 7.82441 27.7098 8.04135 27.4619 8.25646V18.768C28.1692 18.8846 28.9331 18.943 29.7534 18.943C30.5738 18.943 31.3522 18.8846 32.0577 18.768V10.661C32.4916 10.4186 32.9893 10.2982 33.5526 10.2982C34.0758 10.2982 34.5024 10.4331 34.8305 10.7048C35.1587 10.9746 35.3228 11.4249 35.3228 12.0556V18.768C36.0283 18.8846 36.7939 18.943 37.6143 18.943C38.4346 18.943 39.2003 18.8846 39.9058 18.768V11.4704C39.9058 9.82608 39.4063 8.53538 38.4037 7.59653Z" fill="#18100C" />
              <path d="M43.754 6.44986C42.9155 6.44986 42.1516 6.51002 41.4625 6.62669V18.768C42.1917 18.8846 42.9574 18.943 43.754 18.943C44.6018 18.943 45.3692 18.8846 46.0583 18.768V6.62487C45.3291 6.5082 44.5616 6.44804 43.754 6.44804V6.44986ZM45.6591 0.778458C45.1286 0.260722 44.4924 3.05176e-05 43.754 3.05176e-05C43.0157 3.05176e-05 42.3995 0.258899 41.88 0.778458C41.3623 1.29619 41.1016 1.91237 41.1016 2.62882C41.1016 3.34526 41.3604 3.9979 41.88 4.52293C42.4014 5.04614 43.0248 5.30683 43.754 5.30683C44.4833 5.30683 45.1286 5.04614 45.6591 4.52293C46.1896 3.9979 46.4558 3.36714 46.4558 2.62882C46.4558 1.8905 46.1896 1.29802 45.6591 0.778458Z" fill="#18100C" />
              <path d="M57.7859 15.9605C57.4085 15.3425 57.0075 14.9068 56.5827 14.6589C56.1014 15.0837 55.6238 15.2951 55.1516 15.2951C54.6357 15.2951 54.2602 15.1766 54.0232 14.9396C53.7862 14.7008 53.6677 14.3308 53.6677 13.824V10.3985H57.6528C57.7859 9.71853 57.8515 9.06771 57.8515 8.44242C57.8515 7.85359 57.7859 7.24834 57.6528 6.6267H53.6677V3.69711C52.9549 3.57314 52.2056 3.51116 51.4254 3.51116C50.6871 3.51116 49.905 3.57314 49.0846 3.69711V6.62487H47.0429C46.9353 7.28845 46.8806 7.90281 46.8806 8.46794C46.8806 9.1224 46.9353 9.76593 47.0429 10.3967H49.0846V14.9943C49.0846 16.4126 49.5532 17.4663 50.492 18.15C51.429 18.8336 52.6833 19.1782 54.2511 19.1782C55.1662 19.1782 55.9501 19.0542 56.6046 18.8099C57.2627 18.5656 57.8716 18.2265 58.4349 17.7963C58.3766 17.1911 58.1596 16.5767 57.7822 15.9587L57.7859 15.9605Z" fill="#18100C" />
              <path d="M71.0084 11.9299C71.0138 10.1944 70.4815 8.81798 69.4078 7.79526C68.3322 6.77438 66.9029 6.26211 65.1164 6.26211C63.215 6.26211 61.6472 6.87829 60.4148 8.10518C59.1806 9.33571 58.5645 10.909 58.5645 12.825C58.5645 14.854 59.1788 16.4254 60.4075 17.5466C61.6344 18.6659 63.2423 19.2292 65.2276 19.2292C67.4863 19.2292 69.3622 18.6677 70.8552 17.5466C70.8133 16.9559 70.6638 16.3817 70.4068 15.822C70.1497 15.2623 69.8052 14.7993 69.3731 14.4329C68.0514 15.2478 66.8573 15.6543 65.7854 15.6543C64.9651 15.6543 64.3562 15.5194 63.966 15.2496C63.5759 14.9798 63.3316 14.5021 63.2314 13.8222H70.8771C70.961 13.3336 71.0029 12.7028 71.0029 11.928L71.0084 11.9299ZM63.2113 11.4449C63.3936 10.2399 64.0371 9.63833 65.1419 9.63833C65.7052 9.68755 66.1209 9.87532 66.387 10.198C66.6532 10.5207 66.7881 10.9381 66.7881 11.4449H63.2131H63.2113Z" fill="#18100C" />
              <path d="M74.5194 1.82852C73.6735 1.82852 72.9188 1.88686 72.2534 2.00353V18.768C73.0191 18.8846 73.8103 18.943 74.6325 18.943C75.4546 18.943 76.2349 18.8847 76.9003 18.768V2.00353C76.1346 1.88686 75.3434 1.82852 74.5194 1.82852Z" fill="#18100C" />
              <path d="M2.60689 16.8174C2.10191 16.8174 1.66803 16.6369 1.3089 16.2741C0.949766 15.9113 0.769287 15.4756 0.769287 14.9634C0.769287 14.4511 0.949766 14.0427 1.3089 13.6836C1.66803 13.3245 2.10009 13.144 2.60689 13.144C3.11369 13.144 3.5585 13.3245 3.92675 13.6836C4.295 14.0427 4.47912 14.4693 4.47912 14.9634C4.47912 15.4574 4.295 15.9113 3.92675 16.2741C3.5585 16.6369 3.11915 16.8174 2.60689 16.8174Z" fill="#18100C" />
            </g>
            <defs>
              <clipPath id="clip0">
                <rect width="76.9003" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <button
          className="p-0 w-6 h-6 flex items-center justify-center"
          aria-label="Profile"
        >
          <img
            src="/icons/User, Circle.png"
            alt="User"
            className="w-6 h-6"
          />
        </button>
      </div>

      {/* Secondary Header with Back Button and Title */}
      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-700 hover:text-gray-900 transition"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 font-bold" />
        </button>
        <h2 className="text-xl font-extrabold text-[#18100C] absolute left-1/2 transform -translate-x-1/2">Pay to confirm</h2>
        <div className="w-5"></div>
      </div>

      <div className="h-4"></div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {/* Your trip Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-50 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 border border-gray-100 rounded-lg shadow-sm">
              <Calendar className="w-6 h-6 text-[#18100C]" />
            </div>
            <h2 className="text-xl font-bold text-[#18100C]">Your trip</h2>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Check-in</p>
              <p className="font-extrabold text-[15px] text-[#18100C]">
                {booking?.checkIn
                  ? new Date(booking.checkIn).toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'long' 
                    })
                  : "Wed, 23 July"}
              </p>
              <p className="text-sm text-gray-400 font-medium">
                {booking?.checkIn
                  ? new Date(booking.checkIn).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })
                  : "5:00 PM"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Check-out</p>
              <p className="font-extrabold text-[15px] text-[#18100C]">
                {booking?.checkOut
                  ? new Date(booking.checkOut).toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'long' 
                    })
                  : "Wed, 30 July"}
              </p>
              <p className="text-sm text-gray-400 font-medium">
                {booking?.checkOut
                  ? new Date(booking.checkOut).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })
                  : "12:00 PM"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-[#18100C]">
                Total guest : {(booking?.guests?.adults || 0) + (booking?.guests?.children || 0) + (booking?.guests?.infants || 0) || 4}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-[#18100C] capitalize">
                1 {propertyData?.type || "Apartment"}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 flex items-center gap-3">
            <Receipt className="w-6 h-6 text-[#18100C]" />
            <p className="text-xl font-extrabold text-[#18100C]">
              Total : $ {total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Price Details Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-50 space-y-4">
          <h2 className="text-[17px] font-extrabold text-[#18100C]">Price details</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-[15px] font-medium text-gray-500">
              <span>Subtotal: $ {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[15px] font-medium text-gray-500">
              <span>Extra: $ {(serviceFee + cleaningFee + taxes).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Receipt className="w-6 h-6 text-[#18100C]" />
            <p className="text-xl font-extrabold text-[#18100C]">
              Total: $ {total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payment Method Selection Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-50 space-y-6">
          <h2 className="text-[17px] font-extrabold text-[#18100C]">Payment method</h2>

          <div className="space-y-4">
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setPaymentMethod("card")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition",
                    paymentMethod === "card" ? "border-amber-700 bg-amber-700" : "border-gray-300"
                  )}>
                    {paymentMethod === "card" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-[#1D1B4B] p-0.5 rounded-sm overflow-hidden">
                      <img src="/icons/card.png" className="w-5 h-5 object-contain" alt="Card" />
                    </div>
                    <span className={cn(
                      "font-bold transition",
                      paymentMethod === "card" ? "text-[#18100C]" : "text-gray-400"
                    )}>Card</span>
                  </div>
                </div>
                {paymentMethod === "card" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {paymentMethod === "card" && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[15px] font-extrabold text-[#18100C]">Card holder</label>
                    <Input
                      value={cardData.cardholder}
                      onChange={(e) => setCardData({ ...cardData, cardholder: e.target.value })}
                      placeholder="Gedeon Atcheng"
                      className="w-full h-[60px] rounded-2xl bg-[#F6F5F5] border-none text-[16px] font-extrabold text-[#18100C]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[15px] font-extrabold text-[#18100C]">Card number</label>
                    <Input
                      value={cardData.cardNumber}
                      onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value.replace(/\s/g, '').slice(0, 16) })}
                      placeholder="4242 4242 4242 4242"
                      className="w-full h-[60px] rounded-2xl bg-[#F6F5F5] border-none text-[16px] font-extrabold text-[#18100C]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[15px] font-extrabold text-[#18100C]">Expiry date</label>
                      <Input
                        value={cardData.expiryDate}
                        onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })}
                        placeholder="MM/AA"
                        className="w-full h-[60px] rounded-2xl bg-[#F6F5F5] border-none text-[16px] font-extrabold text-[#18100C]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[15px] font-extrabold text-[#18100C]">CVV</label>
                      <Input
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.slice(0, 4) })}
                        placeholder="123"
                        className="w-full h-[60px] rounded-2xl bg-[#F6F5F5] border-none text-[16px] font-extrabold text-[#18100C]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Money Option */}
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setPaymentMethod("mobile")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition",
                    paymentMethod === "mobile" ? "border-amber-700 bg-amber-700" : "border-gray-300"
                  )}>
                    {paymentMethod === "mobile" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                  <div className="bg-[#004E3A] p-0.5 rounded-sm overflow-hidden">
                       <img src="/icons/momo.png" className="w-5 h-5 object-contain" alt="MTN" />
                  </div>
                    <span className={cn(
                      "font-bold transition",
                      paymentMethod === "mobile" ? "text-[#18100C]" : "text-gray-400"
                    )}>Mobile Money</span>
                  </div>
                </div>
                {paymentMethod === "mobile" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
              
              {paymentMethod === "mobile" && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[15px] font-extrabold text-[#18100C]">Phone Number</label>
                    <div className="flex items-center gap-3">
                      <div className="w-[60px] h-[60px] bg-[#18100C] rounded-2xl flex items-center justify-center overflow-hidden">
                        <span className="text-2xl">🇨🇲</span>
                      </div>
                      <div className="relative flex-1">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 font-extrabold text-[#18100C] text-[16px]">
                          +237
                        </div>
                        <Input
                          value={mobileData.phone.replace("+237", "")}
                          onChange={(e) => setMobileData({ ...mobileData, phone: "+237" + e.target.value })}
                          placeholder=""
                          className="w-full h-[60px] rounded-2xl bg-[#F6F5F5] border-none pl-16 text-[16px] font-extrabold text-[#18100C]"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-gray-400 leading-tight">
                    You will receive a confirmation text message.<br />
                    The estimated amount in <span className="text-[#18100C] font-extrabold">CFA francs is 132,000.</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setPaymentMethod("orange")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition",
                    paymentMethod === "orange" ? "border-amber-700 bg-amber-700" : "border-gray-300"
                  )}>
                    {paymentMethod === "orange" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-black p-0.5 rounded-sm overflow-hidden">
                      <img src="/icons/orange.png" className="w-5 h-5 object-contain" alt="Orange" />
                    </div>
                    <span className={cn(
                      "font-bold transition",
                      paymentMethod === "orange" ? "text-[#18100C]" : "text-gray-400"
                    )}>Orange Money</span>
                  </div>
                </div>
                {paymentMethod === "orange" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {paymentMethod === "orange" && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[15px] font-extrabold text-[#18100C]">Phone Number</label>
                    <div className="flex items-center gap-3">
                      <div className="w-[60px] h-[60px] bg-[#18100C] rounded-2xl flex items-center justify-center overflow-hidden">
                        <span className="text-3xl">🇨🇲</span>
                      </div>
                      <div className="relative flex-1">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 font-extrabold text-[#18100C] text-[16px]">
                          +237
                        </div>
                        <Input
                          value={orangeData.phone.replace("+237", "")}
                          onChange={(e) => setOrangeData({ ...orangeData, phone: "+237" + e.target.value })}
                          placeholder=""
                          className="w-full h-[60px] rounded-2xl bg-[#F6F5F5] border-none pl-16 text-[16px] font-extrabold text-[#18100C]"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-gray-400 leading-tight">
                    You will receive a confirmation text message.<br />
                    The estimated amount in <span className="text-[#18100C] font-extrabold">CFA francs is 132,000.</span>
                  </p>
                </div>
              )}
            </div>

            {/* PayPal Option */}
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setPaymentMethod("paypal")}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition",
                    paymentMethod === "paypal" ? "border-amber-700 bg-amber-700" : "border-gray-300"
                  )}>
                    {paymentMethod === "paypal" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <img src="/icons/paypal.png" className="w-20 h-5 object-contain" alt="PayPal" />
                    </div>
                  </div>
                </div>
                {paymentMethod === "paypal" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {paymentMethod === "paypal" && (
                <div className="space-y-2 pt-2">
                  <label className="text-[15px] font-extrabold text-[#18100C]">Email</label>
                  <div className="flex gap-2">
                    <div className="w-[60px] h-[60px] bg-[#18100C] rounded-2xl flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <Input
                      value={paypalData.email}
                      onChange={(e) => setPaypalData({ ...paypalData, email: e.target.value })}
                      placeholder="user@mail.com"
                      className="flex-1 h-[60px] rounded-2xl bg-[#F6F5F5] border-none text-[16px] font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancellation Policy Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-50 space-y-4">
          <h2 className="text-[17px] font-extrabold text-[#18100C]">Cancellation Policy</h2>
          <div className="bg-[#F6F5F5] rounded-2xl p-5 space-y-1">
            <p className="text-[14px] font-medium text-gray-400">
              Free cancellation until <span className="text-[#18100C] font-bold">Jul 30, 2025</span>
            </p>
            <p className="text-[14px] font-medium text-gray-400">
              Fees apply after this date
            </p>
          </div>
        </div>

        {/* Pay Button */}
        <div className="p-4 px-6 md:pb-8">
          <Button
            onClick={handlePay}
            className="w-full h-[60px] bg-[#D39E70] hover:bg-[#C28D5F] text-white rounded-2xl font-bold text-lg transition active:scale-[0.98]"
          >
            Pay
          </Button>
        </div>
      </div>
    </div>
  );
}
