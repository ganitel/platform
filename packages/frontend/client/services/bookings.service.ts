import { apiClient } from '@/lib/axios';
import { Booking, BookingRequest, Paginated } from '@shared/api';

/**
 * Bookings API service
 */
export const bookingsService = {
  /**
   * Create a new booking
   */
  async createBooking(data: BookingRequest): Promise<Booking> {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  /**
   * Get booking details
   */
  async getBooking(bookingId: string): Promise<Booking> {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Get current user's bookings
   */
  async getMyBookings(status?: string): Promise<Paginated<Booking>> {
    const response = await apiClient.get('/bookings/users/me/', { params: { status } });
    return response.data;
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    const response = await apiClient.put(`/bookings/${bookingId}/cancel`, reason ? { reason } : undefined);
    return response.data;
  },
};
