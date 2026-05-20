import { useQuery } from "@tanstack/react-query";

import {
  listExperienceTypes,
  listPropertyTypes,
  type ExperienceTypeRef,
  type PropertyTypeRef,
} from "@/features/reference/api";
import { useLocale, type Locale } from "@/shared/lib/i18n";

type Ref = PropertyTypeRef | ExperienceTypeRef;

function labelOf(ref: Ref, locale: Locale): string {
  return locale === "en" ? ref.label_en : ref.label_fr;
}

/**
 * Returns a `(code) => string` lookup that resolves a reference code to its
 * localized label. Falls back to the code itself while the query is loading
 * or for codes the catalog doesn't know about — never throws or returns
 * empty so the table cell is always populated.
 */
export function usePropertyTypeLabel(): (code: string) => string {
  const locale = useLocale();
  const { data } = useQuery({
    queryKey: ["reference", "property-types"],
    queryFn: listPropertyTypes,
    staleTime: 5 * 60 * 1000,
  });
  return (code: string) => {
    const match = data?.find((r) => r.code === code);
    return match ? labelOf(match, locale) : code;
  };
}

export function useExperienceTypeLabel(): (code: string) => string {
  const locale = useLocale();
  const { data } = useQuery({
    queryKey: ["reference", "experience-types"],
    queryFn: listExperienceTypes,
    staleTime: 5 * 60 * 1000,
  });
  return (code: string) => {
    const match = data?.find((r) => r.code === code);
    return match ? labelOf(match, locale) : code;
  };
}
