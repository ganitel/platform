import { Sparkles, Star } from "lucide-react";
import { BookingMethodDrawer } from "./BookingMethodDrawer";

interface BookingFooterProps {
  price: number;
  nights: number;
  checkIn: string;
  checkOut: string;
  propertyData?: any;
  rating?: number;
  discount?: number;
}

export function BookingFooter({
  price,
  nights,
  checkIn,
  checkOut,
  propertyData,
  rating,
  discount = 0
}: BookingFooterProps) {
  const totalPrice = price * nights;
  const discountedPrice = discount > 0 ? totalPrice * (1 - discount / 100) : totalPrice;
  const hasDiscount = discount > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-ganitel-neutral-3 z-50 transition-all duration-300">
      <div className="max-w-screen-md mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Left: Price Section */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <p className="text-ganitel-text-title text-xl font-bold">
              ${price.toLocaleString()}
            </p>
            <span className="text-ganitel-text-label text-sm font-normal">
              / Night
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" strokeWidth={0} />
            <span className="text-ganitel-text-label text-xs font-semibold">
              {rating || '5.0'}
            </span>
            <span className="text-ganitel-text-label/40 text-xs">|</span>
            <span className="text-ganitel-text-label/60 text-xs font-medium">
              Excellent
            </span>
          </div>
        </div>

        {/* Right: CTA Button with Drawer */}
        <BookingMethodDrawer
          propertyData={propertyData}
          trigger={
            <button
              className="bg-ganitel-secondary hover:bg-ganitel-secondary/90 active:scale-[0.98] text-white rounded-xl px-8 py-3.5 flex items-center justify-center transition-all duration-200 shadow-md font-bold text-base min-w-[180px]"
            >
              Book this property
            </button>
          }
        />
      </div>

      {/* iPhone Home Indicator Spacing */}
      <div className="h-4 bg-white md:hidden" />
    </div>
  );
}
