import { describe, it, expect } from 'vitest';

import {
  useSearchServices,
  useServiceDetail,
  useServiceReviews,
  useFeaturedServices,
  servicesQueryKeys,
  useNegotiation,
  useMyNegotiations,
  useCreateNegotiation,
  useAcceptNegotiation,
  useRejectNegotiation,
  negotiationsQueryKeys,
  useCurrentUser,
  useLogin,
  useSignup,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useAuth,
  authQueryKeys,
} from './index';

import {
  useSearchServices as useSearchServicesDirect,
  useServiceDetail as useServiceDetailDirect,
  useServiceReviews as useServiceReviewsDirect,
  useFeaturedServices as useFeaturedServicesDirect,
  servicesQueryKeys as servicesQueryKeysDirect,
} from './useServices';

import {
  useNegotiation as useNegotiationDirect,
  useMyNegotiations as useMyNegotiationsDirect,
  useCreateNegotiation as useCreateNegotiationDirect,
  useAcceptNegotiation as useAcceptNegotiationDirect,
  useRejectNegotiation as useRejectNegotiationDirect,
  negotiationsQueryKeys as negotiationsQueryKeysDirect,
} from './useNegotiation';

import {
  useCurrentUser as useCurrentUserDirect,
  useLogin as useLoginDirect,
  useSignup as useSignupDirect,
  useLogout as useLogoutDirect,
  useForgotPassword as useForgotPasswordDirect,
  useResetPassword as useResetPasswordDirect,
  useAuth as useAuthDirect,
  authQueryKeys as authQueryKeysDirect,
} from './useAuth';

describe('hooks index exports', () => {
  it('re-exports services hooks', () => {
    expect(typeof useSearchServices).toBe('function');
    expect(typeof useServiceDetail).toBe('function');
    expect(typeof useServiceReviews).toBe('function');
    expect(typeof useFeaturedServices).toBe('function');
    expect(servicesQueryKeys).toEqual(servicesQueryKeysDirect);

    expect(useSearchServices.name).toBe(useSearchServicesDirect.name);
    expect(useServiceDetail.name).toBe(useServiceDetailDirect.name);
    expect(useServiceReviews.name).toBe(useServiceReviewsDirect.name);
    expect(useFeaturedServices.name).toBe(useFeaturedServicesDirect.name);
  });

  it('re-exports negotiation hooks', () => {
    expect(typeof useNegotiation).toBe('function');
    expect(typeof useMyNegotiations).toBe('function');
    expect(typeof useCreateNegotiation).toBe('function');
    expect(typeof useAcceptNegotiation).toBe('function');
    expect(typeof useRejectNegotiation).toBe('function');
    expect(negotiationsQueryKeys).toEqual(negotiationsQueryKeysDirect);

    expect(useNegotiation.name).toBe(useNegotiationDirect.name);
    expect(useMyNegotiations.name).toBe(useMyNegotiationsDirect.name);
    expect(useCreateNegotiation.name).toBe(useCreateNegotiationDirect.name);
    expect(useAcceptNegotiation.name).toBe(useAcceptNegotiationDirect.name);
    expect(useRejectNegotiation.name).toBe(useRejectNegotiationDirect.name);
  });

  it('re-exports auth hooks', () => {
    expect(typeof useCurrentUser).toBe('function');
    expect(typeof useLogin).toBe('function');
    expect(typeof useSignup).toBe('function');
    expect(typeof useLogout).toBe('function');
    expect(typeof useForgotPassword).toBe('function');
    expect(typeof useResetPassword).toBe('function');
    expect(typeof useAuth).toBe('function');
    expect(authQueryKeys).toEqual(authQueryKeysDirect);

    expect(useCurrentUser.name).toBe(useCurrentUserDirect.name);
    expect(useLogin.name).toBe(useLoginDirect.name);
    expect(useSignup.name).toBe(useSignupDirect.name);
    expect(useLogout.name).toBe(useLogoutDirect.name);
    expect(useForgotPassword.name).toBe(useForgotPasswordDirect.name);
    expect(useResetPassword.name).toBe(useResetPasswordDirect.name);
    expect(useAuth.name).toBe(useAuthDirect.name);
  });
});
