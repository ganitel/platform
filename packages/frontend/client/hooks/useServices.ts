import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { servicesService } from '@/services/services.service';
import {
  ServiceListItem,
  ServiceDetail,
  Review,
  Paginated,
  ServiceSearchFilters,
  ServiceSearchResponse,
} from '@shared/api';

/**
 * Query keys for services
 */
export const servicesQueryKeys = {
  all: ['services'] as const,
  search: (filters: ServiceSearchFilters) => [...servicesQueryKeys.all, 'search', filters] as const,
  detail: (id: string) => [...servicesQueryKeys.all, 'detail', id] as const,
  reviews: (id: string, page?: number, per_page?: number) =>
    [...servicesQueryKeys.all, 'reviews', id, { page, per_page }] as const,
  featured: (limit?: number) => [...servicesQueryKeys.all, 'featured', limit] as const,
};

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  searchStaleTime: 5 * 60 * 1000, // 5 minutes
  searchGcTime: 15 * 60 * 1000, // 15 minutes
  detailStaleTime: 10 * 60 * 1000, // 10 minutes
  detailGcTime: 30 * 60 * 1000, // 30 minutes
  reviewsStaleTime: 10 * 60 * 1000, // 10 minutes
  reviewsGcTime: 30 * 60 * 1000, // 30 minutes
  featuredStaleTime: 15 * 60 * 1000, // 15 minutes
  featuredGcTime: 60 * 60 * 1000, // 1 hour
};

/**
 * Hook: Search services with filters
 * Supports pagination through filters.page
 */
export const useSearchServices = (
  filters: ServiceSearchFilters,
  enabled: boolean = true
): UseQueryResult<ServiceSearchResponse, Error> => {
  return useQuery({
    queryKey: servicesQueryKeys.search(filters),
    queryFn: () => servicesService.searchServices(filters),
    enabled,
    staleTime: CACHE_CONFIG.searchStaleTime,
    gcTime: CACHE_CONFIG.searchGcTime,
  });
};

/**
 * Hook: Get service details
 */
export const useServiceDetail = (
  serviceId: string | undefined,
  enabled: boolean = true
): UseQueryResult<ServiceDetail, Error> => {
  return useQuery({
    queryKey: serviceId ? servicesQueryKeys.detail(serviceId) : [],
    queryFn: () => {
      if (!serviceId) throw new Error('Service ID is required');
      return servicesService.getServiceDetail(serviceId);
    },
    enabled: enabled && !!serviceId,
    staleTime: CACHE_CONFIG.detailStaleTime,
    gcTime: CACHE_CONFIG.detailGcTime,
  });
};

/**
 * Hook: Get service reviews with pagination
 */
export const useServiceReviews = (
  serviceId: string | undefined,
  page?: number,
  per_page?: number,
  enabled: boolean = true
): UseQueryResult<Paginated<Review>, Error> => {
  return useQuery({
    queryKey: serviceId ? servicesQueryKeys.reviews(serviceId, page, per_page) : [],
    queryFn: () => {
      if (!serviceId) throw new Error('Service ID is required');
      return servicesService.getServiceReviews(serviceId, page, per_page);
    },
    enabled: enabled && !!serviceId,
    staleTime: CACHE_CONFIG.reviewsStaleTime,
    gcTime: CACHE_CONFIG.reviewsGcTime,
  });
};

/**
 * Hook: Get featured services
 */
export const useFeaturedServices = (
  limit?: number,
  enabled: boolean = true
): UseQueryResult<ServiceListItem[], Error> => {
  return useQuery({
    queryKey: servicesQueryKeys.featured(limit),
    queryFn: () => servicesService.getFeaturedServices(limit),
    enabled,
    staleTime: CACHE_CONFIG.featuredStaleTime,
    gcTime: CACHE_CONFIG.featuredGcTime,
  });
};
