import type { ExperiencePublic } from "@/features/experiences/types";
import { ExperienceCard } from "@/features/experiences/components/experience-card";

export function ExperienceGrid({ items }: { items: ExperiencePublic[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((e) => (
        <li key={e.id}>
          <ExperienceCard experience={e} />
        </li>
      ))}
    </ul>
  );
}

export function ExperienceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-[18px] bg-ganitel-background-neutral2" />
          <div className="mt-5 h-5 w-3/4 rounded bg-ganitel-background-neutral2" />
          <div className="mt-3 h-3 w-1/2 rounded bg-ganitel-background-neutral2" />
          <div className="mt-3 h-4 w-1/3 rounded bg-ganitel-background-neutral2" />
        </li>
      ))}
    </ul>
  );
}
