import { apiClient } from '@/lib/axios';
import {
  ServiceListItem,
  ServiceDetail,
  Review,
  Paginated,
  ServiceSearchFilters,
  ServiceSearchResponse,
} from '@shared/api';

/**
 * Services API service (backend uses /services not /properties)
 */
export const servicesService = {
  /**
   * Search services with filters
   */
  async searchServices(filters: ServiceSearchFilters): Promise<ServiceSearchResponse> {
    const response = await apiClient.get('/services/search', { params: filters });
    return response.data;
  },

  /**
   * Get all services with optional filters
   */
  async getServices(filters?: {
    service_type?: string;
    country?: string;
    city?: string;
    skip?: number;
    limit?: number;
  }): Promise<Paginated<ServiceListItem>> {
    const params = {
      service_type: filters?.service_type,
      country: filters?.country,
      city: filters?.city,
      skip: Math.max(0, filters?.skip ?? 0),
      limit: Math.min(100, Math.max(1, filters?.limit ?? 20)),
    };

    const response = await apiClient.get('/services/', { params });
    const data = response.data as any;

    if (Array.isArray(data?.items)) {
      return data as Paginated<ServiceListItem>;
    }

    if (Array.isArray(data?.services)) {
      return {
        items: data.services,
        page: data.page ?? 1,
        per_page: data.per_page ?? params.limit,
        total: data.total ?? data.services.length,
        pages: data.pages ?? 1,
      };
    }

    if (Array.isArray(data)) {
      return {
        items: data,
        page: 1,
        per_page: data.length,
        total: data.length,
        pages: 1,
      };
    }

    return {
      items: [],
      page: 1,
      per_page: params.limit,
      total: 0,
      pages: 0,
    };
  },

  /**
   * Get service details
   */
  async getServiceDetail(serviceId: string): Promise<ServiceDetail> {
    const response = await apiClient.get(`/services/${serviceId}`);
    return response.data;
  },

  /**
   * Get featured services
   */
  async getFeaturedServices(limit?: number): Promise<ServiceListItem[]> {
    const response = await apiClient.get('/services/featured', { 
      params: limit ? { per_page: limit } : undefined 
    });
    return response.data;
  },

  /**
   * Create a new service (provider only)
   */
  async createService(data: {
    title: string;
    description: string;
    short_description?: string;
    service_type: 'accommodation' | 'tour' | 'activity' | 'transport' | 'dining' | 'wellness';
    accommodation_type?: 'hotel' | 'apartment' | 'house' | 'villa' | 'guesthouse' | 'hostel' | 'resort' | 'lodge';
    country: string;
    city: string;
    address: string;
    latitude?: number;
    longitude?: number;
    base_price: number;
    currency: string;
    price_per: string;
    max_guests?: number;
    bedrooms?: number;
    bathrooms?: number;
    beds?: number;
    amenities?: string[];
    house_rules?: string[];
    images?: string[];
    videos?: string[];
    virtual_tour_url?: string;
  }): Promise<ServiceDetail> {
    const response = await apiClient.post('/services', data);
    return response.data;
  },

  /**
   * Update a service (provider only)
   */
  async updateService(serviceId: string, data: Partial<{
    title: string;
    description: string;
    short_description: string;
    service_type: string;
    accommodation_type: string;
    country: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
    base_price: number;
    currency: string;
    price_per: string;
    max_guests: number;
    bedrooms: number;
    bathrooms: number;
    beds: number;
    amenities: string[];
    house_rules: string[];
    images: string[];
    videos: string[];
    virtual_tour_url: string;
  }>): Promise<ServiceDetail> {
    const response = await apiClient.put(`/services/${serviceId}`, data);
    return response.data;
  },

  /**
   * Delete a service (provider only)
   */
  async deleteService(serviceId: string): Promise<void> {
    await apiClient.delete(`/services/${serviceId}`);
  },

  /**
   * Get provider's services (provider only)
   */
  async getMyServices(): Promise<ServiceListItem[]> {
    const response = await apiClient.get('/services/provider/my-services');
    return response.data;
  },

  /**
   * Get service reviews
   */
  async getServiceReviews(serviceId: string, page?: number, per_page?: number): Promise<Paginated<Review>> {
    const response = await apiClient.get(`/reviews/services/${serviceId}`, {
      params: { page, per_page },
    });
    return response.data;
  },
};
