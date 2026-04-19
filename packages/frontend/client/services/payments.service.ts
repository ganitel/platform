import { apiClient } from '@/lib/axios';
import { 
  PaymentInitiateRequest, 
  PaymentInitiateResponse,
  Payment,
  PaymentRefundRequest 
} from '@shared/api';

/**
 * Payments API service (Tranzak flow)
 */
export const paymentsService = {
  /**
   * Initiate a payment for a booking
   */
  async initiatePayment(data: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const response = await apiClient.post('/payments/initiate', data);
    return response.data;
  },

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<Payment> {
    const response = await apiClient.get(`/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Get all user's payments
   */
  async getPayments(): Promise<Payment[]> {
    const response = await apiClient.get('/payments');
    return response.data;
  },

  /**
   * Request a refund (admin only)
   */
  async requestRefund(paymentId: string, data: PaymentRefundRequest): Promise<Payment> {
    const response = await apiClient.post(`/payments/${paymentId}/refund`, data);
    return response.data;
  },
};
