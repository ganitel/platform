import { Star, Bed, Bath, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { usePropertyWishlistToggle } from "@/hooks";
import type { ServiceListItem } from "@shared/api";
import { mapServiceToCard } from "@/lib/mappers";

interface PropertySearchResultCardProps {
    property: ServiceListItem;
    nights?: number;
    deals?: string;
    booked?: string;
    onToggleWishlist?: () => void;
}

export function PropertySearchResultCard({
    property,
    nights = 7,
    deals = "🤝 234 Deals",
    booked = "123k booked",
    onToggleWishlist,
}: PropertySearchResultCardProps) {
    const navigate = useNavigate();
    const { isFavorited, toggle } = usePropertyWishlistToggle(property);

    if (!property) return null;

    // Map service data to card props
    const cardData = mapServiceToCard(property);

    const id = cardData.id;
    const name = cardData.title;
    const location = cardData.location;
    const rating = `${cardData.rating.toFixed(1)} (${cardData.reviewCount})`;
    const bedrooms = cardData.bedrooms || 0;
    const bathrooms = cardData.bathrooms || 0;
    const maxGuests = cardData.maxGuests;
    const type = property.accommodation_type 
        ? property.accommodation_type.charAt(0).toUpperCase() + property.accommodation_type.slice(1)
        : "Accommodation";
    const imageUrl = cardData.imageUrl;
    const price = cardData.price * nights;

    return (
        <div
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-ganitel-stroke-neutral mb-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/property/${id}`)}
        >
            {/* Image Section */}
            <div className="relative aspect-[16/9] w-full">
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm text-ganitel-text-title px-3 py-1 rounded-md text-xs font-medium">
                        {type}
                    </span>
                </div>
                <button
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleWishlist) {
                            onToggleWishlist();
                        } else {
                            toggle();
                        }
                    }}
                >
                    <img
                        src="/icons/heart.svg"
                        alt="Favorite"
                        className={cn(
                            "w-6 h-6 transition-all",
                            isFavorited ? "scale-110" : "opacity-40"
                        )}
                        style={{
                            filter: isFavorited ? 'invert(15%) sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%)' : 'none'
                        }}
                    />
                </button>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h3 className="text-ganitel-text-title text-lg font-bold leading-tight">{name}</h3>
                    <p className="text-ganitel-text-label text-sm">{location}</p>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 bg-ganitel-accent-green/30 px-2 py-1 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-[#D39E70] text-[#D39E70]" />
                        <span className="text-xs font-medium text-ganitel-text-title">{rating}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-ganitel-accent-green/30 px-2 py-1 rounded-md text-[#D39E70]">
                        <span className="text-xs font-semibold">{deals}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-ganitel-accent-green/30 px-2 py-1 rounded-md">
                        <span className="text-xs font-medium text-ganitel-text-title">{booked}</span>
                    </div>
                </div>

                {/* Amenities Icons */}
                <div className="flex items-center gap-4 py-1 border-y border-ganitel-stroke-neutral">
                    <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-ganitel-text-label" strokeWidth={1.5} />
                        <span className="text-xs text-ganitel-text-label">Bedrooms : {bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-ganitel-text-label" strokeWidth={1.5} />
                        <span className="text-xs text-ganitel-text-label">Bathrooms : {bathrooms}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <LayoutGrid className="w-4 h-4 text-ganitel-text-label" strokeWidth={1.5} />
                        <span className="text-xs text-ganitel-text-label">Livingrooms</span>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-xs text-ganitel-text-label font-medium">
                        <span>Max guests: {maxGuests}</span>
                    </div>
                    <div className="text-ganitel-text-title text-[15px] font-bold">
                        $ {price} for {nights} Nights
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PropertySearchResultSkeleton() {
    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-ganitel-stroke-neutral mb-4 animate-pulse">
            <div className="aspect-[16/9] w-full bg-gray-200" />
            <div className="p-4 flex flex-col gap-4">
                <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded-md w-3/4" />
                    <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                </div>
                <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded-md w-16" />
                    <div className="h-6 bg-gray-200 rounded-md w-16" />
                    <div className="h-6 bg-gray-200 rounded-md w-16" />
                </div>
                <div className="h-8 bg-gray-200 rounded-md w-full" />
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded-md w-1/4" />
                    <div className="h-5 bg-gray-200 rounded-md w-1/2" />
                </div>
            </div>
        </div>
    );
}
