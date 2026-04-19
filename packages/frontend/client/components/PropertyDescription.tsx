import { useState } from "react";

interface PropertyDescriptionProps {
  description: string;
  price: number;
}

export function PropertyDescription({ description, price }: PropertyDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4">
      <h2 className="text-ganitel-text-title text-base font-bold">
        Description
      </h2>

      <p className={`text-ganitel-text-label text-sm font-normal leading-relaxed overflow-hidden transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
        {description}
      </p>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-[#8B5E3C] text-sm font-bold flex items-center gap-1 self-start hover:underline bg-transparent border-none p-0"
      >
        {isExpanded ? 'Show less' : 'Show more'} <span className={`text-lg transition-transform ${isExpanded ? 'rotate-[-90deg]' : ''}`}>›</span>
      </button>

      {/* Row with Price and Button - Image 4 */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-ganitel-neutral-3 mt-2">
        <div className="flex flex-col">
          <p className="text-ganitel-text-title text-base font-bold">
            $ {price.toLocaleString()} pbw
          </p>
        </div>
        <button className="bg-[#D39E70] text-white py-2 px-4 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform">
          Book now / Negociate
        </button>
      </div>
    </div>
  );
}
