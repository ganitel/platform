/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { paymentsService } from './payments.service';
import { apiClient } from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('paymentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initiatePayment should call /payments/initiate with payload', async () => {
    const payload = {
      booking_id: 'booking-1',
      amount: 540,
      currency: 'XAF',
      provider: 'tranzak',
    } as any;
    const mockResponse = {
      data: {
        transaction_id: 'txn-1',
        payment_url: 'https://pay.example/txn-1',
        status: 'pending',
      },
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse as any);

    const result = await paymentsService.initiatePayment(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/payments/initiate', payload);
    expect(result).toEqual(mockResponse.data);
  });

  it('getPayment should call /payments/:paymentId', async () => {
    const mockResponse = { data: { id: 'pay-1', status: 'succeeded' } };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await paymentsService.getPayment('pay-1');

    expect(apiClient.get).toHaveBeenCalledWith('/payments/pay-1');
    expect(result).toEqual(mockResponse.data);
  });

  it('getPayments should call /payments', async () => {
    const mockResponse = { data: [{ id: 'pay-1' }, { id: 'pay-2' }] };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await paymentsService.getPayments();

    expect(apiClient.get).toHaveBeenCalledWith('/payments');
    expect(result).toEqual(mockResponse.data);
  });

  it('requestRefund should call /payments/:paymentId/refund with payload', async () => {
    const payload = { amount: 100, reason: 'duplicate_charge' } as any;
    const mockResponse = { data: { id: 'pay-1', status: 'refunded' } };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse as any);

    const result = await paymentsService.requestRefund('pay-1', payload);

    expect(apiClient.post).toHaveBeenCalledWith('/payments/pay-1/refund', payload);
    expect(result).toEqual(mockResponse.data);
  });
});
