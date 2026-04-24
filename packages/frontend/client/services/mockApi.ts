/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  AuthResponse,
  Booking,
  Negotiation,
  Paginated,
  Payment,
  PaymentInitiateResponse,
  Review,
  ServiceDetail,
  ServiceListItem,
  ServiceSearchFilters,
  ServiceSearchResponse,
  WishlistItem,
} from '@shared/api';
import { getMockPropertyDetail, MOCK_PROPERTIES } from '@/mockData';
import {
  DEV_ADMIN_BYPASS_AUTH_RESPONSE,
  DEV_ADMIN_BYPASS_USER,
  isAdminBypassSessionActive,
} from '@/services/adminBypass';

const mockServiceState: ServiceListItem[] = [...MOCK_PROPERTIES];
const mockWishlistState = new Set<string>();
const mockBookingState: Booking[] = [];
const mockNegotiationState: Negotiation[] = [];
const mockPaymentState: Payment[] = [];

const nowIso = () => new Date().toISOString();

function normalizePath(url?: string): string {
  if (!url) return '/';
  const [rawPath] = url.split('?');
  let path = rawPath;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      path = new URL(path).pathname;
    } catch {
      // Keep raw path if URL parsing fails.
    }
  }

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (path.startsWith('/api/v1')) {
    path = path.slice('/api/v1'.length) || '/';
  }

  return path;
}

function parseBody(data: unknown): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

function buildResponse<T>(config: AxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status >= 400 ? 'Error' : 'OK',
    headers: {},
    config: config as any,
  };
}

function getServiceOrThrow(serviceId: string): ServiceListItem {
  const found = mockServiceState.find((service) => service.id === serviceId);
  if (!found) {
    throw new Error(`Service ${serviceId} not found in mock dataset`);
  }
  return found;
}

function toPaginated<T>(items: T[], page = 1, per_page = items.length || 1): Paginated<T> {
  return {
    items,
    page,
    per_page,
    total: items.length,
    pages: 1,
  };
}

