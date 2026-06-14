'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { OrgProvider } from '@/contexts/org-context';
import { queryGcTimeMs, queryStaleTimeMs } from '@/lib/query-config';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: queryStaleTimeMs,
            gcTime: queryGcTimeMs,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrgProvider>{children}</OrgProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
