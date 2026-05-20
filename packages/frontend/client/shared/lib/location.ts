export interface LocationPick {
  address: string;
  city: string;
  country: string;
  country_code: string;
  lat: number;
  lng: number;
}

export interface PhotonFeature {
  geometry: { coordinates: [number, number]; type: "Point" };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    osm_id?: number;
    osm_type?: string;
    type?: string;
  };
}

function buildAddress(
  p: PhotonFeature["properties"],
  city: string,
  country: string,
): string {
  const parts: string[] = [];
  if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
  else if (p.street) parts.push(p.street);
  else if (p.name && p.name !== city && p.name !== p.street) parts.push(p.name);
  if (p.district && p.district !== city) parts.push(p.district);
  parts.push(city);
  if (p.state && p.state !== city) parts.push(p.state);
  parts.push(country);
  return parts.join(", ");
}

export function featureToPick(feature: PhotonFeature): LocationPick | null {
  const p = feature.properties;
  const city = p.city ?? p.locality ?? p.county ?? p.name ?? "";
  const country = p.country ?? "";
  const country_code = (p.countrycode ?? "").toUpperCase();
  if (!city || !country || !country_code) return null;
  const [lng, lat] = feature.geometry.coordinates;
  return {
    address: buildAddress(p, city, country),
    city,
    country,
    country_code,
    lat,
    lng,
  };
}
