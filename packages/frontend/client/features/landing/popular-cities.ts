import type { TranslationKey } from "@/shared/lib/i18n";
import { browseCityHref, type City } from "@/shared/lib/cities";
import {
  DEST_EAST_FALLBACK,
  DEST_EAST_SOURCE,
  DEST_HIGHLANDS_FALLBACK,
  DEST_HIGHLANDS_SOURCE,
  DEST_LITTORAL_FALLBACK,
  DEST_LITTORAL_SOURCE,
  DEST_SW_FALLBACK,
  DEST_SW_SOURCE,
} from "./hero-source";

export interface PopularCity {
  name: string;
  href: string;
  source: string;
  fallback: string;
  altKey: TranslationKey;
}

function city(name: string, query: string): City {
  return { name, query };
}

export const POPULAR_CITIES: ReadonlyArray<PopularCity> = [
  {
    name: "Kribi",
    href: browseCityHref(city("Kribi", "Kribi")),
    source: DEST_SW_SOURCE,
    fallback: DEST_SW_FALLBACK,
    altKey: "landing.alt.sw",
  },
  {
    name: "Douala",
    href: browseCityHref(city("Douala", "Douala")),
    source: DEST_LITTORAL_SOURCE,
    fallback: DEST_LITTORAL_FALLBACK,
    altKey: "landing.alt.littoral",
  },
  {
    name: "Yaoundé",
    href: browseCityHref(city("Yaoundé", "Yaoundé")),
    source: DEST_HIGHLANDS_SOURCE,
    fallback: DEST_HIGHLANDS_FALLBACK,
    altKey: "landing.alt.highlands",
  },
  {
    name: "Limbé",
    href: browseCityHref(city("Limbé", "Limbe")),
    source: DEST_EAST_SOURCE,
    fallback: DEST_EAST_FALLBACK,
    altKey: "landing.alt.east",
  },
];
