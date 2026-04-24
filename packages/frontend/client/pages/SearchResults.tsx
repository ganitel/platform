import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal, ArrowUp } from "lucide-react";
import { Header } from "@/components/Header";
import { PropertySearchResultCard, PropertySearchResultSkeleton } from "@/components/PropertySearchResultCard";
import { BottomNav } from "@/components/BottomNav";
import { differenceInDays } from "date-fns";
import { useState, useEffect } from "react";
import { SearchModal } from "@/components/SearchModal";
import { FiltersModal } from "@/components/FiltersModal";
import { servicesService } from "@/services/services.service";
import type { ServiceListItem } from "@shared/api";

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [properties, setProperties] = useState<ServiceListItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const destination = searchParams.get("destination") || "";
    const checkIn = searchParams.get("checkIn") || "2025-07-23";
    const checkOut = searchParams.get("checkOut") || "2025-07-30";

    useEffect(() => {
        let isMounted = true;

        const loadServices = async () => {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await servicesService.getServices({
                    service_type: "accommodation",
                    city: destination || undefined,
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
    }, [destination]);

    // Calculate nights for price calculation
    const nights = Math.max(1, differenceInDays(new Date(checkOut), new Date(checkIn)));

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleApplyFilters = (filters: Record<string, unknown>) => {
        console.log("Applied filters in Results:", filters);
        // Implement actual filtering logic here if needed
    };



    return (
        <div className="min-h-screen bg-white flex flex-col pb-24 font-sans">
            {/* Header */}
            <Header />

            {/* Page Title & Back */}
            <div className="px-4 py-4 flex items-center relative">
                <Link to="/" className="text-ganitel-text-title absolute left-4">
                    <ArrowLeft className="w-6 h-6" strokeWidth={1.5} />
                </Link>
                <h1 className="text-[17px] font-bold text-ganitel-text-title mx-auto">
                    Your Results ({properties.length.toString().padStart(2, '0')})
                </h1>
            </div>

            {errorMessage ? (
                <div className="mx-4 mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            ) : null}

            {/* Search Filter Bar */}
            <div className="px-4 pb-6">
                <div className="flex items-center gap-1.5 font-sans">
                    <div
                        onClick={() => setIsSearchModalOpen(true)}
                        className="flex-1 bg-ganitel-neutral-2 rounded-lg px-4 flex items-center h-[52px] cursor-pointer"
                    >
                        <span className="text-base font-normal text-ganitel-text-title">
                            {destination || "Search destination"}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsFiltersModalOpen(true)}
                        className="h-[52px] w-[52px] flex items-center justify-center bg-[#A3A88D] rounded-lg text-white font-bold"
                    >
                        <SlidersHorizontal className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 px-4">
                {isLoading ? (
                    <div className="flex w-full flex-col">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <PropertySearchResultSkeleton key={i} />
                        ))}
                    </div>
                ) : properties.length > 0 ? (
                    <div className="flex w-full flex-col">
                        {properties.map((property) => (
                            <PropertySearchResultCard
                                key={property.id}
                                property={property}
                                nights={nights}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex w-full items-center justify-center px-6">
                        <p className="text-[15px] font-normal text-[#C4C4C4] text-center max-w-[280px] leading-relaxed">
                            We currently have no properties in that destination. Please try another location.
                        </p>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            {!isLoading && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-28 right-4 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                    <ArrowUp className="w-6 h-6" />
                </button>
            )}

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Search Modal */}
            <SearchModal
                key={String(isSearchModalOpen)}
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                mode="modify"
            />

            {/* Filters Modal */}
            <FiltersModal
                isOpen={isFiltersModalOpen}
                onClose={() => setIsFiltersModalOpen(false)}
                onApply={handleApplyFilters}
                resultsCount={properties.length}
            />
        </div>
    );
}

