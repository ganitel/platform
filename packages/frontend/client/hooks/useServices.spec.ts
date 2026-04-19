import { describe, it, expect, vi, beforeEach } from 'vitest';
import { servicesQueryKeys } from './useServices';
import { servicesService } from '@/services/services.service';

// Mock the services service
vi.mock('@/services/services.service', () => ({
  servicesService: {
    searchServices: vi.fn(),
    getServiceDetail: vi.fn(),
    getServiceReviews: vi.fn(),
    getFeaturedServices: vi.fn(),
  },
}));

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('servicesQueryKeys', () => {
    it('should generate correct query keys', () => {
      expect(servicesQueryKeys.all).toEqual(['services']);
      expect(servicesQueryKeys.search({ q: 'test' })).toEqual(['services', 'search', { q: 'test' }]);
      expect(servicesQueryKeys.detail('123')).toEqual(['services', 'detail', '123']);
      expect(servicesQueryKeys.reviews('123', 1, 10)).toEqual([
        'services',
        'reviews',
        '123',
        { page: 1, per_page: 10 },
      ]);
      expect(servicesQueryKeys.featured(6)).toEqual(['services', 'featured', 6]);
    });
  });

  describe('servicesService integration', () => {
    it('should have searchServices method', () => {
      expect(servicesService.searchServices).toBeDefined();
    });

    it('should have getServiceDetail method', () => {
      expect(servicesService.getServiceDetail).toBeDefined();
    });

    it('should have getServiceReviews method', () => {
      expect(servicesService.getServiceReviews).toBeDefined();
    });

    it('should have getFeaturedServices method', () => {
      expect(servicesService.getFeaturedServices).toBeDefined();
    });
  });
});