function handleServiceSearch(params: ServiceSearchFilters | undefined): ServiceSearchResponse {
  const q = params?.q?.trim().toLowerCase();
  const filtered = mockServiceState.filter((service) => {
    if (params?.service_type && service.service_type !== params.service_type) return false;
    if (params?.city && service.location.city.toLowerCase() !== params.city.toLowerCase()) return false;
    if (params?.country && service.location.country.toLowerCase() !== params.country.toLowerCase()) return false;
    if (typeof params?.min_price === 'number' && service.pricing.base_price < params.min_price) return false;
    if (typeof params?.max_price === 'number' && service.pricing.base_price > params.max_price) return false;
    if (q) {
      const haystack = `${service.title} ${service.description || ''} ${service.location.city} ${service.location.country}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return {
    services: filtered,
    pagination: {
      total: filtered.length,
      page: params?.page || 1,
      per_page: params?.per_page || filtered.length || 1,
      pages: 1,
    },
    filters_applied: params || {},
  };
}

function handleServiceReviews(serviceId: string): Paginated<Review> {
  const review: Review = {
    id: `review-${serviceId}`,
    service_id: serviceId,
    user_id: DEV_ADMIN_BYPASS_USER.id,
    overall_rating: 5,
    title: 'Excellent stay',
    comment: 'Mock review generated for admin bypass mode.',
    status: 'published',
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  return toPaginated([review]);
}

function handleBookingCreate(body: any): Booking {
  const booking: Booking = {
    id: `booking-${mockBookingState.length + 1}`,
    user_id: DEV_ADMIN_BYPASS_USER.id,
    service_id: body.service_id,
    start_date: body.start_date,
    end_date: body.end_date,
    guests: body.guests,
    status: 'confirmed',
    total_amount: getServiceOrThrow(body.service_id).pricing.base_price,
    currency: getServiceOrThrow(body.service_id).pricing.currency,
    notes: body.notes,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  mockBookingState.unshift(booking);
  return booking;
}

function handleNegotiationCreate(body: any): Negotiation {
  const targetService = getServiceOrThrow(body.service_id);
  const negotiation: Negotiation = {
    id: `neg-${mockNegotiationState.length + 1}`,
    booking_id: body.booking_id,
    service_id: body.service_id,
    user_id: DEV_ADMIN_BYPASS_USER.id,
    provider_id: targetService.provider_id,
    original_price: body.original_price,
    proposed_price: body.proposed_price,
    currency: body.currency,
    status: 'pending',
    message: body.message,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  mockNegotiationState.unshift(negotiation);
  return negotiation;
}

function handlePaymentInitiation(body: any): PaymentInitiateResponse {
  const paymentId = `pay-${mockPaymentState.length + 1}`;
  const payment: Payment = {
    id: paymentId,
    booking_id: body.booking_id,
    amount: body.amount,
    currency: body.currency,
    provider: body.provider,
    transaction_id: `txn-${mockPaymentState.length + 1}`,
    status: 'pending',
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  mockPaymentState.unshift(payment);

  return {
    payment_id: payment.id,
    transaction_id: payment.transaction_id || '',
    payment_url: `https://mock-payments.local/${payment.id}`,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    message: 'Mock payment initiated successfully.',
  };
}

export async function handleAdminBypassMockRequest(
  config: AxiosRequestConfig
): Promise<AxiosResponse<any>> {
  const method = (config.method || 'get').toLowerCase();
  const path = normalizePath(config.url);
  const params = (config.params || {}) as Record<string, any>;
  const body = parseBody(config.data);

  if (method === 'get' && path === '/users/me') {
    return buildResponse(config, DEV_ADMIN_BYPASS_USER);
  }

  if (method === 'post' && path === '/auth/refresh-token') {
    const response: AuthResponse = {
      ...DEV_ADMIN_BYPASS_AUTH_RESPONSE,
      expires_in: 3600,
    };
    return buildResponse(config, response);
  }

  if (method === 'post' && path === '/auth/logout') {
    return buildResponse(config, { message: 'Logged out from mock session.' });
  }

  if (method === 'post' && path === '/auth/login') {
    return buildResponse(config, DEV_ADMIN_BYPASS_AUTH_RESPONSE);
  }

  if (method === 'post' && path === '/auth/register') {
    const response: AuthResponse = {
      ...DEV_ADMIN_BYPASS_AUTH_RESPONSE,
      user: {
        ...DEV_ADMIN_BYPASS_USER,
        email: body?.email || DEV_ADMIN_BYPASS_USER.email,
        first_name: body?.first_name || DEV_ADMIN_BYPASS_USER.first_name,
        last_name: body?.last_name || DEV_ADMIN_BYPASS_USER.last_name,
        phone: body?.phone,
      },
    };
    return buildResponse(config, response, 201);
  }

  if (method === 'post' && (path === '/auth/forgot-password' || path === '/auth/reset-password')) {
    return buildResponse(config, { message: 'Mock auth operation completed.' });
  }

  if (method === 'get' && path === '/services/search') {
    return buildResponse(config, handleServiceSearch(params as ServiceSearchFilters));
  }

  if (method === 'get' && path === '/services/featured') {
    return buildResponse(config, mockServiceState.slice(0, params?.per_page || 4));
  }

  if (method === 'get' && path === '/services/provider/my-services') {
    return buildResponse(config, mockServiceState.slice(0, 3));
  }

  if (method === 'get' && path === '/services/') {
    const items = mockServiceState.filter((service) => {
      if (params?.service_type && service.service_type !== params.service_type) return false;
      if (params?.country && service.location.country !== params.country) return false;
      if (params?.city && service.location.city !== params.city) return false;
      return true;
    });
    return buildResponse(config, toPaginated(items, 1, Number(params?.limit) || items.length || 1));
  }

  const serviceDetailMatch = path.match(/^\/services\/([^/]+)$/);
  if (serviceDetailMatch && method === 'get') {
    const serviceId = serviceDetailMatch[1];
    const detail = getMockPropertyDetail(serviceId) || (getServiceOrThrow(serviceId) as ServiceDetail);
    return buildResponse(config, detail);
  }

  if (method === 'post' && path === '/services') {
    const created: ServiceDetail = {
      ...body,
      id: `service-${mockServiceState.length + 1}`,
      status: 'active',
      provider_id: DEV_ADMIN_BYPASS_USER.id,
      rating: { average: 0, count: 0 },
      created_at: nowIso(),
      updated_at: nowIso(),
    } as ServiceDetail;
    mockServiceState.unshift(created);
    return buildResponse(config, created, 201);
  }

  const serviceUpdateMatch = path.match(/^\/services\/([^/]+)$/);
  if (serviceUpdateMatch && method === 'put') {
    const service = getServiceOrThrow(serviceUpdateMatch[1]);
    const updated = { ...service, ...body, updated_at: nowIso() } as ServiceDetail;
    const index = mockServiceState.findIndex((item) => item.id === service.id);
    if (index >= 0) {
      mockServiceState[index] = updated;
    }
    return buildResponse(config, updated);
  }

  const serviceDeleteMatch = path.match(/^\/services\/([^/]+)$/);
  if (serviceDeleteMatch && method === 'delete') {
    const serviceId = serviceDeleteMatch[1];
    const index = mockServiceState.findIndex((item) => item.id === serviceId);
    if (index >= 0) {
      mockServiceState.splice(index, 1);
    }
    return buildResponse(config, { success: true });
  }

  const serviceReviewMatch = path.match(/^\/reviews\/services\/([^/]+)$/);
  if (serviceReviewMatch && method === 'get') {
    return buildResponse(config, handleServiceReviews(serviceReviewMatch[1]));
  }

  const wishlistToggleMatch = path.match(/^\/wishlists\/services\/([^/]+)\/toggle$/);
  if (wishlistToggleMatch && method === 'post') {
    const serviceId = wishlistToggleMatch[1];
    const exists = mockWishlistState.has(serviceId);
    if (exists) {
      mockWishlistState.delete(serviceId);
    } else {
      mockWishlistState.add(serviceId);
    }
    return buildResponse(config, {
      message: exists ? 'Removed from wishlist' : 'Added to wishlist',
      is_favorited: !exists,
    });
  }

  if (method === 'get' && path === '/wishlists/me') {
    const items: WishlistItem[] = Array.from(mockWishlistState).map((serviceId, index) => ({
      id: `wl-${index + 1}`,
      user_id: DEV_ADMIN_BYPASS_USER.id,
      service_id: serviceId,
      created_at: nowIso(),
    }));
    return buildResponse(config, items);
  }

  if (method === 'post' && path === '/bookings') {
    return buildResponse(config, handleBookingCreate(body), 201);
  }

  const bookingDetailMatch = path.match(/^\/bookings\/([^/]+)$/);
  if (bookingDetailMatch && method === 'get') {
    const booking = mockBookingState.find((item) => item.id === bookingDetailMatch[1]);
    return buildResponse(config, booking || null);
  }

  if (method === 'get' && path === '/bookings/users/me/') {
    const status = params?.status;
    const items = status ? mockBookingState.filter((booking) => booking.status === status) : mockBookingState;
    return buildResponse(config, toPaginated(items));
  }

  const cancelBookingMatch = path.match(/^\/bookings\/([^/]+)\/cancel$/);
  if (cancelBookingMatch && method === 'put') {
    const bookingId = cancelBookingMatch[1];
    const index = mockBookingState.findIndex((item) => item.id === bookingId);
    if (index >= 0) {
      mockBookingState[index] = {
        ...mockBookingState[index],
        status: 'cancelled',
        notes: body?.reason || mockBookingState[index].notes,
        updated_at: nowIso(),
      };
    }
    return buildResponse(config, mockBookingState[index]);
  }

  if (method === 'post' && path === '/negotiations') {
    return buildResponse(config, handleNegotiationCreate(body), 201);
  }

  const negotiationDetailMatch = path.match(/^\/negotiations\/([^/]+)$/);
  if (negotiationDetailMatch && method === 'get') {
    const negotiation = mockNegotiationState.find((item) => item.id === negotiationDetailMatch[1]);
    return buildResponse(config, negotiation || null);
  }

  if (method === 'get' && path === '/negotiations/my') {
    const status = params?.status;
    const items = status ? mockNegotiationState.filter((negotiation) => negotiation.status === status) : mockNegotiationState;
    return buildResponse(config, toPaginated(items));
  }

  const acceptNegotiationMatch = path.match(/^\/negotiations\/([^/]+)\/accept$/);
  if (acceptNegotiationMatch && method === 'put') {
    const negotiationId = acceptNegotiationMatch[1];
    const index = mockNegotiationState.findIndex((item) => item.id === negotiationId);
    if (index >= 0) {
      mockNegotiationState[index] = {
        ...mockNegotiationState[index],
        status: 'accepted',
        updated_at: nowIso(),
      };
    }
    return buildResponse(config, mockNegotiationState[index]);
  }

  const rejectNegotiationMatch = path.match(/^\/negotiations\/([^/]+)\/reject$/);
  if (rejectNegotiationMatch && method === 'put') {
    const negotiationId = rejectNegotiationMatch[1];
    const index = mockNegotiationState.findIndex((item) => item.id === negotiationId);
    if (index >= 0) {
      mockNegotiationState[index] = {
        ...mockNegotiationState[index],
        status: 'rejected',
        updated_at: nowIso(),
      };
    }
    return buildResponse(config, mockNegotiationState[index]);
  }

  if (method === 'post' && path === '/payments/initiate') {
    return buildResponse(config, handlePaymentInitiation(body), 201);
  }

  const paymentDetailMatch = path.match(/^\/payments\/([^/]+)$/);
  if (paymentDetailMatch && method === 'get') {
    const payment = mockPaymentState.find((item) => item.id === paymentDetailMatch[1]);
    return buildResponse(config, payment || null);
  }

  if (method === 'get' && path === '/payments') {
    return buildResponse(config, mockPaymentState);
  }

  const paymentRefundMatch = path.match(/^\/payments\/([^/]+)\/refund$/);
  if (paymentRefundMatch && method === 'post') {
    const paymentId = paymentRefundMatch[1];
    const index = mockPaymentState.findIndex((item) => item.id === paymentId);
    if (index >= 0) {
      mockPaymentState[index] = {
        ...mockPaymentState[index],
        status: 'refunded',
        refund_amount: body?.refund_amount || body?.amount,
        refund_reason: body?.refund_reason || body?.reason,
        refunded_at: nowIso(),
        updated_at: nowIso(),
      };
    }
    return buildResponse(config, mockPaymentState[index]);
  }

  return buildResponse(config, { message: `Mock route not implemented: ${method.toUpperCase()} ${path}` }, 501);
}

export function shouldHandleWithAdminBypassMock(): boolean {
  return isAdminBypassSessionActive();
}
