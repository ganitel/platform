import { Star, Eye } from "lucide-react";
import { usePropertyWishlistToggle } from "@/hooks";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { servicesService } from "@/services/services.service";
import type { ServiceListItem } from "@shared/api";
import { Skeleton } from "@/components/ui/skeleton";

export function SimilarProperties() {
  const [properties, setProperties] = useState<ServiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSimilar = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await servicesService.getServices({
          service_type: "accommodation",
          skip: 0,
          limit: 4,
        });

        if (!isMounted) return;
        setProperties(response.items || []);
      } catch {
        if (!isMounted) return;
        setProperties([]);
        setErrorMessage("Unable to load similar properties right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadSimilar();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4">
      <h2 className="text-ganitel-text-title text-lg font-bold leading-[18px]">
        Properties you may also like
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 -mr-4 pr-4 scrollbar-hide">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={`similar-skeleton-${index}`} className="flex flex-col w-[156px] flex-shrink-0 rounded-2xl overflow-hidden bg-white border border-ganitel-stroke-neutral shadow-sm">
              <Skeleton className="h-[91px] w-full" />
              <div className="p-3 flex flex-col gap-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          ))
        ) : (
          properties.map((property) => (
            <SimilarPropertyCard key={property.id} property={property} />
          ))
        )}
      </div>

      {!isLoading && properties.length === 0 ? (
        <p className="text-sm text-ganitel-text-subtitle">
          {errorMessage || "No similar properties available yet."}
        </p>
      ) : null}

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

function SimilarPropertyCard({ property }: { property: ServiceListItem }) {
  const { isFavorited, toggle } = usePropertyWishlistToggle(property);

  const imageUrl = property.images?.[0] || "/placeholder.svg";
  const type = property.accommodation_type || property.service_type || "Property";
  const rating = property.rating?.average || 0;
  const reviewCount = property.rating?.count || 0;
  const bedrooms = property.capacity?.bedrooms || 0;
  const bathrooms = property.capacity?.bathrooms || 0;
  const price = property.pricing?.base_price || 0;

  return (
    <div className="flex flex-col w-[156px] flex-shrink-0 rounded-2xl overflow-hidden bg-white border border-ganitel-stroke-neutral shadow-sm">
      {/* Image */}
      <div className="relative h-[91px] w-full">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <span className="px-1.5 py-0.5 text-[8px] font-bold text-white bg-black/60 backdrop-blur-sm rounded">
            {type}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="w-6 h-6 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full"
          >
            <img
              src="/icons/heart.svg"
              alt="Favorite"
              className={cn("w-3.5 h-3.5 transition-all", isFavorited ? "scale-110" : "opacity-60")}
              style={{
                filter: isFavorited ? 'invert(15%) sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%)' : 'none'
              }}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between p-3 gap-2 flex-1">
        <h3 className="text-ganitel-text-title text-xs font-bold leading-tight line-clamp-1">
          {property.title}
        </h3>

        <p className="text-ganitel-text-label text-[10px] truncate">
          {property.location?.city}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between p-1 rounded bg-ganitel-accent-green/30">
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" strokeWidth={0} />
            <span className="text-ganitel-text-title text-[8px] font-medium">
              {rating}
            </span>
          </div>
          <span className="text-ganitel-text-label text-[8px]">
            {reviewCount} reviews
          </span>
        </div>

        {/* Amenities */}
        <div className="flex items-center gap-1 text-[9px] text-ganitel-text-label">
          <span>{bedrooms} Bed</span>
          <span>•</span>
          <span>{bathrooms} Bath</span>
        </div>

        {/* View Price Button */}
        <div className="flex items-center gap-1 mt-1 text-ganitel-text-title">
          <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span className="text-[11px] font-bold">
            ${price} / night
          </span>
        </div>
      </div>
    </div>
  );
}
