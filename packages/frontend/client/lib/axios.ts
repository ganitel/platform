import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  handleAdminBypassMockRequest,
  shouldHandleWithAdminBypassMock,
} from '@/services/mockApi';

/**
 * API error with standardized format
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Create and configure axios instance with interceptors
 */

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

export const createAxiosInstance = (): AxiosInstance => {
  // In dev, use relative URL so requests go through Vite proxy (no CORS).
  // In production, use the full VITE_API_BASE_URL.
  // Allow overriding the backend base URL via env var for local development/testing.
  // If VITE_API_BASE_URL is set, it takes precedence (useful to target a local API).
  const baseURL =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
      ? '/api/v1'
      : 'https://staging.ganitel.com/api/v1');

  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request interceptor - add auth token
   */
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (shouldHandleWithAdminBypassMock()) {
        config.adapter = (adapterConfig) => handleAdminBypassMockRequest(adapterConfig);
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  /**
   * Response interceptor - handle errors and token refresh
   */
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 - attempt token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return instance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            throw new Error('Missing refresh token');
          }

          const response = await instance.post('/auth/refresh-token', { refresh_token: refreshToken });
          const { access_token, refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }
          processQueue(null, access_token);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Refresh failed, redirect to sign-in
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/sign-in';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Transform error to standardized format
      const apiError: ApiError = {
        status: error.response?.status || 500,
        message: error.message,
      };

      if (error.response?.data) {
        const data = error.response.data as any;
        apiError.message = data.message || error.message;
        apiError.errors = data.errors;
        apiError.code = data.code;
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// Export singleton instance
export const apiClient = createAxiosInstance();

/**
 * Helper to handle API errors
 */
export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    return {
      status: error.response?.status || 500,
      message: error.message,
      errors: (error.response?.data as any)?.errors,
      code: (error.response?.data as any)?.code,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
    };
  }

  return {
    status: 500,
    message: 'An unknown error occurred',
  };
};
