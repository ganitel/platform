import { Search } from "lucide-react";
import { useState } from "react";
import { SearchModal } from "@/components/SearchModal";

export function SearchBar() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-start gap-1.5 w-full">
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="flex-1 flex items-center gap-1.5 px-4 py-3 rounded-lg bg-ganitel-neutral-2 text-left"
        >
          <span className="text-base">🤝🏽</span>
          <span className="flex-1 text-ganitel-text-placeholder text-base font-normal leading-4">
            Find a Stay, Make a Deal
          </span>
        </button>
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="flex items-center justify-center p-3 rounded-lg bg-ganitel-secondary"
        >
          <Search className="w-5 h-5 text-white" strokeWidth={1.25} />
        </button>
      </div>

      <SearchModal
        key={String(isSearchModalOpen)}
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}
