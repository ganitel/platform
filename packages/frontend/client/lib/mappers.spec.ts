import { describe, it, expect } from 'vitest';
import { mapServiceToCard, mapServiceToDetail } from './mappers';
import type { ServiceListItem, ServiceDetail } from '@shared/api';

describe('mappers', () => {
  describe('mapServiceToCard', () => {
    it('should map ServiceListItem to PropertyCardProps', () => {
      const service: ServiceListItem = {
        id: '123',
        title: 'Beautiful Apartment',
        description: 'A nice place',
        service_type: 'accommodation',
        accommodation_type: 'apartment',
        status: 'active',
        provider_id: 'provider-1',
        location: {
          city: 'Paris',
          country: 'France',
          address: '123 Main St',
          latitude: 48.8566,
          longitude: 2.3522,
        },
        pricing: {
          base_price: 100,
          currency: 'EUR',
          price_per: 'night',
        },
        capacity: {
          max_guests: 4,
          bedrooms: 2,
          bathrooms: 1,
          beds: 2,
        },
        rating: {
          average: 4.5,
          count: 10,
        },
        images: ['image1.jpg', 'image2.jpg'],
        amenities: ['wifi', 'parking'],
        is_favorited: true,
      };

      const result = mapServiceToCard(service);

      expect(result).toEqual({
        id: '123',
        title: 'Beautiful Apartment',
        location: 'Paris, France',
        price: 100,
        currency: 'EUR',
        rating: 4.5,
        reviewCount: 10,
        imageUrl: 'image1.jpg',
        isFavorited: true,
        bedrooms: 2,
        bathrooms: 1,
        maxGuests: 4,
        amenities: ['wifi', 'parking'],
      });
    });

    it('should use placeholder image when no images available', () => {
      const service: ServiceListItem = {
        id: '123',
        title: 'Test',
        service_type: 'accommodation',
        status: 'active',
        provider_id: 'provider-1',
        location: {
          city: 'Paris',
          country: 'France',
          address: '123 Main St',
        },
        pricing: {
          base_price: 100,
          currency: 'EUR',
          price_per: 'night',
        },
        capacity: {
          max_guests: 2,
        },
        rating: {
          average: 0,
          count: 0,
        },
      };

      const result = mapServiceToCard(service);

      expect(result.imageUrl).toBe('/placeholder.svg');
    });
  });

  describe('mapServiceToDetail', () => {
    it('should map ServiceDetail to PropertyDetailProps', () => {
      const service: ServiceDetail = {
        id: '123',
        title: 'Luxury Villa',
        description: 'A beautiful luxury villa',
        short_description: 'Luxury villa in the heart of the city',
        service_type: 'accommodation',
        accommodation_type: 'villa',
        status: 'active',
        provider_id: 'provider-1',
        location: {
          city: 'Nice',
          country: 'France',
          address: '456 Beach Rd',
          latitude: 43.7102,
          longitude: 7.2620,
        },
        pricing: {
          base_price: 500,
          currency: 'EUR',
          price_per: 'night',
        },
        capacity: {
          max_guests: 8,
          bedrooms: 4,
          bathrooms: 3,
          beds: 5,
        },
        rating: {
          average: 4.8,
          count: 25,
        },
        images: ['villa1.jpg', 'villa2.jpg'],
        videos: ['tour.mp4'],
        virtual_tour_url: 'https://tour.example.com',
        amenities: ['pool', 'wifi', 'parking'],
        house_rules: ['no smoking', 'no pets'],
        is_favorited: false,
      };

      const result = mapServiceToDetail(service);

      expect(result).toEqual({
        id: '123',
        title: 'Luxury Villa',
        description: 'A beautiful luxury villa',
        shortDescription: 'Luxury villa in the heart of the city',
        location: {
          city: 'Nice',
          country: 'France',
          address: '456 Beach Rd',
          latitude: 43.7102,
          longitude: 7.2620,
        },
        pricing: {
          basePrice: 500,
          currency: 'EUR',
          pricePer: 'night',
        },
        capacity: {
          maxGuests: 8,
          bedrooms: 4,
          bathrooms: 3,
          beds: 5,
        },
        rating: {
          average: 4.8,
          count: 25,
        },
        images: ['villa1.jpg', 'villa2.jpg'],
        videos: ['tour.mp4'],
        virtualTourUrl: 'https://tour.example.com',
        amenities: ['pool', 'wifi', 'parking'],
        houseRules: ['no smoking', 'no pets'],
        serviceType: 'accommodation',
        accommodationType: 'villa',
        isFavorited: false,
      });
    });

    it('should handle missing optional fields', () => {
      const service: ServiceDetail = {
        id: '123',
        title: 'Basic Room',
        service_type: 'accommodation',
        status: 'active',
        provider_id: 'provider-1',
        location: {
          city: 'Lyon',
          country: 'France',
          address: '789 Street',
        },
        pricing: {
          base_price: 50,
          currency: 'EUR',
          price_per: 'night',
        },
        capacity: {
          max_guests: 2,
        },
        rating: {
          average: 4.0,
          count: 5,
        },
      };

      const result = mapServiceToDetail(service);

      expect(result.description).toBe('');
      expect(result.shortDescription).toBeUndefined();
      expect(result.images).toEqual([]);
      expect(result.videos).toBeUndefined();
      expect(result.virtualTourUrl).toBeUndefined();
      expect(result.amenities).toBeUndefined();
      expect(result.houseRules).toBeUndefined();
    });
  });
});
