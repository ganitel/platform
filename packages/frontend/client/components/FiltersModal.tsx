import { useState, useEffect } from "react";
import { X, Minus, Plus, ArrowRight } from "lucide-react";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion";

interface FiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: Record<string, unknown>) => void;
    resultsCount?: number;
}

export function FiltersModal({ isOpen, onClose, onApply, resultsCount = 48 }: FiltersModalProps) {
    const [maxBudget, setMaxBudget] = useState<string>("");
    const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
    const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
    const [rooms, setRooms] = useState(1);

    // Initial state or reset
    useEffect(() => {
        if (isOpen) {
            // Document scroll lock
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "unset";
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const toggleSelection = (list: string[], setList: (val: string[]) => void, item: string) => {
        if (list.includes(item)) {
            setList(list.filter((i) => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleClearAll = () => {
        setMaxBudget("");
        setSelectedNeighborhoods([]);
        setSelectedPropertyTypes([]);
        setSelectedFacilities([]);
        setRooms(1);
    };

    const handleApply = () => {
        onApply({
            maxBudget,
            neighborhoods: selectedNeighborhoods,
            propertyTypes: selectedPropertyTypes,
            facilities: selectedFacilities,
            rooms,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content container */}
            <div className="relative bg-white w-full h-[92vh] rounded-t-[32px] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-ganitel-stroke-neutral bg-white shrink-0">
                    <button onClick={onClose} className="p-1">
                        <X className="w-6 h-6 text-ganitel-text-title" />
                    </button>
                    <h2 className="text-xl font-bold text-ganitel-text-title">Filters</h2>
                    <div className="w-8" /> {/* Spacer for centering */}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
                    <div className="space-y-8">
                        {/* Budget Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-ganitel-text-title">Your maximum budget</h3>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ganitel-text-label text-lg">$</span>
                                <Input
                                    type="number"
                                    placeholder=""
                                    value={maxBudget}
                                    onChange={(e) => setMaxBudget(e.target.value)}
                                    className="h-14 pl-8 text-lg bg-ganitel-neutral-2 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-ganitel-primary"
                                />
                            </div>
                        </div>

                        <Accordion type="multiple" defaultValue={["neighborhood", "property-type", "facilities"]} className="w-full">
                            {/* Neighborhood Section */}
                            <AccordionItem value="neighborhood" className="border-none">
                                <AccordionTrigger className="text-lg font-bold hover:no-underline py-4">
                                    Neighborhood
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                    {[
                                        { name: "Bastos", count: 1 },
                                        { name: "Nlongkak", count: 2 },
                                        { name: "Odza", count: 1 },
                                        { name: "Tsinga", count: 1 },
                                    ].map((n) => (
                                        <div key={n.name} className="flex items-center space-x-4 py-1">
                                            <Checkbox
                                                id={`neigh-${n.name}`}
                                                checked={selectedNeighborhoods.includes(n.name)}
                                                onCheckedChange={() => toggleSelection(selectedNeighborhoods, setSelectedNeighborhoods, n.name)}
                                                className="w-6 h-6 rounded-md border-2 border-[#D1D1D1] transition-all data-[state=checked]:bg-[#18100C] data-[state=checked]:border-[#18100C]"
                                            />
                                            <label
                                                htmlFor={`neigh-${n.name}`}
                                                className="text-base text-ganitel-text-label font-medium cursor-pointer"
                                            >
                                                {n.name} ({n.count})
                                            </label>
                                        </div>
                                    ))}
                                    <button className="text-ganitel-primary font-bold text-sm underline pt-2">
                                        See More
                                    </button>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Property Type Section */}
                            <AccordionItem value="property-type" className="border-none mt-4">
                                <AccordionTrigger className="text-lg font-bold hover:no-underline py-4">
                                    Property Type
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                    {[
                                        { name: "Apartments", count: 1 },
                                        { name: "Studio", count: 2 },
                                        { name: "Rooms", count: 1 },
                                    ].map((p) => (
                                        <div key={p.name} className="flex items-center space-x-4 py-1">
                                            <Checkbox
                                                id={`type-${p.name}`}
                                                checked={selectedPropertyTypes.includes(p.name)}
                                                onCheckedChange={() => toggleSelection(selectedPropertyTypes, setSelectedPropertyTypes, p.name)}
                                                className="w-6 h-6 rounded-md border-2 border-[#D1D1D1] transition-all data-[state=checked]:bg-[#18100C] data-[state=checked]:border-[#18100C]"
                                            />
                                            <label
                                                htmlFor={`type-${p.name}`}
                                                className="text-base text-ganitel-text-label font-medium cursor-pointer"
                                            >
                                                {p.name} ({p.count})
                                            </label>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>

                            {/* Facilities Section */}
                            <AccordionItem value="facilities" className="border-none mt-4">
                                <AccordionTrigger className="text-lg font-bold hover:no-underline py-4">
                                    Facilities
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                    {[
                                        "Swimming Pool",
                                        "Lift",
                                        "Free Wi-Fi",
                                        "Free Parking",
                                        "Allows Events",
                                        "Pet Friendly",
                                        "No Smoking",
                                    ].map((f) => (
                                        <div key={f} className="flex items-center space-x-4 py-1">
                                            <Checkbox
                                                id={`facility-${f}`}
                                                checked={selectedFacilities.includes(f)}
                                                onCheckedChange={() => toggleSelection(selectedFacilities, setSelectedFacilities, f)}
                                                className="w-6 h-6 rounded-md border-2 border-[#D1D1D1] transition-all data-[state=checked]:bg-[#18100C] data-[state=checked]:border-[#18100C]"
                                            />
                                            <label
                                                htmlFor={`facility-${f}`}
                                                className="text-base text-ganitel-text-label font-medium cursor-pointer"
                                            >
                                                {f}
                                            </label>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Number of Rooms */}
                        <div className="space-y-4 pb-8">
                            <h3 className="text-lg font-bold text-ganitel-text-title">Number of Rooms</h3>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setRooms(Math.max(1, rooms - 1))}
                                    className="w-12 h-10 flex items-center justify-center border border-ganitel-stroke-neutral rounded-lg"
                                >
                                    <Minus className="w-4 h-4 text-ganitel-text-title" />
                                </button>
                                <div className="w-14 h-10 flex items-center justify-center border border-ganitel-stroke-neutral rounded-lg font-bold">
                                    {rooms}
                                </div>
                                <button
                                    onClick={() => setRooms(rooms + 1)}
                                    className="w-12 h-10 flex items-center justify-center bg-[#18100C] rounded-lg"
                                >
                                    <Plus className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-6 border-t border-ganitel-stroke-neutral bg-white absolute bottom-0 left-0 right-0 flex items-center justify-between z-20">
                    <button
                        onClick={handleClearAll}
                        className="text-base font-bold text-ganitel-text-title underline"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex items-center gap-3 bg-[#18100C] text-white px-6 py-4 rounded-xl font-bold min-w-[200px] justify-center"
                    >
                        See Results ({resultsCount})
                        <div className="bg-white/20 p-1 rounded-md">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
