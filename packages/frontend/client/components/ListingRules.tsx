import { Check, X } from "lucide-react";

export function ListingRules() {
  const rules = [
    { label: "children (allowed)", allowed: true },
    { label: "parties/events (allowed)", allowed: true },
    { label: "refundable caution deposit ( not allowed)", allowed: false },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4">
      <h2 className="text-ganitel-text-title text-base font-bold">
        Listing rules
      </h2>

      <div className="flex flex-col gap-3">
        {rules.map((rule, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <div
              className={`flex items-center justify-center p-1 rounded-md shrink-0 ${rule.allowed ? "bg-[#18100C]" : "bg-[#F25C54]"
                }`}
            >
              {rule.allowed ? (
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              ) : (
                <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              )}
            </div>
            <span className="text-ganitel-text-title text-sm font-medium">
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
