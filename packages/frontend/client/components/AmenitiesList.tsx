import { useState } from "react";
import { MinusSquare } from "lucide-react";

export function AmenitiesList() {
  const [activeTab, setActiveTab] = useState("General");

  const tabs = ["General", "Living Room", "Main Bedroom", "Kitchen"];

  const amenities = [
    "Decoder",
    "Free parking",
    "Hot water",
    "Washing Machine",
    "Netflix",
    "Wi-Fi"
  ];

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4">
      <h2 className="text-ganitel-text-title text-base font-bold">
        What you will find
      </h2>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-w-fit flex-shrink-0 ${activeTab === tab
                ? "bg-[#EAEEE7] text-black border border-[#9CAC7C]"
                : "bg-[#F5F5F3] text-ganitel-text-label border border-transparent"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Amenities List */}
      <div className="flex flex-col gap-3 mt-1">
        {amenities.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm border border-ganitel-text-label/30 flex items-center justify-center">
              <div className="w-2 h-[1px] bg-ganitel-text-label" />
            </div>
            <span className="text-sm font-normal text-ganitel-text-label">
              {item}
            </span>
          </div>
        ))}
      </div>

      <button className="text-[#8B5E3C] text-base font-bold text-left hover:underline mt-1 bg-transparent border-none p-0">
        View all
      </button>
    </div>
  );
}
