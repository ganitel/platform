import type { PropertyPublic } from "@/features/properties/types";
import { PropertyCard } from "@/features/properties/components/property-card";

export function PropertyGrid({ items }: { items: PropertyPublic[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <li key={p.id}>
          <PropertyCard property={p} />
        </li>
      ))}
    </ul>
  );
}

export function PropertyGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="animate-pulse">
          <div className="aspect-[4/3] rounded-2xl bg-ganitel-background-neutral2" />
          <div className="mt-3 h-4 w-3/4 rounded bg-ganitel-background-neutral2" />
          <div className="mt-2 h-3 w-1/2 rounded bg-ganitel-background-neutral2" />
        </li>
      ))}
    </ul>
  );
}
