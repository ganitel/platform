import {
  useQuery,
  useMutation,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { negotiationsService } from '@/services/negotiations.service';
import { Negotiation, NegotiationRequest, Paginated } from '@shared/api';
import { queryClient } from '@/lib/query-client';

/**
 * Query keys for negotiations
 */
export const negotiationsQueryKeys = {
  all: ['negotiations'] as const,
  negotiation: (id: string) => [...negotiationsQueryKeys.all, 'detail', id] as const,
  myNegotiations: (status?: string) =>
    [...negotiationsQueryKeys.all, 'my', status || 'all'] as const,
};

/**
 * Cache configuration for negotiations
 */
const CACHE_CONFIG = {
  negotiationStaleTime: 5 * 60 * 1000, // 5 minutes
  negotiationGcTime: 15 * 60 * 1000, // 15 minutes
  myNegotiationsStaleTime: 2 * 60 * 1000, // 2 minutes (frequently changes)
  myNegotiationsGcTime: 10 * 60 * 1000, // 10 minutes
};

/**
 * Hook: Get negotiation details
 */
export const useNegotiation = (
  negotiationId: string | undefined,
  enabled: boolean = true
): UseQueryResult<Negotiation, Error> => {
  return useQuery({
    queryKey: negotiationId ? negotiationsQueryKeys.negotiation(negotiationId) : [],
    queryFn: () => {
      if (!negotiationId) throw new Error('Negotiation ID is required');
      return negotiationsService.getNegotiation(negotiationId);
    },
    enabled: enabled && !!negotiationId,
    staleTime: CACHE_CONFIG.negotiationStaleTime,
    gcTime: CACHE_CONFIG.negotiationGcTime,
  });
};

/**
 * Hook: Get current user's negotiations
 */
export const useMyNegotiations = (
  status?: string,
  enabled: boolean = true
): UseQueryResult<Paginated<Negotiation>, Error> => {
  return useQuery({
    queryKey: negotiationsQueryKeys.myNegotiations(status),
    queryFn: () => negotiationsService.getMyNegotiations(status),
    enabled,
    staleTime: CACHE_CONFIG.myNegotiationsStaleTime,
    gcTime: CACHE_CONFIG.myNegotiationsGcTime,
  });
};

/**
 * Hook: Create a negotiation request
 * Invalidates user's negotiations list on success
 */
export const useCreateNegotiation = (): UseMutationResult<
  Negotiation,
  Error,
  NegotiationRequest,
  unknown
> => {
  return useMutation({
    mutationFn: (data: NegotiationRequest) =>
      negotiationsService.createNegotiation(data),
    onSuccess: () => {
      // Invalidate my negotiations list to refetch
      queryClient.invalidateQueries({
        queryKey: negotiationsQueryKeys.myNegotiations(),
      });
    },
  });
};

/**
 * Hook: Accept a negotiation offer
 * Invalidates the specific negotiation and user's negotiations list on success
 */
export const useAcceptNegotiation = (): UseMutationResult<
  Negotiation,
  Error,
  string,
  unknown
> => {
  return useMutation({
    mutationFn: (negotiationId: string) =>
      negotiationsService.acceptNegotiation(negotiationId),
    onSuccess: (data) => {
      // Invalidate specific negotiation
      queryClient.invalidateQueries({
        queryKey: negotiationsQueryKeys.negotiation(data.id),
      });
      // Invalidate my negotiations list
      queryClient.invalidateQueries({
        queryKey: negotiationsQueryKeys.myNegotiations(),
      });
    },
  });
};

/**
 * Hook: Reject a negotiation offer
 * Invalidates the specific negotiation and user's negotiations list on success
 */
export const useRejectNegotiation = (): UseMutationResult<
  Negotiation,
  Error,
  string,
  unknown
> => {
  return useMutation({
    mutationFn: (negotiationId: string) =>
      negotiationsService.rejectNegotiation(negotiationId),
    onSuccess: (data) => {
      // Invalidate specific negotiation
      queryClient.invalidateQueries({
        queryKey: negotiationsQueryKeys.negotiation(data.id),
      });
      // Invalidate my negotiations list
      queryClient.invalidateQueries({
        queryKey: negotiationsQueryKeys.myNegotiations(),
      });
    },
  });
};
