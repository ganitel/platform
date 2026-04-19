import { apiClient } from '@/lib/axios';
import { Negotiation, NegotiationRequest, Paginated } from '@shared/api';

/**
 * Negotiations API service
 */
export const negotiationsService = {
  /**
   * Create a negotiation request
   */
  async createNegotiation(data: NegotiationRequest): Promise<Negotiation> {
    const response = await apiClient.post('/negotiations', data);
    return response.data;
  },

  /**
   * Get negotiation details
   */
  async getNegotiation(negotiationId: string): Promise<Negotiation> {
    const response = await apiClient.get(`/negotiations/${negotiationId}`);
    return response.data;
  },

  /**
   * Get current user's negotiations
   */
  async getMyNegotiations(status?: string): Promise<Paginated<Negotiation>> {
    const response = await apiClient.get('/negotiations/my', { params: { status } });
    return response.data;
  },

  /**
   * Accept a counter-offer
   */
  async acceptNegotiation(negotiationId: string): Promise<Negotiation> {
    const response = await apiClient.put(`/negotiations/${negotiationId}/accept`);
    return response.data;
  },

  /**
   * Reject a counter-offer
   */
  async rejectNegotiation(negotiationId: string): Promise<Negotiation> {
    const response = await apiClient.put(`/negotiations/${negotiationId}/reject`);
    return response.data;
  },
};
