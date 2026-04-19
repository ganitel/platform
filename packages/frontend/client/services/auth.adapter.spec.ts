import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/axios';

const otpPost = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: otpPost,
    })),
  },
}));

vi.mock('@/lib/axios', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { backendAuthAdapter } from './auth.adapter';

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof globalThis !== 'undefined' && !globalThis.localStorage) {
  globalThis.localStorage = localStorageMock as Storage;
}

describe('backendAuthAdapter admin bypass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips otp send call for admin@ganitel.com in dev', async () => {
    await backendAuthAdapter.sendOtp('admin@ganitel.com');

    expect(otpPost).not.toHaveBeenCalled();
  });

  it('returns local admin session and skips backend calls for admin@ganitel.com', async () => {
    const result = await backendAuthAdapter.verifyOtp('ADMIN@GANITEL.COM', 'does-not-matter');

    expect(result.user.email).toBe('admin@ganitel.com');
    expect(result.user.user_type).toBe('admin');
    expect(otpPost).not.toHaveBeenCalled();
    expect(apiClient.post).not.toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBe('dev_admin_access_token');
    expect(localStorage.getItem('refresh_token')).toBe('dev_admin_refresh_token');
  });

  it('keeps normal backend flow for non-admin email', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        user: {
          id: 'u-1',
          email: 'user@example.com',
          first_name: 'User',
          last_name: 'Example',
          user_type: 'traveler',
          status: 'active',
          is_verified: true,
          language: 'fr',
          currency: 'XAF',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
        access_token: 'backend_access_token',
        refresh_token: 'backend_refresh_token',
        expires_in: 3600,
      },
    });

    await backendAuthAdapter.verifyOtp('user@example.com', '123456');

    expect(otpPost).toHaveBeenCalledWith('/verify', {
      email: 'user@example.com',
      token: '123456',
    });
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      identifier: 'user@example.com',
      password: '123456',
    });
    expect(localStorage.getItem('access_token')).toBe('backend_access_token');
  });
});
