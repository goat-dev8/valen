'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

export function PrivyLoginButton() {
  const { login, authenticated, ready, getAccessToken, user } = usePrivy();
  const { setToken } = useAuth();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSession = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    setError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Could not obtain access token');

      await api.auth.sync(accessToken, {
        privyUserId: user.id,
        email: user.email?.address,
      });

      setToken(accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth sync failed');
    } finally {
      setSyncing(false);
    }
  }, [user, getAccessToken, setToken, router]);

  useEffect(() => {
    if (ready && authenticated && user) {
      syncSession();
    }
  }, [ready, authenticated, user, syncSession]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={login}
        disabled={!ready || syncing}
        className="login-btn-primary w-full disabled:opacity-50"
      >
        {syncing ? 'Syncing profile...' : 'Continue with Privy'}
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
