import { vi } from 'vitest';
import { AxiosError } from 'axios';

/**
 * Mock axios for testing
 */
export const createMockAxios = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  },
});

/**
 * Create mock axios error
 */
export const createMockAxiosError = (
  status: number = 400,
  message: string = 'Bad Request'
): AxiosError => {
  return {
    config: { headers: {} },
    code: `${status}`,
    message,
    name: 'AxiosError',
    response: {
      status,
      statusText: message,
      headers: {},
      config: { headers: {} },
      data: { message },
    },
    isAxiosError: true,
    toJSON: () => ({}),
  } as AxiosError;
};
