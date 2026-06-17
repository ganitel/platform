import { useQuery } from "@tanstack/react-query";

import {
  searchExperiences,
  type ExperienceSearchFilters,
} from "@/features/experiences/api";

export function experienceSearchKey(filters: ExperienceSearchFilters) {
  return ["experiences", "search", filters] as const;
}

export function useSearchExperiences(filters: ExperienceSearchFilters = {}) {
  return useQuery({
    queryKey: experienceSearchKey(filters),
    queryFn: () => searchExperiences(filters),
  });
}
