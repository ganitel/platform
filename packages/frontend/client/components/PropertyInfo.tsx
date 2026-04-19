import { Star, Clock, User } from "lucide-react";

interface PropertyInfoProps {
  name: string;
  location: string;
  price: number;
  nights: number;
  rating: string;
  reviews: number;
  bedrooms: number;
  bathrooms: number;
  livingrooms: number;
  maxGuests: number;
}

export function PropertyInfo({
  name,
  location,
  price,
  nights,
  rating,
  reviews,
  bedrooms,
  bathrooms,
  livingrooms,
  maxGuests,
}: PropertyInfoProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-ganitel-text-title text-xl font-bold tracking-tight">
          {name}
        </h1>
        <p className="text-ganitel-text-label text-base font-normal">
          {location}
        </p>
      </div>

      <p className="text-ganitel-text-title text-xl font-bold">
        $ {price.toLocaleString()} for {nights} {nights > 1 ? 'Nights' : 'Night'}
      </p>

      <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
        {/* Rating - Reverted to brand green */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-ganitel-accent-green rounded-lg shrink-0">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" strokeWidth={0} />
          <span className="text-ganitel-primary text-sm font-bold">
            {rating} ({reviews})
          </span>
        </div>

        {/* Nights */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDECEC] rounded-lg shrink-0">
          <Clock className="w-3.5 h-3.5 text-ganitel-text-label" />
          <span className="text-ganitel-text-label text-sm font-bold">
            {nights} {nights > 1 ? 'Nights' : 'Night'}
          </span>
        </div>

        {/* Guests */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDECEC] rounded-lg shrink-0">
          <User className="w-3.5 h-3.5 text-ganitel-text-label" />
          <span className="text-ganitel-text-label text-sm font-bold">
            Max guests {maxGuests}
          </span>
        </div>

        {/* Bedrooms */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDECEC] rounded-lg shrink-0">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path
              d="M1.2 2.39996C0.805313 2.39996 0.48 2.72528 0.48 3.11996V6.76496C0.480937 6.77996 0.48375 6.79496 0.4875 6.80996C0.4875 6.81278 0.4875 6.81465 0.4875 6.81746C0.379687 6.98715 0.291563 7.16809 0.225 7.36496C0.0759374 7.80465 0.0121875 8.30903 0 8.87996V9.11996C0 9.12746 0 9.13496 0 9.14246V12H1.68V11.04C1.68 10.8403 1.72875 10.7362 1.7925 10.6725C1.85625 10.6087 1.96031 10.56 2.16 10.56H9.84C10.0397 10.56 10.1438 10.6087 10.2075 10.6725C10.2712 10.7362 10.32 10.8403 10.32 11.04V12H12V9.15746C12.0009 9.14528 12.0009 9.13215 12 9.11996C12 9.03746 12.0019 8.95965 12 8.87996C11.9878 8.30903 11.9241 7.80465 11.775 7.36496C11.7084 7.16996 11.6194 6.99278 11.5125 6.82496C11.5172 6.80528 11.52 6.78559 11.52 6.76496V3.11996C11.52 2.72528 11.1947 2.39996 10.8 2.39996H1.2Z"
              fill="#74706D"
            />
          </svg>
          <span className="text-ganitel-text-label text-sm font-bold">
            Bedrooms {bedrooms}
          </span>
        </div>

        {/* Bathrooms */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDECEC] rounded-lg shrink-0">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path
              d="M11.625 6C11.6254 6.24442 11.5458 6.48226 11.3984 6.67723C10.8136 7.45491 10.4982 8.40199 10.5 9.375C10.5 9.67337 10.3815 9.95952 10.1705 10.1705C9.95952 10.3815 9.67337 10.5 9.375 10.5H3.375C3.07663 10.5 2.79048 10.3815 2.57951 10.1705C2.36853 9.95952 2.25 9.67337 2.25 9.375C2.25177 8.40199 1.93637 7.45491 1.3516 6.67723C1.20419 6.48226 1.12462 6.24442 1.125 6H11.625Z"
              fill="white"
              stroke="#74706D"
              strokeWidth="0.375"
            />
          </svg>
          <span className="text-ganitel-text-label text-sm font-bold">
            Bathrooms {bathrooms}
          </span>
        </div>

        {/* Living */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDECEC] rounded-lg shrink-0">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="shrink-0">
            <path
              d="M11.5763 4.31579C11.3155 4.0543 10.952 3.89197 10.5533 3.89197C10.5278 3.89197 10.5022 3.89261 10.4769 3.89401V3.2065C10.4769 2.74604 10.2896 2.32707 9.98789 2.02567C9.68646 1.72393 9.26735 1.53648 8.80692 1.53662H3.1931C2.73265 1.53648 2.31354 1.72393 2.01213 2.02567C1.7104 2.32707 1.52309 2.74604 1.52309 3.2065V3.89401C1.4978 3.89261 1.47218 3.89197 1.44673 3.89197C1.04789 3.89197 0.684728 4.0543 0.423704 4.31579C0.162329 4.57682 -0.000326938 4.94 1.18665e-06 5.33868C-0.000326938 5.59546 0.0674074 5.83855 0.185579 6.04804C0.299204 6.24981 0.460126 6.42078 0.652946 6.54777C0.659392 6.57039 0.669447 6.61832 0.676525 6.695C0.68515 6.78442 0.690822 6.91297 0.690822 7.08976C0.690822 7.72794 0.690822 8.18903 0.690822 8.18903C0.690657 8.55329 0.839321 8.88582 1.07834 9.12437C1.31688 9.36339 1.64925 9.51191 2.01384 9.51175H2.19645L2.09131 10.4633H2.65798L3.03638 9.51175H8.9637L9.34212 10.4633H9.90865L9.80337 9.51175H9.98613C10.3507 9.51191 10.6831 9.36339 10.9216 9.12437C11.1607 8.88582 11.3093 8.55329 11.3092 8.18903C11.3092 8.18903 11.3092 7.72794 11.3092 7.08976C11.3092 6.93482 11.3134 6.81728 11.3205 6.73023C11.3255 6.66517 11.332 6.61721 11.3385 6.58454C11.3417 6.56835 11.3445 6.55625 11.3472 6.54761C11.54 6.42079 11.7008 6.24981 11.8144 6.04804C11.9326 5.83855 12.0001 5.59546 12 5.33868C12.0003 4.94 11.8377 4.57682 11.5763 4.31579Z"
              fill="#74706D"
            />
          </svg>
          <span className="text-ganitel-text-label text-sm font-bold">
            Living {livingrooms}
          </span>
        </div>
      </div>

      <p className="text-ganitel-text-label text-sm font-medium italic">
        This property is 120sqm...
      </p>
    </div>
  );
}
