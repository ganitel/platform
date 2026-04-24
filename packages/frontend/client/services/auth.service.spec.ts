/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authService } from './auth.service';
import { apiClient } from '@/lib/axios';
import { AuthResponse, User } from '@shared/api';

vi.mock('@/lib/axios', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock global localStorage for vitest
if (typeof globalThis !== 'undefined' && !globalThis.localStorage) {
  globalThis.localStorage = localStorageMock as any;
}

const mockUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  user_type: 'traveler',
  status: 'active',
  is_verified: true,
  language: 'en',
  currency: 'EUR',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockAuthResponse: AuthResponse = {
  user: mockUser,
  access_token: 'access_token_123',
  refresh_token: 'refresh_token_123',
  expires_in: 3600,
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('should register user and store tokens', async () => {
      const registerData = {
        email: 'user@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+33123456789',
        user_type: 'traveler' as const,
        country: 'France',
        city: 'Paris',
      };

      const mockResponse = { data: mockAuthResponse };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authService.register(registerData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockAuthResponse);
      expect(localStorage.getItem('access_token')).toBe('access_token_123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh_token_123');
    });

    it('should register with default profile fields when optional data is omitted', async () => {
      const registerData = {
        email: 'user@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockAuthResponse });

      await authService.register(registerData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        user_type: 'traveler',
        country: '',
        city: '',
        ...registerData,
      });
    });
  });

  describe('login', () => {
    it('should login user and store tokens', async () => {
      const mockResponse = { data: mockAuthResponse };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authService.login('user@example.com', 'password123');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        identifier: 'user@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockAuthResponse);
      expect(localStorage.getItem('access_token')).toBe('access_token_123');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with explicit refresh token and store returned tokens', async () => {
      const mockResponse = {
        data: { access_token: 'new_access', refresh_token: 'new_refresh' },
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authService.refreshToken('provided_refresh');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh-token', {
        refresh_token: 'provided_refresh',
      });
      expect(result.access_token).toBe('new_access');
      expect(localStorage.getItem('access_token')).toBe('new_access');
      expect(localStorage.getItem('refresh_token')).toBe('new_refresh');
    });

    it('should refresh token without payload when no refresh token is provided', async () => {
      const mockResponse = {
        data: { access_token: 'cookie_access', refresh_token: 'cookie_refresh' },
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      await authService.refreshToken();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh-token', undefined);
    });
  });

  describe('logout', () => {
    it('should logout and clear tokens', async () => {
      localStorage.setItem('access_token', 'token123');
      localStorage.setItem('refresh_token', 'refresh123');

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user', async () => {
      const mockResponse = { data: mockUser };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await authService.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('access_token', 'token123');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token', () => {
      localStorage.setItem('access_token', 'token123');
      expect(authService.getAccessToken()).toBe('token123');
    });

    it('should return null when token does not exist', () => {
      expect(authService.getAccessToken()).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens', () => {
      localStorage.setItem('access_token', 'token123');
      localStorage.setItem('refresh_token', 'refresh123');

      authService.clearTokens();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('should request password reset', async () => {
      const mockResponse = { data: { message: 'Password reset email sent' } };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authService.forgotPassword('user@example.com');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'user@example.com',
      });
      expect(result.message).toBe('Password reset email sent');
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const mockResponse = { data: { message: 'Password reset successful' } };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await authService.resetPassword('reset_token_123', 'newpassword123');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset_token_123',
        new_password: 'newpassword123',
      });
      expect(result.message).toBe('Password reset successful');
    });
  });
});
