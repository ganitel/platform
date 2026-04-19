import {
  useQuery,
  useMutation,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { User, Paginated, Booking } from '@shared/api';
import { queryClient } from '@/lib/query-client';

/**
 * Query keys for profile
 */
export const profileQueryKeys = {
  all: ['profile'] as const,
  profile: () => [...profileQueryKeys.all, 'profile'] as const,
  bookings: (status?: string) => [...profileQueryKeys.all, 'bookings', status] as const,
};

/**
 * Cache configuration for profile
 */
const CACHE_CONFIG = {
  profileStaleTime: 5 * 60 * 1000, // 5 minutes
  profileGcTime: 15 * 60 * 1000, // 15 minutes
  bookingsStaleTime: 2 * 60 * 1000, // 2 minutes
  bookingsGcTime: 10 * 60 * 1000, // 10 minutes
};

/**
 * Hook: Get current user profile
 */
export const useProfile = (
  enabled: boolean = true
): UseQueryResult<User, Error> => {
  return useQuery({
    queryKey: profileQueryKeys.profile(),
    queryFn: () => usersService.getProfile(),
    enabled,
    staleTime: CACHE_CONFIG.profileStaleTime,
    gcTime: CACHE_CONFIG.profileGcTime,
  });
};

/**
 * Hook: Update user profile
 * Invalidates profile cache on success
 */
export const useUpdateProfile = (): UseMutationResult<
  User,
  Error,
  Partial<Pick<User, 'first_name' | 'last_name' | 'phone' | 'bio' | 'country' | 'city'>>
> => {
  return useMutation({
    mutationFn: (data) => usersService.updateProfile(data),
    onSuccess: () => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile() });
    },
  });
};

/**
 * Hook: Upload profile avatar
 * Invalidates profile cache on success
 */
export const useUploadAvatar = (): UseMutationResult<
  { url: string },
  Error,
  File
> => {
  return useMutation({
    mutationFn: (file) => usersService.uploadAvatar(file),
    onSuccess: () => {
      // Invalidate and refetch profile data to get updated avatar URL
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.profile() });
    },
  });
};

/**
 * Hook: Get current user's bookings
 */
export const useMyBookings = (
  status?: string,
  enabled: boolean = true
): UseQueryResult<Paginated<Booking>, Error> => {
  return useQuery({
    queryKey: profileQueryKeys.bookings(status),
    queryFn: () => usersService.getMyBookings(status),
    enabled,
    staleTime: CACHE_CONFIG.bookingsStaleTime,
    gcTime: CACHE_CONFIG.bookingsGcTime,
  });
};

/**
 * Hook: Change user password
 */
export const useChangePassword = (): UseMutationResult<
  void,
  Error,
  { current_password: string; new_password: string }
> => {
  return useMutation({
    mutationFn: (data) => usersService.changePassword(data),
  });
};