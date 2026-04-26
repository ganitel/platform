import { useQuery } from "@tanstack/react-query";

import { getProperty, searchProperties } from "@/features/properties/api";
import type { SearchFilters } from "@/features/properties/types";

export function propertyKey(id: string) {
  return ["property", id] as const;
}

export function searchKey(filters: SearchFilters) {
  return ["properties", "search", filters] as const;
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: propertyKey(id ?? ""),
    queryFn: () => getProperty(id as string),
    enabled: !!id,
  });
}

export function useSearchProperties(filters: SearchFilters = {}) {
  return useQuery({
    queryKey: searchKey(filters),
    queryFn: () => searchProperties(filters),
  });
}
