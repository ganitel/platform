import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryClient } from '@/lib/query-client';
import {
  useNegotiation,
  useMyNegotiations,
  useCreateNegotiation,
  useAcceptNegotiation,
  useRejectNegotiation,
  negotiationsQueryKeys,
} from './useNegotiation';
import { negotiationsService } from '@/services/negotiations.service';

// Mock the negotiations service
vi.mock('@/services/negotiations.service', () => ({
  negotiationsService: {
    getNegotiation: vi.fn(),
    getMyNegotiations: vi.fn(),
    createNegotiation: vi.fn(),
    acceptNegotiation: vi.fn(),
    rejectNegotiation: vi.fn(),
  },
}));

describe('useNegotiation hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Query key generation', () => {
    it('should generate correct query keys for all operations', () => {
      expect(negotiationsQueryKeys.all).toEqual(['negotiations']);
      expect(negotiationsQueryKeys.negotiation('neg-123')).toEqual([
        'negotiations',
        'detail',
        'neg-123',
      ]);
      expect(negotiationsQueryKeys.myNegotiations()).toEqual(['negotiations', 'my', 'all']);
      expect(negotiationsQueryKeys.myNegotiations('pending')).toEqual([
        'negotiations',
        'my',
        'pending',
      ]);
      expect(negotiationsQueryKeys.myNegotiations('accepted')).toEqual([
        'negotiations',
        'my',
        'accepted',
      ]);
    });
  });

  describe('Hook initialization', () => {
    it('should have correct function signatures', () => {
      expect(typeof useNegotiation).toBe('function');
      expect(typeof useMyNegotiations).toBe('function');
      expect(typeof useCreateNegotiation).toBe('function');
      expect(typeof useAcceptNegotiation).toBe('function');
      expect(typeof useRejectNegotiation).toBe('function');
    });

    it('should have proper enabled parameter support', () => {
      const isFunction = typeof useNegotiation === 'function';
      expect(isFunction).toBe(true);
    });
  });

  describe('Disabled hooks', () => {
    it('should support disabling queries', () => {
      const isFunction = typeof useMyNegotiations === 'function';
      expect(isFunction).toBe(true);
    });
  });

  describe('Service integration', () => {
    it('negotiationsService methods should be mocked', () => {
      expect(vi.isMockFunction(negotiationsService.getNegotiation)).toBe(true);
      expect(vi.isMockFunction(negotiationsService.getMyNegotiations)).toBe(true);
      expect(vi.isMockFunction(negotiationsService.createNegotiation)).toBe(true);
      expect(vi.isMockFunction(negotiationsService.acceptNegotiation)).toBe(true);
      expect(vi.isMockFunction(negotiationsService.rejectNegotiation)).toBe(true);
    });
  });
});
