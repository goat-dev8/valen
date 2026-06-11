'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ValenLogo } from '@/components/brand/valen-logo';
import { useAuth } from '@/contexts/auth-context';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function LoginForm() {
  const router = useRouter();
  const { token, me } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [PrivyLogin, setPrivyLogin] = useState<React.ComponentType | null>(null);
  const [privyLoading, setPrivyLoading] = useState(Boolean(PRIVY_APP_ID));

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
              <p className="text-center text-sm text-red-600">
                Set <code className="rounded bg-[#f1f5f9] px-1">NEXT_PUBLIC_PRIVY_APP_ID</code> in{' '}
                <code className="font-mono">frontend/.env.local</code>, then restart{' '}
                <code className="font-mono">pnpm run dev</code>. Production login requires Privy.
              </p>
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
