/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { servicesService } from './services.service';
import { apiClient } from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('servicesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchServices should call /services/search with filters', async () => {
    const filters = { destination: 'Paris', page: 2 } as any;
    const mockResponse = { data: { items: [{ id: 'svc-1' }], page: 2, total: 1 } };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await servicesService.searchServices(filters);

    expect(apiClient.get).toHaveBeenCalledWith('/services/search', { params: filters });
    expect(result).toEqual(mockResponse.data);
  });

  it('getServices should call /services with optional filters', async () => {
    const filters = { city: 'Lyon', skip: 0, limit: 20 };
    const mockResponse = { data: { items: [{ id: 'svc-2' }], page: 1, total: 1 } };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await servicesService.getServices(filters);

    expect(apiClient.get).toHaveBeenCalledWith('/services/', {
      params: {
        service_type: undefined,
        country: undefined,
        city: 'Lyon',
        skip: 0,
        limit: 20,
      },
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('getServices should clamp skip and limit to backend constraints', async () => {
    const mockResponse = { data: { items: [], page: 1, total: 0 } };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    await servicesService.getServices({ skip: -5, limit: 500 });

    expect(apiClient.get).toHaveBeenCalledWith('/services/', {
      params: {
        service_type: undefined,
        country: undefined,
        city: undefined,
        skip: 0,
        limit: 100,
      },
    });
  });

  it('getServices should normalize backend `services` list shape to paginated `items`', async () => {
    const mockResponse = {
      data: {
        services: [{ id: 'svc-a' }, { id: 'svc-b' }],
        total: 2,
        page: 1,
        per_page: 20,
        pages: 1,
      },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await servicesService.getServices({ skip: 0, limit: 20 });

    expect(result).toEqual({
      items: [{ id: 'svc-a' }, { id: 'svc-b' }],
      total: 2,
      page: 1,
      per_page: 20,
      pages: 1,
    });
  });

  it('getServiceDetail should call /services/:id', async () => {
    const serviceId = 'svc-123';
    const mockResponse = { data: { id: serviceId, title: 'City Tour' } };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await servicesService.getServiceDetail(serviceId);

    expect(apiClient.get).toHaveBeenCalledWith('/services/svc-123');
    expect(result).toEqual(mockResponse.data);
  });

  it('getFeaturedServices should map limit to per_page param', async () => {
    const mockResponse = { data: [{ id: 'svc-1' }, { id: 'svc-2' }] };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await servicesService.getFeaturedServices(2);

    expect(apiClient.get).toHaveBeenCalledWith('/services/featured', {
      params: { per_page: 2 },
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('getFeaturedServices should omit params when limit is undefined', async () => {
    const mockResponse = { data: [{ id: 'svc-1' }] };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    await servicesService.getFeaturedServices();

    expect(apiClient.get).toHaveBeenCalledWith('/services/featured', { params: undefined });
  });

  it('createService should post payload to /services', async () => {
    const payload = {
      title: 'Lake House',
      description: 'Nice stay',
      service_type: 'accommodation' as const,
      country: 'France',
      city: 'Annecy',
      address: '1 rue du Lac',
      base_price: 120,
      currency: 'EUR',
      price_per: 'night',
    };
    const mockResponse = { data: { id: 'svc-created', ...payload } };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse as any);

    const result = await servicesService.createService(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/services', payload);
    expect(result).toEqual(mockResponse.data);
  });

  it('updateService should put partial payload to /services/:id', async () => {
    const serviceId = 'svc-123';
    const payload = { title: 'Updated title', base_price: 150 };
    const mockResponse = { data: { id: serviceId, ...payload } };

    vi.mocked(apiClient.put).mockResolvedValueOnce(mockResponse as any);

    const result = await servicesService.updateService(serviceId, payload);

    expect(apiClient.put).toHaveBeenCalledWith('/services/svc-123', payload);
    expect(result).toEqual(mockResponse.data);
  });

  it('deleteService should call DELETE /services/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({} as any);

    await servicesService.deleteService('svc-999');

    expect(apiClient.delete).toHaveBeenCalledWith('/services/svc-999');
  });

  it('getMyServices should call provider endpoint', async () => {
    const mockResponse = { data: [{ id: 'svc-1' }] };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await servicesService.getMyServices();

    expect(apiClient.get).toHaveBeenCalledWith('/services/provider/my-services');
    expect(result).toEqual(mockResponse.data);
  });

  it('getServiceReviews should call reviews endpoint with pagination params', async () => {
    const mockResponse = { data: { items: [{ id: 'rev-1' }], page: 1, total: 1 } };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await servicesService.getServiceReviews('svc-1', 1, 20);

    expect(apiClient.get).toHaveBeenCalledWith('/reviews/services/svc-1', {
      params: { page: 1, per_page: 20 },
    });
    expect(result).toEqual(mockResponse.data);
  });
});
