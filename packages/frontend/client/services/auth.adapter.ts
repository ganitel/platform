import { apiClient } from '@/lib/axios';
import axios from 'axios';
import { AuthResponse, User } from '@shared/api';
import {
  activateAdminBypassSession,
  clearAdminBypassSession,
  DEV_ADMIN_BYPASS_AUTH_RESPONSE,
  DEV_ADMIN_BYPASS_USER,
  isAdminBypassSessionActive,
  isDevAdminBypassEmail as isDevAdminBypassEmailShared,
} from '@/services/adminBypass';

// ==================== AUTH ADAPTER INTERFACE ====================

export interface AuthAdapter {
  /** Send OTP to email */
  sendOtp(email: string): Promise<void>;
  /** Verify OTP and sign in */
  verifyOtp(email: string, token: string): Promise<AuthResponse>;
  /** Initiate Google OAuth — redirects to Google consent screen */
  signInWithGoogle(): Promise<void>;
  /** Handle Google OAuth callback and return auth tokens */
  handleGoogleCallback(code: string): Promise<AuthResponse>;
  /** Sign out the current user */
  signOut(): Promise<void>;
  /** Fetch the current authenticated user session */
  getSession(): Promise<User | null>;
  /** Refresh the access token */
  refreshToken(): Promise<AuthResponse>;
  /** Register a new user with profile info */
  register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    user_type?: 'traveler' | 'provider' | 'admin';
    country?: string;
    city?: string;
  }): Promise<AuthResponse>;
}

// ==================== TOKEN HELPERS ====================

function storeTokens(authData: AuthResponse): void {
  localStorage.setItem('access_token', authData.access_token);
  localStorage.setItem('refresh_token', authData.refresh_token);
}

function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ==================== LOCAL OTP CLIENT ====================
// OTP stub runs on the local Express server (not on staging backend).
// When the backend implements real OTP endpoints, replace these calls with apiClient.
const otpClient = axios.create({
  baseURL: '/api/otp',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== BACKEND AUTH ADAPTER ====================

export const backendAuthAdapter: AuthAdapter = {
  async sendOtp(email: string): Promise<void> {
    if (isDevAdminBypassEmailShared(email)) {
      return;
    }
    await otpClient.post('/send', { email });
  },

  async verifyOtp(email: string, token: string): Promise<AuthResponse> {
    if (isDevAdminBypassEmailShared(email)) {
      storeTokens(DEV_ADMIN_BYPASS_AUTH_RESPONSE);
      activateAdminBypassSession();
      return DEV_ADMIN_BYPASS_AUTH_RESPONSE;
    }
    // Hits local Express stub: POST /api/otp/verify
    // TODO: When backend implements OTP, switch to: apiClient.post('/auth/verify-otp', { email, token })
    await otpClient.post('/verify', { email, token });
    // OTP stub only verifies — we still need to log in via the real backend
    // TEMPORARY: Use the real password instead of OTP for testing
    const realPassword = email === 'test@example.com' ? 'password123' : token;
    const response = await apiClient.post('/auth/login', {
      identifier: email,
      password: realPassword,
    });
    const authData: AuthResponse = response.data;
    storeTokens(authData);
    return authData;
  },

  async signInWithGoogle(): Promise<void> {
    const response = await apiClient.get('/auth/oauth/google/url');
    const { url } = response.data;
    window.location.href = url;
  },

  async handleGoogleCallback(code: string): Promise<AuthResponse> {
    const response = await apiClient.get('/auth/oauth/google/callback', {
      params: { code },
    });
    const authData: AuthResponse = response.data;
    storeTokens(authData);
    return authData;
  },

  async signOut(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearTokens();
      clearAdminBypassSession();
    }
  },

  async getSession(): Promise<User | null> {
    if (isAdminBypassSessionActive()) {
      return DEV_ADMIN_BYPASS_USER;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch {
      return null;
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    if (isAdminBypassSessionActive()) {
      storeTokens(DEV_ADMIN_BYPASS_AUTH_RESPONSE);
      return DEV_ADMIN_BYPASS_AUTH_RESPONSE;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    const response = await apiClient.post('/auth/refresh-token',
      refreshToken ? { refresh_token: refreshToken } : undefined
    );
    const authData: AuthResponse = response.data;
    storeTokens(authData);
    return authData;
  },

  async register(data): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', {
      user_type: 'traveler',
      country: '',
      city: '',
      ...data,
    });
    const authData: AuthResponse = response.data;
    storeTokens(authData);
    return authData;
  },
};

// ==================== MOCK AUTH ADAPTER ====================

const MOCK_USER: User = {
  id: 'mock-user-1',
  email: 'demo@ganitel.com',
  phone: '+237600000000',
  first_name: 'Demo',
  last_name: 'User',
  user_type: 'traveler',
  status: 'active',
  is_verified: true,
  country: 'Cameroon',
  city: 'Douala',
  language: 'fr',
  currency: 'XAF',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_AUTH_RESPONSE: AuthResponse = {
  user: MOCK_USER,
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  expires_in: 3600,
};

const MOCK_OTP = '123456';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockAuthAdapter: AuthAdapter = {
  async sendOtp(_email: string): Promise<void> {
    await delay(800);
    // In mock mode, any email works. OTP is always MOCK_OTP.
  },

  async verifyOtp(_email: string, token: string): Promise<AuthResponse> {
    await delay(600);
    if (token !== MOCK_OTP) {
      throw { status: 401, message: 'Code incorrect. Veuillez réessayer.' };
    }
    storeTokens(MOCK_AUTH_RESPONSE);
    return MOCK_AUTH_RESPONSE;
  },

  async signInWithGoogle(): Promise<void> {
    await delay(500);
    // Mock: simulate immediate callback
    storeTokens(MOCK_AUTH_RESPONSE);
    window.location.href = '/auth/callback?mock=true';
  },

  async handleGoogleCallback(_code: string): Promise<AuthResponse> {
    await delay(400);
    storeTokens(MOCK_AUTH_RESPONSE);
    return MOCK_AUTH_RESPONSE;
  },

  async signOut(): Promise<void> {
    await delay(300);
    clearTokens();
    clearAdminBypassSession();
  },

  async getSession(): Promise<User | null> {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    await delay(200);
    return MOCK_USER;
  },

  async refreshToken(): Promise<AuthResponse> {
    await delay(300);
    storeTokens(MOCK_AUTH_RESPONSE);
    return MOCK_AUTH_RESPONSE;
  },

  async register(data): Promise<AuthResponse> {
    await delay(700);
    const response: AuthResponse = {
      ...MOCK_AUTH_RESPONSE,
      user: {
        ...MOCK_USER,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      },
    };
    storeTokens(response);
    return response;
  },
};

// ==================== ADAPTER FACTORY ====================

export function getAuthAdapter(): AuthAdapter {
  if (import.meta.env.VITE_AUTH_MOCK === 'true') {
    return mockAuthAdapter;
  }
  return backendAuthAdapter;
}

export const authAdapter = getAuthAdapter();
