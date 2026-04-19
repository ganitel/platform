import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowUp } from "lucide-react";
import { Header } from "@/components/Header";
import { PropertyImageGallery } from "@/components/PropertyImageGallery";
import { PropertyInfo } from "@/components/PropertyInfo";
import { AccompaniedServices } from "@/components/AccompaniedServices";
import { PropertyDescription } from "@/components/PropertyDescription";
import { HostInfo } from "@/components/HostInfo";
import { AmenitiesList } from "@/components/AmenitiesList";
import { ListingRules } from "@/components/ListingRules";
import { Neighborhood } from "@/components/Neighborhood";
import { ReviewsSection } from "@/components/ReviewsSection";
import { HouseRules } from "@/components/HouseRules";
import { SimilarProperties } from "@/components/SimilarProperties";
import { BookingFooter } from "@/components/BookingFooter";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { useServiceDetail } from "@/hooks";

export default function PropertyDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: property, isLoading, isError } = useServiceDetail(id, !!id);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-ganitel-secondary" />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Property not found</h2>
        <p className="text-ganitel-text-label mb-4">We couldn't load the details for this property.</p>
        <button onClick={() => navigate("/")} className="px-6 py-2 bg-ganitel-primary text-white rounded-lg">
          Go back home
        </button>
      </div>
    );
  }

  // Transform API property to display format
  const displayProperty = {
    ...property,
    name: property.title,
    location: property.location,
    locationString: `${property.location.city}, ${property.location.address}`,
    price: property.pricing.base_price,
    nights: 7,
    rating: property.rating.average.toFixed(1),
    reviews: property.rating.count,
    livingrooms: 1,
    images: property.images && property.images.length > 0 ? property.images : ["/placeholder.svg"],
    bedrooms: property.capacity.bedrooms || 0,
    bathrooms: property.capacity.bathrooms || 0,
    max_guests: property.capacity.max_guests,
    host: {
      id: property.provider_id,
      name: "Host",
      avatar: "/placeholder.svg",
      rating: "5.0",
      reviews: 693,
      message: "I will make sure your stay at our property is the best you have ever experienced in Cameroon.",
    },
  };

  return (
    <div className="min-h-screen bg-ganitel-neutral-1 flex flex-col relative">
      <Header />

      <main className="flex-1 pb-32">
        {/* Image Gallery */}
        <PropertyImageGallery images={displayProperty.images} property={property} />

        {/* Content Container */}
        <div className="max-w-screen-md mx-auto flex flex-col gap-6 px-4 pt-6">

          {/* Main Info Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <PropertyInfo
              name={displayProperty.name}
              location={displayProperty.locationString}
              price={displayProperty.price}
              nights={displayProperty.nights}
              rating={displayProperty.rating}
              reviews={displayProperty.reviews}
              bedrooms={displayProperty.bedrooms}
              bathrooms={displayProperty.bathrooms}
              livingrooms={displayProperty.livingrooms}
              maxGuests={displayProperty.max_guests}
            />
          </div>

          <PropertyDescription
            description={displayProperty.description}
            price={displayProperty.price}
          />

          <AccompaniedServices />

          <HostInfo host={displayProperty.host} />

          <AmenitiesList />


          <ListingRules />

          <Neighborhood />

          <ReviewsSection
            propertyId={displayProperty.id}
            rating={displayProperty.rating}
            totalReviews={displayProperty.reviews}
          />

          <HouseRules />

          <SimilarProperties />
        </div>
      </main>

      <Footer />

      {/* Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-32 right-6 w-12 h-12 bg-ganitel-primary text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50"
          aria-label="Back to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* Sticky Bottom Actions */}
      <BookingFooter
        price={displayProperty.price}
        nights={displayProperty.nights}
        checkIn="Flexible"
        checkOut="Flexible"
        propertyData={displayProperty}
        rating={parseFloat(displayProperty.rating)}
      />
    </div>
  );
}
