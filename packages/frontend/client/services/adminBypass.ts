import { AuthResponse, User } from '@shared/api';

export const DEV_ADMIN_BYPASS_EMAIL = 'admin@ganitel.com';
const ADMIN_BYPASS_ACTIVE_STORAGE_KEY = 'ganitel_admin_bypass_active';

export const DEV_ADMIN_BYPASS_USER: User = {
  id: 'dev-admin-user',
  email: DEV_ADMIN_BYPASS_EMAIL,
  phone: '+237600000001',
  first_name: 'Admin',
  last_name: 'Ganitel',
  user_type: 'admin',
  status: 'active',
  is_verified: true,
  country: 'Cameroon',
  city: 'Douala',
  language: 'fr',
  currency: 'XAF',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEV_ADMIN_BYPASS_AUTH_RESPONSE: AuthResponse = {
  user: DEV_ADMIN_BYPASS_USER,
  access_token: 'dev_admin_access_token',
  refresh_token: 'dev_admin_refresh_token',
  expires_in: 3600,
};

export function isDevAdminBypassEmail(email: string): boolean {
  return import.meta.env.DEV && email.trim().toLowerCase() === DEV_ADMIN_BYPASS_EMAIL;
}

export function activateAdminBypassSession(): void {
  if (!import.meta.env.DEV) return;
  localStorage.setItem(ADMIN_BYPASS_ACTIVE_STORAGE_KEY, 'true');
}

export function clearAdminBypassSession(): void {
  localStorage.removeItem(ADMIN_BYPASS_ACTIVE_STORAGE_KEY);
}

export function isAdminBypassSessionActive(): boolean {
  if (!import.meta.env.DEV) return false;
  const activeFlag = localStorage.getItem(ADMIN_BYPASS_ACTIVE_STORAGE_KEY) === 'true';
  const accessToken = localStorage.getItem('access_token');
  return activeFlag && !!accessToken;
}
