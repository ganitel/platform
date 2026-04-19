import { describe, it, expect } from 'vitest';
import {
  authService,
  bookingsService,
  negotiationsService,
  paymentsService,
  servicesService,
  wishlistsService,
  apiClient,
  createAxiosInstance,
  handleApiError,
} from './index';

import { authService as authServiceDirect } from './auth.service';
import { bookingsService as bookingsServiceDirect } from './bookings.service';
import { negotiationsService as negotiationsServiceDirect } from './negotiations.service';
import { paymentsService as paymentsServiceDirect } from './payments.service';
import { servicesService as servicesServiceDirect } from './services.service';
import { wishlistsService as wishlistsServiceDirect } from './wishlists.service';
import {
  apiClient as apiClientDirect,
  createAxiosInstance as createAxiosInstanceDirect,
  handleApiError as handleApiErrorDirect,
} from '@/lib/axios';

describe('services index exports', () => {
  it('re-exports all domain services', () => {
    expect(authService).toBe(authServiceDirect);
    expect(bookingsService).toBe(bookingsServiceDirect);
    expect(negotiationsService).toBe(negotiationsServiceDirect);
    expect(paymentsService).toBe(paymentsServiceDirect);
    expect(servicesService).toBe(servicesServiceDirect);
    expect(wishlistsService).toBe(wishlistsServiceDirect);
  });

  it('re-exports axios utilities', () => {
    expect(apiClient).toBe(apiClientDirect);
    expect(createAxiosInstance).toBe(createAxiosInstanceDirect);
    expect(handleApiError).toBe(handleApiErrorDirect);
  });
});
