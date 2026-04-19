import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { bookingsService } from './bookings.service';
import { apiClient } from '@/lib/axios';
import { Booking, BookingRequest } from '@shared/api';

vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockBooking: Booking = {
  id: 'booking-1',
  user_id: 'user-1',
  service_id: 'service-1',
  start_date: '2024-01-01',
  end_date: '2024-01-05',
  guests: 2,
  status: 'confirmed',
  total_amount: 540,
  currency: 'EUR',
  notes: 'Test booking',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('bookingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createBooking', () => {
    it('should create a booking', async () => {
      const bookingRequest: BookingRequest = {
        service_id: 'property-1',
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        guests: 2,
        notes: 'Test booking',
      };

      const mockResponse = { data: mockBooking };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await bookingsService.createBooking(bookingRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/bookings', bookingRequest);
      expect(result).toEqual(mockBooking);
    });
  });

  describe('getBooking', () => {
    it('should get booking details', async () => {
      const mockResponse = { data: mockBooking };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await bookingsService.getBooking('booking-1');

      expect(apiClient.get).toHaveBeenCalledWith('/bookings/booking-1');
      expect(result).toEqual(mockBooking);
    });
  });

  describe('getMyBookings', () => {
    it('should get user bookings', async () => {
      const mockResponse = {
        data: {
          items: [mockBooking],
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await bookingsService.getMyBookings();

      expect(apiClient.get).toHaveBeenCalledWith('/bookings/users/me/', { params: { status: undefined } });
      expect(result.items).toHaveLength(1);
    });

    it('should filter bookings by status', async () => {
      const mockResponse = {
        data: {
          items: [mockBooking],
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await bookingsService.getMyBookings('confirmed');

      expect(apiClient.get).toHaveBeenCalledWith('/bookings/users/me/', { params: { status: 'confirmed' } });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      const cancelledBooking = { ...mockBooking, status: 'cancelled' as const };
      const mockResponse = { data: cancelledBooking };
      vi.mocked(apiClient.put).mockResolvedValueOnce(mockResponse);

      const result = await bookingsService.cancelBooking('booking-1');

      expect(apiClient.put).toHaveBeenCalledWith('/bookings/booking-1/cancel', undefined);
      expect(result.status).toBe('cancelled');
    });

    it('should cancel a booking with reason', async () => {
      const cancelledBooking = { ...mockBooking, status: 'cancelled' as const };
      const mockResponse = { data: cancelledBooking };
      vi.mocked(apiClient.put).mockResolvedValueOnce(mockResponse);

      const result = await bookingsService.cancelBooking('booking-1', 'Plans changed');

      expect(apiClient.put).toHaveBeenCalledWith('/bookings/booking-1/cancel', { reason: 'Plans changed' });
      expect(result.status).toBe('cancelled');
    });
  });
});
