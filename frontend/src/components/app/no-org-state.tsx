'use client';

import { useAuth } from '@/contexts/auth-context';

export function NoOrgState() {
  const { me } = useAuth();

  if (me?.organizations?.length) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">Setting up your workspace…</p>
      <p className="mt-1 text-amber-800">
        No organization is linked yet. Sign out and sign in again, or wait a moment while the API
        provisions your account. If this persists, the Render API may need the latest backend deploy.
      </p>
    </div>
  );
}
