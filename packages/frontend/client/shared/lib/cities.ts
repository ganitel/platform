/**
 * Cameroon cities used by the homepage entry flow (city bottom-sheet) and the
 * "Popular Cities" rail. `query` is what we pass to /browse as `?q=` — the
 * experiences search index already covers the city field, so this scopes
 * discovery to a city without a dedicated filter param (added later).
 */

export interface City {
  /** Display name (proper noun — same in fr/en). */
  name: string;
  /** Search term passed to /browse?kind=experiences&q=… */
  query: string;
}

export const CAMEROON_CITIES: ReadonlyArray<City> = [
  { name: "Douala", query: "Douala" },
  { name: "Yaoundé", query: "Yaoundé" },
  { name: "Kribi", query: "Kribi" },
  { name: "Limbé", query: "Limbe" },
  { name: "Buéa", query: "Buea" },
  { name: "Bafoussam", query: "Bafoussam" },
];

export function browseCityHref(city: City): string {
  return `/browse?kind=experiences&q=${encodeURIComponent(city.query)}`;
}
