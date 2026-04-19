import { apiClient } from '@/lib/axios';
import { User, Paginated, Booking } from '@shared/api';

/**
 * Users API service
 */
export const usersService = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: Partial<Pick<User, 'first_name' | 'last_name' | 'phone' | 'bio' | 'country' | 'city'>>): Promise<User> {
    const response = await apiClient.put('/users/me', data);
    return response.data;
  },

  /**
   * Change user password
   */
  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    await apiClient.post('/users/me/change-password', data);
  },

  /**
   * Get current user's bookings
   */
  async getMyBookings(status?: string): Promise<Paginated<Booking>> {
    const response = await apiClient.get('/users/me/bookings', { params: { status } });
    return response.data;
  },

  /**
   * Upload profile picture
   */
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};