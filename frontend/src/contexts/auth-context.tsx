'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { TOKEN_STORAGE_KEY } from '@/lib/constants';
import type { MeResponseDto } from '@/types/api';

type AuthContextValue = {
  token: string | null;
  me: MeResponseDto | null;
  loading: boolean;
  error: string | null;
  setToken: (token: string | null) => void;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setToken = useCallback((value: string | null) => {
    setTokenState(value);
    if (value) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, value);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      setMe(null);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setMe(null);
      return;
    }
    const profile = await api.auth.me(token);
    setMe(profile);
    setError(null);
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setMe(null);
    setError(null);
  }, [setToken]);

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) setTokenState(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) {
      setMe(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    if (!me) {
      setLoading(true);
    }

    api.auth
      .me(token)
      .then((profile) => {
        if (!cancelled) {
          setMe(profile);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setMe(null);
          setError(err.message);
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          setTokenState(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({ token, me, loading, error, setToken, refreshMe, logout }),
    [token, me, loading, error, setToken, refreshMe, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
