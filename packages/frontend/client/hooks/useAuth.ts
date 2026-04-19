import {
  useQuery,
  useMutation,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { AuthResponse, User } from '@shared/api';
import { queryClient } from '@/lib/query-client';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Query keys for auth
 */
export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'currentUser'] as const,
};

/**
 * Cache configuration for auth
 */
const CACHE_CONFIG = {
  userStaleTime: 10 * 60 * 1000, // 10 minutes
  userGcTime: 30 * 60 * 1000, // 30 minutes
};

/**
 * Hook: Get current authenticated user
 */
export const useCurrentUser = (
  enabled: boolean = true
): UseQueryResult<User, Error> => {
  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    enabled,
    staleTime: CACHE_CONFIG.userStaleTime,
    gcTime: CACHE_CONFIG.userGcTime,
  });
};

/**
 * Hook: Login user
 * Fetches current user and invalidates any cached data on success
 */
export const useLogin = (): UseMutationResult<
  AuthResponse,
  Error,
  { email: string; password: string },
  unknown
> => {
  return useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess: () => {
      // Refetch current user after login
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.currentUser(),
      });
    },
  });
};

/**
 * Hook: Sign up new user
 * Fetches current user and invalidates any cached data on success
 */
export const useSignup = (): UseMutationResult<
  AuthResponse,
  Error,
  {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    user_type?: 'traveler' | 'provider' | 'admin';
    country?: string;
    city?: string;
  },
  unknown
> => {
  return useMutation({
    mutationFn: (data) => authService.register({
      user_type: 'traveler',
      country: '',
      city: '',
      ...data,
    }),
    onSuccess: () => {
      // Refetch current user after signup
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.currentUser(),
      });
    },
  });
};

/**
 * Hook: Logout current user
 * Clears all cached data on success
 */
export const useLogout = (): UseMutationResult<void, Error, void, unknown> => {
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all queries cache on logout
      queryClient.clear();
    },
  });
};

/**
 * Hook: Forgot password
 */
export const useForgotPassword = (): UseMutationResult<
  { message: string },
  Error,
  string,
  unknown
> => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
};

/**
 * Hook: Reset password with token
 */
export const useResetPassword = (): UseMutationResult<
  { message: string },
  Error,
  { token: string; newPassword: string },
  unknown
> => {
  return useMutation({
    mutationFn: ({ token, newPassword }) =>
      authService.resetPassword(token, newPassword),
  });
};

/**
 * Composite hook: useAuth
 * Returns authentication state and methods
 * Combines AuthContext (session/OTP/OAuth) with React Query mutations
 */
export const useAuth = () => {
  const authCtx = useAuthContext();
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const logoutMutation = useLogout();

  return {
    // User state (from AuthContext — session-aware)
    user: authCtx.user,
    isAuthenticated: authCtx.isAuthenticated,
    isLoadingUser: authCtx.isLoading,
    error: authCtx.error,

    // OTP methods (from AuthContext via adapter)
    sendOtp: authCtx.sendOtp,
    verifyOtp: authCtx.verifyOtp,

    // Google OAuth (from AuthContext via adapter)
    signInWithGoogle: authCtx.signInWithGoogle,
    handleGoogleCallback: authCtx.handleGoogleCallback,

    // Session-level sign out (from AuthContext)
    signOut: authCtx.signOut,

    // Registration (from AuthContext via adapter)
    register: authCtx.register,

    // Legacy React Query mutations (still available for direct password-based flow)
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,

    signup: signupMutation.mutate,
    signupAsync: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,

    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,

    // Raw mutations for advanced usage
    loginMutation,
    signupMutation,
    logoutMutation,
  };
};
