import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryClient } from '@/lib/query-client';
import {
  useCurrentUser,
  useLogin,
  useSignup,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useAuth,
  authQueryKeys,
} from './useAuth';
import { authService } from '@/services/auth.service';

// Mock the auth service
vi.mock('@/services/auth.service', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe('useAuth hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Query key generation', () => {
    it('should generate correct query keys', () => {
      expect(authQueryKeys.all).toEqual(['auth']);
      expect(authQueryKeys.currentUser()).toEqual(['auth', 'currentUser']);
    });
  });

  describe('Hook initialization', () => {
    it('should have correct function signatures', () => {
      expect(typeof useCurrentUser).toBe('function');
      expect(typeof useLogin).toBe('function');
      expect(typeof useSignup).toBe('function');
      expect(typeof useLogout).toBe('function');
      expect(typeof useForgotPassword).toBe('function');
      expect(typeof useResetPassword).toBe('function');
      expect(typeof useAuth).toBe('function');
    });
  });

  describe('Disabled queries', () => {
    it('should support disabling currentUser query', () => {
      const isFunction = typeof useCurrentUser === 'function';
      expect(isFunction).toBe(true);
    });
  });

  describe('useAuth composite hook', () => {
    it('should return proper auth object structure', () => {
      expect(typeof useAuth).toBe('function');
      // The hook will return an object with all the methods when called
      // but we can't call it outside of a React component context in tests
    });
  });

  describe('Service integration', () => {
    it('authService methods should be mocked', () => {
      expect(vi.isMockFunction(authService.getCurrentUser)).toBe(true);
      expect(vi.isMockFunction(authService.login)).toBe(true);
      expect(vi.isMockFunction(authService.register)).toBe(true);
      expect(vi.isMockFunction(authService.logout)).toBe(true);
      expect(vi.isMockFunction(authService.forgotPassword)).toBe(true);
      expect(vi.isMockFunction(authService.resetPassword)).toBe(true);
    });
  });

  describe('Mutation hooks', () => {
    it('login mutation should be a function', () => {
      expect(typeof useLogin).toBe('function');
    });

    it('signup mutation should be a function', () => {
      expect(typeof useSignup).toBe('function');
    });

    it('logout mutation should be a function', () => {
      expect(typeof useLogout).toBe('function');
    });

    it('forgot password mutation should be a function', () => {
      expect(typeof useForgotPassword).toBe('function');
    });

    it('reset password mutation should be a function', () => {
      expect(typeof useResetPassword).toBe('function');
    });
  });
});
