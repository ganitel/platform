/**
 * Centralized hook exports
 * Import all hooks from this file for consistency
 */

// Services hooks (replaces Properties hooks)
export {
  useSearchServices,
  useServiceDetail,
  useServiceReviews,
  useFeaturedServices,
  servicesQueryKeys,
} from './useServices';

// Negotiations hooks
export {
  useNegotiation,
  useMyNegotiations,
  useCreateNegotiation,
  useAcceptNegotiation,
  useRejectNegotiation,
  negotiationsQueryKeys,
} from './useNegotiation';

// Auth hooks
export {
  useCurrentUser,
  useLogin,
  useSignup,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useAuth,
  authQueryKeys,
} from './useAuth';

// Wishlist hooks
export {
  useWishlistState,
  usePropertyWishlistToggle,
  useWishlistEntries,
  useWishlistActions,
  useWishlistCount,
  wishlistQueryKeys,
} from './useWishlist';

// Profile & support hooks
export {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from './useProfile';

// export {
//   useSupportRequest,
// } from './useSupportRequest';

// export {
//   usePolicies,
// } from './usePolicies';
