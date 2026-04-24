import { useState, useEffect, useRef, useMemo } from "react";
import { X, ArrowLeft, Calendar, Users, Bed, SlidersHorizontal, Binoculars, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MOCK_PROPERTIES } from "@/mockData";
import { FiltersModal } from "./FiltersModal";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialStep?: SearchStep;
    mode?: "wizard" | "modify";
}

type SearchStep = "destination" | "dates" | "guests";

interface SearchParams {
    destination: string;
    checkIn: Date | undefined;
    checkOut: Date | undefined;
    guests: number;
    rooms: number;
}

export function SearchModal({
    isOpen,
    onClose,
    initialStep = "destination",
    mode = "wizard"
}: SearchModalProps) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<SearchStep>(initialStep);
    const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

    // Get unique locations from mock data
    const availableLocations = useMemo(() => {
        const cities = MOCK_PROPERTIES.map(p => p.location.city);
        const addresses = MOCK_PROPERTIES.map(p => p.location.address);
        return Array.from(new Set([...cities, ...addresses])).sort();
    }, []);

    const [searchParams, setSearchParams] = useState<SearchParams>({
        destination: "",
        checkIn: undefined,
        checkOut: undefined,
        guests: 1,
        rooms: 1,
    });

    // Track when the user has explicitly selected a location to suppress suggestions
    const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

    const filteredLocations = useMemo(() => {
        if (searchParams.destination.trim() === "" || searchParams.destination === selectedDestination) return [];
        return availableLocations.filter(loc =>
            loc.toLowerCase().includes(searchParams.destination.toLowerCase())
        );
    }, [searchParams.destination, selectedDestination, availableLocations]);

    const handleLocationSelect = (location: string) => {
        setSearchParams({ ...searchParams, destination: location });
        setSelectedDestination(location);
        if (mode === "wizard") {
            setCurrentStep("dates");
        }
    };

    const checkInInputRef = useRef<HTMLInputElement>(null);
    const checkOutInputRef = useRef<HTMLInputElement>(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    const stepOrder: SearchStep[] = ["destination", "dates", "guests"];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const stepProgress = `${currentStepIndex + 1}/3`;

    const handleNext = () => {
        if (currentStep === "destination" && searchParams.destination) {
            setCurrentStep("dates");
        } else if (currentStep === "dates" && searchParams.checkIn && searchParams.checkOut) {
            setCurrentStep("guests");
        }
    };

    const handleBack = () => {
        if (currentStep === "dates") {
            setCurrentStep("destination");
        } else if (currentStep === "guests") {
            setCurrentStep("dates");
        }
    };

    const handleSearch = () => {
        // Validate all required fields
        if (!searchParams.destination || !searchParams.checkIn || !searchParams.checkOut) {
            return;
        }

        // Build search query parameters
        const params = new URLSearchParams({
            destination: searchParams.destination,
            checkIn: format(searchParams.checkIn, "yyyy-MM-dd"),
            checkOut: format(searchParams.checkOut, "yyyy-MM-dd"),
            guests: searchParams.guests.toString(),
            rooms: searchParams.rooms.toString(),
        });

        // Navigate to search results page
        navigate(`/search?${params.toString()}`);
        onClose();
    };

    const handleGuestSelect = (count: number) => {
        setSearchParams({ ...searchParams, guests: count });
    };

    const handleRoomSelect = (count: number) => {
        setSearchParams({ ...searchParams, rooms: count });
    };

    const handleApplyFilters = (filters: Record<string, unknown>) => {
        console.log("Applied filters:", filters);
        // Here you would normally update the search params or state
        handleSearch(); // For now, just trigger search
    };

    if (!isOpen) return null;

    const renderModifyView = () => (
        <div className="space-y-6">
            {/* Place */}
            <div className="space-y-2">
                <label className="text-[14px] font-medium text-ganitel-text-label">Place</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <MapPin className="w-6 h-6 text-ganitel-text-title" strokeWidth={1.5} />
                    </div>
                    <Input
                        type="text"
                        placeholder="Buea Cameroon"
                        value={searchParams.destination}
                        onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                        className="w-full h-14 pl-12 pr-4 text-base bg-ganitel-neutral-2 border-none rounded-xl"
                    />
                </div>
            </div>

            {/* Check in */}
            <div className="space-y-2">
                <label className="text-[14px] font-medium text-ganitel-text-label">Check in</label>
                <div
                    onClick={() => checkInInputRef.current?.showPicker()}
                    className="relative w-full flex items-center gap-3 px-4 py-[18px] bg-ganitel-neutral-2 rounded-xl cursor-pointer"
                >
                    <Calendar className="w-6 h-6 text-ganitel-text-title" strokeWidth={1.5} />
                    <span className="text-[16px] font-medium text-ganitel-text-title">
                        {searchParams.checkIn
                            ? format(searchParams.checkIn, "EEEE, dd MMMM yyyy")
                            : "Select check-in date"}
                    </span>
                    <input
                        ref={checkInInputRef}
                        type="date"
                        className="absolute inset-0 opacity-0 pointer-events-none"
                        onChange={(e) => {
                            const date = e.target.valueAsDate;
                            if (date) setSearchParams({ ...searchParams, checkIn: date });
                        }}
                    />
                </div>
            </div>

            {/* Check out */}
            <div className="space-y-2">
                <label className="text-[14px] font-medium text-ganitel-text-label">Check out</label>
                <div
                    onClick={() => checkOutInputRef.current?.showPicker()}
                    className="relative w-full flex items-center gap-3 px-4 py-[18px] bg-ganitel-neutral-2 rounded-xl cursor-pointer"
                >
                    <Calendar className="w-6 h-6 text-ganitel-text-title" strokeWidth={1.5} />
                    <span className="text-[16px] font-medium text-ganitel-text-title">
                        {searchParams.checkOut
                            ? format(searchParams.checkOut, "EEEE, dd MMMM yyyy")
                            : "Select check-out date"}
                    </span>
                    <input
                        ref={checkOutInputRef}
                        type="date"
                        className="absolute inset-0 opacity-0 pointer-events-none"
                        onChange={(e) => {
                            const date = e.target.valueAsDate;
                            if (date) setSearchParams({ ...searchParams, checkOut: date });
                        }}
                    />
                </div>
            </div>

            {/* Guests */}
            <div className="space-y-3">
                <h3 className="text-[14px] font-medium text-ganitel-text-label">How many are you?</h3>
                <div className="bg-ganitel-neutral-2 p-5 rounded-2xl flex gap-5">
                    <div className="flex-shrink-0 pt-1.5">
                        <Users className="w-6 h-6 text-ganitel-text-title" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-2.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleGuestSelect(num)}
                                className={cn(
                                    "h-11 w-full rounded-md border text-sm font-medium transition-all shadow-sm",
                                    searchParams.guests === num
                                        ? "bg-[#18100C] text-white border-[#18100C]"
                                        : "bg-white text-ganitel-text-label border-[#D1D1D1]"
                                )}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={() => handleGuestSelect(11)}
                            className={cn(
                                "h-11 w-full rounded-md border text-sm font-medium transition-all shadow-sm",
                                searchParams.guests === 11
                                    ? "bg-[#18100C] text-white border-[#18100C]"
                                    : "bg-white text-ganitel-text-label border-[#D1D1D1]"
                            )}
                        >
                            10+
                        </button>
                    </div>
                </div>
            </div>

            {/* Rooms */}
            <div className="space-y-3">
                <h3 className="text-[14px] font-medium text-ganitel-text-label">How many rooms do you need?</h3>
                <div className="bg-ganitel-neutral-2 p-5 rounded-2xl flex gap-5">
                    <div className="flex-shrink-0 pt-1.5">
                        <Bed className="w-6 h-6 text-ganitel-text-title" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-2.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleRoomSelect(num)}
                                className={cn(
                                    "h-11 w-full rounded-md border text-sm font-medium transition-all shadow-sm",
                                    searchParams.rooms === num
                                        ? "bg-[#18100C] text-white border-[#18100C]"
                                        : "bg-white text-ganitel-text-label border-[#D1D1D1]"
                                )}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={() => handleRoomSelect(11)}
                            className={cn(
                                "h-11 w-full rounded-md border text-sm font-medium transition-all shadow-sm",
                                searchParams.rooms === 11
                                    ? "bg-[#18100C] text-white border-[#18100C]"
                                    : "bg-white text-ganitel-text-label border-[#D1D1D1]"
                            )}
                        >
                            10+
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const isWizard = mode === "wizard";

    return (
        <>
            {/* Wizard Backdrop (Full White) */}
            {isWizard && (
                <div className="fixed inset-x-0 top-[56px] bottom-0 bg-white z-[60]" onClick={onClose} />
            )}

            <div className={cn(
                "fixed z-[100] flex flex-col",
                isWizard ? "inset-x-0 top-[56px] bottom-0" : "inset-0 justify-end"
            )}>
                {/* Modify Backdrop (Dark Overlay) */}
                {!isWizard && (
                    <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-300" onClick={onClose} />
                )}

                {/* Modal Content container */}
                <div className={cn(
                    "relative bg-white overflow-hidden flex flex-col transition-all duration-300 animate-in",
                    isWizard ? "w-full h-full" : "w-full h-[92vh] rounded-t-[32px] slide-in-from-bottom"
                )}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-ganitel-stroke-neutral bg-white shrink-0">
                        <button onClick={isWizard && currentStepIndex > 0 ? handleBack : onClose} className="p-1">
                            {isWizard && currentStepIndex > 0 ? (
                                <ArrowLeft className="w-6 h-6 text-ganitel-text-title" />
                            ) : (
                                <X className="w-6 h-6 text-ganitel-text-title" />
                            )}
                        </button>
                        <h1 className="text-lg font-bold text-ganitel-text-title">
                            {!isWizard ? "Modify your search" : (
                                currentStep === "destination" ? "Enter your destination" :
                                    currentStep === "dates" ? "Select dates" : "Select guests and rooms"
                            )}
                        </h1>
                        {isWizard ? (
                            <div className="px-2.5 py-1 border border-ganitel-stroke-neutral rounded-xl">
                                <span className="text-sm font-bold text-ganitel-text-title">{stepProgress}</span>
                            </div>
                        ) : (
                            <div className="w-8" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 ">
                        {!isWizard ? renderModifyView() : (
                            <div className="space-y-6">
                                {/* Step 1: Destination */}
                                {currentStep === "destination" && (
                                    <div className="space-y-6">
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                placeholder="Enter Your Destination"
                                                value={searchParams.destination}
                                                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                                                className="w-full h-14 px-5 text-base bg-ganitel-neutral-2 border-none rounded-xl focus-visible:ring-0 placeholder:text-ganitel-text-label"
                                                autoFocus
                                            />
                                            {searchParams.destination && (
                                                <button
                                                    onClick={() => setSearchParams({ ...searchParams, destination: "" })}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                                                >
                                                    <X className="w-5 h-5 text-ganitel-text-title" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            <h3 className="text-sm font-medium text-ganitel-text-label mb-4">
                                                {searchParams.destination.length === 0 ? "Suggestions" : ""}
                                            </h3>
                                            <div className="flex flex-col gap-5">
                                                {(searchParams.destination.length === 0 ? availableLocations.slice(0, 10) : filteredLocations).map((loc, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleLocationSelect(loc)}
                                                        className="text-left text-[16px] font-medium text-ganitel-text-title py-1"
                                                    >
                                                        {loc}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Dates */}
                                {currentStep === "dates" && (
                                    <div className="space-y-6">
                                        {/* Check-in */}
                                        <div>
                                            <label className="block text-[14px] font-medium text-ganitel-text-label mb-2">Check in</label>
                                            <div
                                                onClick={() => checkInInputRef.current?.showPicker()}
                                                className="relative w-full flex items-center gap-3 px-4 py-[18px] bg-ganitel-neutral-2 rounded-xl cursor-pointer"
                                            >
                                                <Calendar className="w-6 h-6 text-ganitel-text-title" strokeWidth={1.5} />
                                                <span className="text-[16px] font-medium text-ganitel-text-title">
                                                    {searchParams.checkIn ? format(searchParams.checkIn, "EEEE, dd MMMM yyyy") : "Select check-in date"}
                                                </span>
                                                <input
                                                    ref={checkInInputRef}
                                                    type="date"
                                                    className="absolute inset-0 opacity-0 pointer-events-none"
                                                    onChange={(e) => {
                                                        const date = e.target.valueAsDate;
                                                        if (date) setSearchParams({ ...searchParams, checkIn: date });
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Check-out */}
                                        <div>
                                            <label className="block text-[14px] font-medium text-ganitel-text-label mb-2">Check out</label>
                                            <div
                                                onClick={() => checkOutInputRef.current?.showPicker()}
                                                className="relative w-full flex items-center gap-3 px-4 py-[18px] bg-ganitel-neutral-2 rounded-xl cursor-pointer"
                                            >
                                                <Calendar className="w-6 h-6 text-ganitel-text-title" strokeWidth={1.5} />
                                                <span className="text-[16px] font-medium text-ganitel-text-title">
                                                    {searchParams.checkOut ? format(searchParams.checkOut, "EEEE, dd MMMM yyyy") : "Select check-out date"}
                                                </span>
                                                <input
                                                    ref={checkOutInputRef}
                                                    type="date"
                                                    className="absolute inset-0 opacity-0 pointer-events-none"
                                                    onChange={(e) => {
                                                        const date = e.target.valueAsDate;
                                                        if (date) setSearchParams({ ...searchParams, checkOut: date });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Guests and Rooms */}
                                {currentStep === "guests" && (
                                    <div className="space-y-6">
                                        {/* Guests Selection */}
                                        <div className="space-y-3">
                                            <h3 className="text-[14px] font-medium text-ganitel-text-label">How many are you?</h3>
                                            <div className="bg-ganitel-neutral-2 p-5 rounded-2xl flex gap-5">
                                                <div className="flex-shrink-0 pt-1.5">
                                                    <Users className="w-6 h-6 text-ganitel-text-title" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1 grid grid-cols-5 gap-2.5">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                        <button
                                                            key={num}
                                                            onClick={() => handleGuestSelect(num)}
                                                            className={cn(
                                                                "h-11 w-full rounded-md border text-sm font-medium transition-all shadow-sm",
                                                                searchParams.guests === num
                                                                    ? "bg-[#18100C] text-white border-[#18100C]"
                                                                    : "bg-white text-ganitel-text-label border-[#D1D1D1]"
                                                            )}
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => handleGuestSelect(11)}
                                                        className={cn(
                                                            "h-11 w-full rounded-md border text-sm font-medium transition-all shadow-sm",
                                                            searchParams.guests === 11
                                                                ? "bg-[#18100C] text-white border-[#18100C]"
                                                                : "bg-white text-ganitel-text-label border-[#D1D1D1]"
                                                        )}
                                                    >
                                                        10+
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rooms Selection */}
                                        <div className="space-y-3">
                                            <h3 className="text-[14px] font-medium text-ganitel-text-label">How many rooms do you need?</h3>
                                            <div className="bg-ganitel-neutral-2 p-5 rounded-2xl flex gap-5">
                                                <div className="flex-shrink-0 pt-1.5">
                                                    <Bed className="w-6 h-6 text-ganitel-text-title" strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1 grid grid-cols-5 gap-2.5">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                        <button
                                                            key={num}
                                                            onClick={() => handleRoomSelect(num)}
                                                            className={cn(
                                                                "h-11 w-full rounded-md border text-sm font-medium transition-all shadow-sm",
                                                                searchParams.rooms === num
                                                                    ? "bg-[#18100C] text-white border-[#18100C]"
                                                                    : "bg-white text-ganitel-text-label border-[#D1D1D1]"
                                                            )}
                                                        >
                                                            {num}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => handleRoomSelect(11)}
                                                        className={cn(
                                                            "h-11 w-full rounded-md border text-sm font-medium transition-all shadow-sm",
                                                            searchParams.rooms === 11
                                                                ? "bg-[#18100C] text-white border-[#18100C]"
                                                                : "bg-white text-ganitel-text-label border-[#D1D1D1]"
                                                        )}
                                                    >
                                                        10+
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Add Filters Button */}
                                        <button
                                            onClick={() => setIsFiltersModalOpen(true)}
                                            className="w-full h-14 bg-[#A3A88D] rounded-xl text-white font-bold text-base flex items-center justify-center gap-3 hover:opacity-95"
                                        >
                                            Add filters
                                            <div className="bg-white/20 p-1.5 rounded-lg flex items-center justify-center">
                                                <SlidersHorizontal className="w-6 h-6 text-white" strokeWidth={2.5} />
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Button */}
                    <div className="px-6 py-6 border-t border-ganitel-stroke-neutral bg-white shrink-0">
                        {(!isWizard || currentStep === "guests") ? (
                            <button
                                onClick={handleSearch}
                                disabled={!searchParams.destination || !searchParams.checkIn || !searchParams.checkOut}
                                className="w-full h-14 bg-[#18100C] text-white rounded-xl font-bold text-base flex items-center justify-center gap-3 hover:opacity-95 disabled:opacity-50"
                            >
                                Find place
                                <div className="bg-white/20 p-1.5 rounded-lg">
                                    <Binoculars className="w-6 h-6 text-white" />
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={
                                    (currentStep === "destination" && !searchParams.destination) ||
                                    (currentStep === "dates" && (!searchParams.checkIn || !searchParams.checkOut))
                                }
                                className="w-full h-14 bg-[#18100C] text-white rounded-xl font-bold text-base flex items-center justify-center gap-3 hover:opacity-95 disabled:opacity-50"
                            >
                                Continue
                                <div className="bg-white/20 p-1 rounded-md">
                                    <ArrowLeft className="w-5 h-5 rotate-180" strokeWidth={2.5} />
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                <FiltersModal
                    isOpen={isFiltersModalOpen}
                    onClose={() => setIsFiltersModalOpen(false)}
                    onApply={handleApplyFilters}
                />
            </div>
        </>
    );
}
