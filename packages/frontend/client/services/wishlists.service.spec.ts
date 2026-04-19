import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { wishlistsService } from './wishlists.service';
import { apiClient } from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('wishlistsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('toggleService should call toggle endpoint and return state', async () => {
    const mockResponse = {
      data: {
        message: 'Added to wishlist',
        is_favorited: true,
      },
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse as any);

    const result = await wishlistsService.toggleService('svc-1');

    expect(apiClient.post).toHaveBeenCalledWith('/wishlists/services/svc-1/toggle');
    expect(result).toEqual(mockResponse.data);
  });

  it('getMyWishlist should call /wishlists/me', async () => {
    const mockResponse = {
      data: [{ id: 'wl-1', service_id: 'svc-1' }],
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as any);

    const result = await wishlistsService.getMyWishlist();

    expect(apiClient.get).toHaveBeenCalledWith('/wishlists/me');
    expect(result).toEqual(mockResponse.data);
  });
});
