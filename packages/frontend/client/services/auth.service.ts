import { apiClient } from '@/lib/axios';
import { AuthResponse, User } from '@shared/api';

/**
 * Auth API service
 */
export const authService = {
  /**
   * Register new user
   */
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    user_type?: 'traveler' | 'provider' | 'admin';
    country?: string;
    city?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', {
      user_type: 'traveler',
      country: '',
      city: '',
      ...data,
    });
    const authData = response.data;
    // Store tokens
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('refresh_token', authData.refresh_token);
    return authData;
  },

  /**
   * Login with email/phone and password
   */
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', { identifier, password });
    const authData = response.data;
    // Store tokens
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('refresh_token', authData.refresh_token);
    return authData;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken?: string): Promise<{ access_token: string; refresh_token: string }> {
    // Backend can read refresh_token from HTTP-only cookie or query param
    const response = await apiClient.post('/auth/refresh-token', 
      refreshToken ? { refresh_token: refreshToken } : undefined
    );
    const data = response.data;
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  /**
   * Clear auth tokens
   */
  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
