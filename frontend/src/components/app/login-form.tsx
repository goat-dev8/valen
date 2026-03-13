'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ValenLogo } from '@/components/brand/valen-logo';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function LoginForm() {
  const router = useRouter();
  const { token, setToken, me } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState('');
  const [PrivyLogin, setPrivyLogin] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (token && me) {
      router.replace('/dashboard');
    }
  }, [token, me, router]);

  useEffect(() => {
    if (!PRIVY_APP_ID) return;

    import('@/components/app/privy-login-button')
      .then((mod) => setPrivyLogin(() => mod.PrivyLoginButton))
      .catch(() => setPrivyLogin(null));
  }, []);

  const handleDevLogin = useCallback(async () => {
    if (!devToken.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const accessToken = devToken.trim();
      await api.auth.me(accessToken);
      setToken(accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid access token');
    } finally {
      setLoading(false);
    }
  }, [devToken, setToken, router]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="flex flex-col items-center text-center">
          <ValenLogo size="hero" showWordmark={false} />
          <h1 className="mt-4 text-2xl font-semibold text-[#012b54]">Welcome to VALEN</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Sign in to manage compliance, risk, and agent permissions
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {PRIVY_APP_ID && PrivyLogin ? (
            <PrivyLogin />
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[#64748b]">
                Set <code className="rounded bg-[#f1f5f9] px-1">NEXT_PUBLIC_PRIVY_APP_ID</code> for Privy login,
                or paste a valid Privy access token below.
              </p>
              <textarea
                value={devToken}
                onChange={(e) => setDevToken(e.target.value)}
                placeholder="Paste Privy access token (Bearer)"
                className="app-input min-h-[80px] font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={loading || !devToken.trim()}
                className="login-btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Continue with Token'}
              </button>
            </div>
          )}

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </div>

      </div>

      <Link href="/" className="login-back">
        ← Back to landing page
      </Link>
    </div>
  );
}
