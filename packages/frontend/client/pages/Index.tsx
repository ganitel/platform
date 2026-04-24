import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { PromotionBanner } from "@/components/PromotionBanner";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { servicesService } from "@/services/services.service";
import type { ServiceListItem } from "@shared/api";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<ServiceListItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await servicesService.getServices({
          service_type: "accommodation",
          skip: 0,
          limit: 20,
        });

        if (!isMounted) return;
        setProperties(response.items || []);
      } catch {
        if (!isMounted) return;
        setProperties([]);
        setErrorMessage("Unable to load properties right now. Please try again.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const popularProperties = properties.slice(0, 3);
  const featuredProperties = properties.slice(3, 6).length
    ? properties.slice(3, 6)
    : properties.slice(0, 3);
  const recentProperties = properties.slice(6, 9).length
    ? properties.slice(6, 9)
    : properties.slice(0, 3);



  const PropertySkeleton = () => (
    <div className="flex gap-3 overflow-x-auto pb-2 -mr-4 pr-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="min-w-[280px] w-[280px] h-[350px] shrink-0">
          <Skeleton className="w-full h-[200px] rounded-xl mb-3" />
          <Skeleton className="w-[150px] h-5 mb-2" />
          <Skeleton className="w-[100px] h-4" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-white px-4 py-5 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 w-full">
          <h1 className="text-ganitel-text-title text-center text-xl font-bold leading-5">
            Your Stay, Your Price!
          </h1>
          <p className="text-ganitel-text-subtitle text-center text-sm font-normal leading-4 tracking-[-0.28px]">
            Love the place but not the price? Engage directly with hosts and find a deal that works best for you.
          </p>
        </div>
        <SearchBar />
      </section>

      {errorMessage ? (
        <div className="mx-4 mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {/* Main Content */}
      <div className="flex flex-col gap-8 px-4 pb-6">

        {/* Our Handpicked Gems */}
        <section className="flex flex-col gap-5">
          <h2 className="text-ganitel-text-title text-lg font-bold leading-[18px]">
            Our Handpicked Gems
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mr-4 pr-4 scrollbar-hide">
            {isLoading ? (
              <PropertySkeleton />
            ) : (
              popularProperties.map((property) => (
                <PropertyCard key={`popular-${property.id}`} property={property} />
              ))
            )}
          </div>
          {!isLoading && popularProperties.length === 0 ? (
            <p className="text-sm text-ganitel-text-subtitle">No properties available yet.</p>
          ) : null}
        </section>

        {/* Loyalty Program Banner */}
        <PromotionBanner
          title="Join our Loyalty and Referral Program to save More!"
          buttonText="Join Now 🚀"
          imageUrl="https://api.builder.io/api/v1/image/assets/TEMP/0d2e66e8bd358197aa679f8b86c247a28055c09d?width=186"
          variant="green"
        />

        {/* Top Rated Properties */}
        <section className="flex flex-col gap-5">
          <h2 className="text-ganitel-text-title text-lg font-bold leading-[18px]">
            Top Rated properties
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mr-4 pr-4 scrollbar-hide">
            {isLoading ? (
              <PropertySkeleton />
            ) : (
              featuredProperties.map((property) => (
                <PropertyCard key={`featured-${property.id}`} property={property} />
              ))
            )}
          </div>
          {!isLoading && featuredProperties.length === 0 ? (
            <p className="text-sm text-ganitel-text-subtitle">No properties available yet.</p>
          ) : null}
        </section>

        {/* Hosting Banner */}
        <PromotionBanner
          title="Do you  Own or Manage a Furnished Accomodation?"
          buttonText="Start Hosting Today"
          imageUrl="https://api.builder.io/api/v1/image/assets/TEMP/d74940855bcd1315915fa881b31fdca04944d9e3?width=159"
          variant="brown"
        />

        {/* Recently Added Properties */}
        <section className="flex flex-col gap-5">
          <h2 className="text-ganitel-text-title text-lg font-bold leading-[18px]">
            Recently added properties
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mr-4 pr-4 scrollbar-hide">
            {isLoading ? (
              <PropertySkeleton />
            ) : (
              recentProperties.map((property) => (
                <PropertyCard key={`recent-${property.id}`} property={property} />
              ))
            )}
          </div>
          {!isLoading && recentProperties.length === 0 ? (
            <p className="text-sm text-ganitel-text-subtitle">No properties available yet.</p>
          ) : null}
        </section>
      </div>

      {/* Footer */}
      <Footer />

      <BottomNav />

      {/* Custom scrollbar hiding */}
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
