import { ServiceListItem, ServiceDetail } from '@shared/api';

/**
 * Props interface for PropertyCard component
 */
export interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  isFavorited?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  amenities?: string[];
}

/**
 * Props interface for PropertyDetail page
 */
export interface PropertyDetailProps {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  location: {
    city: string;
    country: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  pricing: {
    basePrice: number;
    currency: string;
    pricePer: string;
  };
  capacity: {
    maxGuests: number;
    bedrooms?: number;
    bathrooms?: number;
    beds?: number;
  };
  rating: {
    average: number;
    count: number;
  };
  images: string[];
  videos?: string[];
  virtualTourUrl?: string;
  amenities?: string[];
  houseRules?: string[];
  serviceType: string;
  accommodationType?: string;
  isFavorited?: boolean;
}

/**
 * Map ServiceListItem to PropertyCard props
 * Transforms backend API response to UI component props
 */
export const mapServiceToCard = (service: ServiceListItem): PropertyCardProps => {
  return {
    id: service.id,
    title: service.title,
    location: `${service.location.city}, ${service.location.country}`,
    price: service.pricing.base_price,
    currency: service.pricing.currency,
    rating: service.rating.average,
    reviewCount: service.rating.count,
    imageUrl: service.images?.[0] || '/placeholder.svg',
    isFavorited: service.is_favorited,
    bedrooms: service.capacity.bedrooms,
    bathrooms: service.capacity.bathrooms,
    maxGuests: service.capacity.max_guests,
    amenities: service.amenities,
  };
};

/**
 * Map ServiceDetail to PropertyDetail props
 * Transforms backend API response to detail page props
 */
export const mapServiceToDetail = (service: ServiceDetail): PropertyDetailProps => {
  return {
    id: service.id,
    title: service.title,
    description: service.description || '',
    shortDescription: service.short_description,
    location: {
      city: service.location.city,
      country: service.location.country,
      address: service.location.address,
      latitude: service.location.latitude,
      longitude: service.location.longitude,
    },
    pricing: {
      basePrice: service.pricing.base_price,
      currency: service.pricing.currency,
      pricePer: service.pricing.price_per,
    },
    capacity: {
      maxGuests: service.capacity.max_guests,
      bedrooms: service.capacity.bedrooms,
      bathrooms: service.capacity.bathrooms,
      beds: service.capacity.beds,
    },
    rating: {
      average: service.rating.average,
      count: service.rating.count,
    },
    images: service.images || [],
    videos: service.videos,
    virtualTourUrl: service.virtual_tour_url,
    amenities: service.amenities,
    houseRules: service.house_rules,
    serviceType: service.service_type,
    accommodationType: service.accommodation_type,
    isFavorited: service.is_favorited,
  };
};
