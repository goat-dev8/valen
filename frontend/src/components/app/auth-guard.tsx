'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, loading, me, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/login');
    }
  }, [loading, token, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#007dfc] border-t-transparent" />
          <p className="mt-4 text-sm text-[#64748b]">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
        <p className="text-sm text-[#64748b]">{error ?? 'Redirecting to login...'}</p>
      </div>
    );
  }

  return <>{children}</>;
}
