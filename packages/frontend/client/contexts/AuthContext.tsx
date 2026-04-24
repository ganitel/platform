import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@shared/api';
import { authAdapter } from '@/services/auth.adapter';
import { queryClient } from '@/lib/query-client';

interface AuthContextState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  /** Send OTP to email */
  sendOtp: (email: string) => Promise<void>;
  /** Verify OTP and sign in */
  verifyOtp: (email: string, token: string) => Promise<void>;
  /** Redirect to Google OAuth */
  signInWithGoogle: () => Promise<void>;
  /** Handle Google OAuth callback */
  handleGoogleCallback: (code: string) => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Register new user */
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    user_type?: 'traveler' | 'provider' | 'admin';
    country?: string;
    city?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check session on mount
  useEffect(() => {
    let cancelled = false;
    authAdapter.getSession().then((u) => {
      if (!cancelled) {
        setUser(u);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    setError(null);
    await authAdapter.sendOtp(email);
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    setError(null);
    try {
      const authData = await authAdapter.verifyOtp(email, token);
      setUser(authData.user);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Erreur de vérification';
      setError(message);
      throw err;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    await authAdapter.signInWithGoogle();
  }, []);

  const handleGoogleCallback = useCallback(async (code: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const authData = await authAdapter.handleGoogleCallback(code);
      setUser(authData.user);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Erreur Google OAuth';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await authAdapter.signOut();
    } finally {
      setUser(null);
      queryClient.clear();
    }
  }, []);

  const register = useCallback(async (data: Parameters<AuthContextState['register']>[0]) => {
    setError(null);
    try {
      const authData = await authAdapter.register(data);
      setUser(authData.user);
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || "Erreur d'inscription";
      setError(message);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        sendOtp,
        verifyOtp,
        signInWithGoogle,
        handleGoogleCallback,
        signOut,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
