'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ValenLogo } from '@/components/brand/valen-logo';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { ensureOrganization } from '@/lib/ensure-organization';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function LoginForm() {
  const router = useRouter();
  const { token, setToken, me, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState('');
  const [PrivyLogin, setPrivyLogin] = useState<React.ComponentType | null>(null);
  const [privyLoading, setPrivyLoading] = useState(Boolean(PRIVY_APP_ID));

  useEffect(() => {
    logout();
  }, [logout]);

  useEffect(() => {
    if (token && me) {
      router.replace('/dashboard');
    }
  }, [token, me, router]);

  useEffect(() => {
    if (!PRIVY_APP_ID) {
      setPrivyLoading(false);
      return;
    }

    import('@/components/app/privy-login-button')
      .then((mod) => setPrivyLogin(() => mod.PrivyLoginButton))
      .catch(() => setPrivyLogin(null))
      .finally(() => setPrivyLoading(false));
  }, []);

  const handleDevLogin = useCallback(async () => {
    if (!devToken.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const accessToken = devToken.trim();
      await ensureOrganization(accessToken, await api.auth.me(accessToken));
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
          {PRIVY_APP_ID ? (
            privyLoading ? (
              <div className="flex flex-col items-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#007dfc] border-t-transparent" />
                <p className="mt-3 text-sm text-[#64748b]">Loading Privy…</p>
              </div>
            ) : PrivyLogin ? (
              <PrivyLogin />
            ) : (
              <p className="text-center text-sm text-red-600">
                Privy failed to load. Restart the dev server after <code className="font-mono">pnpm install</code>.
              </p>
            )
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[#64748b]">
                Set <code className="rounded bg-[#f1f5f9] px-1">NEXT_PUBLIC_PRIVY_APP_ID</code> in{' '}
                <code className="font-mono">frontend/.env.local</code>, then restart{' '}
                <code className="font-mono">pnpm run dev</code>.
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
