'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — redirects to Authority Center (R1 migration). */
export default function WalletsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/authority');
  }, [router]);
  return null;
}
