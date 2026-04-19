import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { negotiationsService } from './negotiations.service';
import { apiClient } from '@/lib/axios';
import { Negotiation } from '@shared/api';

vi.mock('@/lib/axios', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockNegotiation: Negotiation = {
  id: 'neg-1',
  service_id: 'prop-1',
  user_id: 'user-1',
  provider_id: 'provider-1',
  original_price: 400,
  proposed_price: 350,
  currency: 'EUR',
  status: 'pending',
  message: 'Can you reduce the price?',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  expires_at: '2024-01-08T00:00:00Z',
};

describe('negotiationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createNegotiation', () => {
    it('should create a negotiation', async () => {
      const mockRequest = {
        service_id: 'prop-1',
        original_price: 400,
        proposed_price: 350,
        currency: 'EUR',
        message: 'Can you reduce the price?',
      };

      const mockResponse = { data: mockNegotiation };
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await negotiationsService.createNegotiation(mockRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/negotiations', mockRequest);
      expect(result).toEqual(mockNegotiation);
    });
  });

  describe('getNegotiation', () => {
    it('should get negotiation details', async () => {
      const mockResponse = { data: mockNegotiation };
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await negotiationsService.getNegotiation('neg-1');

      expect(apiClient.get).toHaveBeenCalledWith('/negotiations/neg-1');
      expect(result).toEqual(mockNegotiation);
    });
  });

  describe('getMyNegotiations', () => {
    it('should get user negotiations', async () => {
      const mockResponse = {
        data: {
          items: [mockNegotiation],
          page: 1,
          limit: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await negotiationsService.getMyNegotiations();

      expect(apiClient.get).toHaveBeenCalledWith('/negotiations/my', { params: { status: undefined } });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('acceptNegotiation', () => {
    it('should accept a negotiation', async () => {
      const acceptedNeg = { ...mockNegotiation, status: 'accepted' as const };
      const mockResponse = { data: acceptedNeg };
      vi.mocked(apiClient.put).mockResolvedValueOnce(mockResponse);

      const result = await negotiationsService.acceptNegotiation('neg-1');

      expect(apiClient.put).toHaveBeenCalledWith('/negotiations/neg-1/accept');
      expect(result.status).toBe('accepted');
    });
  });

  describe('rejectNegotiation', () => {
    it('should reject a negotiation', async () => {
      const rejectedNeg = { ...mockNegotiation, status: 'rejected' as const };
      const mockResponse = { data: rejectedNeg };
      vi.mocked(apiClient.put).mockResolvedValueOnce(mockResponse);

      const result = await negotiationsService.rejectNegotiation('neg-1');

      expect(apiClient.put).toHaveBeenCalledWith('/negotiations/neg-1/reject');
      expect(result.status).toBe('rejected');
    });
  });
});
