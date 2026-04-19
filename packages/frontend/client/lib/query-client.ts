import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the QueryClient instance
 * Centralized configuration for all React Query behavior
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch on mount/focus is useful for data freshness
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      
      // Global timeout and retry
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
