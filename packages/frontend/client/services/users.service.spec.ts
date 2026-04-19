import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersService } from './users.service';
import { apiClient } from '@/lib/axios';

// Mock the apiClient
vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should call GET /users/me and return user data', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      (apiClient.get as any).mockResolvedValue({ data: mockUser });

      const result = await usersService.getProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should call PUT /users/me with profile data', async () => {
      const updateData = {
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+1234567890',
      };
      const mockUpdatedUser = {
        id: '1',
        email: 'test@example.com',
        ...updateData,
      };

      (apiClient.put as any).mockResolvedValue({ data: mockUpdatedUser });

      const result = await usersService.updateProfile(updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/users/me', updateData);
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('changePassword', () => {
    it('should call POST /users/me/change-password with password data', async () => {
      const passwordData = {
        current_password: 'oldpass',
        new_password: 'newpass',
      };

      (apiClient.post as any).mockResolvedValue({});

      await usersService.changePassword(passwordData);

      expect(apiClient.post).toHaveBeenCalledWith('/users/me/change-password', passwordData);
    });
  });

  describe('getMyBookings', () => {
    it('should call GET /users/me/bookings with optional status', async () => {
      const mockBookings = {
        items: [],
        page: 1,
        per_page: 10,
        total: 0,
        pages: 0,
      };

      (apiClient.get as any).mockResolvedValue({ data: mockBookings });

      const result = await usersService.getMyBookings('confirmed');

      expect(apiClient.get).toHaveBeenCalledWith('/users/me/bookings', { params: { status: 'confirmed' } });
      expect(result).toEqual(mockBookings);
    });

    it('should call GET /users/me/bookings without status', async () => {
      const mockBookings = {
        items: [],
        page: 1,
        per_page: 10,
        total: 0,
        pages: 0,
      };

      (apiClient.get as any).mockResolvedValue({ data: mockBookings });

      const result = await usersService.getMyBookings();

      expect(apiClient.get).toHaveBeenCalledWith('/users/me/bookings', { params: { status: undefined } });
      expect(result).toEqual(mockBookings);
    });
  });

  describe('uploadAvatar', () => {
    it('should call POST /upload/image with form data', async () => {
      const mockFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
      const mockResponse = { url: 'https://example.com/avatar.jpg' };

      (apiClient.post as any).mockResolvedValue({ data: mockResponse });

      const result = await usersService.uploadAvatar(mockFile);

      expect(apiClient.post).toHaveBeenCalledWith('/upload/image', expect.any(FormData), {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});