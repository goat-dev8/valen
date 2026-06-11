'use client';

import { useEffect, useState } from 'react';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function ValenPrivyProvider({ children }: { children: React.ReactNode }) {
  const [PrivyWrapper, setPrivyWrapper] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);

  useEffect(() => {
    if (!PRIVY_APP_ID) return;

    import('@privy-io/react-auth')
      .then(({ PrivyProvider }) => {
        function Wrapper({ children: inner }: { children: React.ReactNode }) {
          return (
            <PrivyProvider
              appId={PRIVY_APP_ID!}
              config={{
                loginMethods: ['email', 'wallet'],
                appearance: { theme: 'light', accentColor: '#007dfc' },
              }}
            >
              {inner}
            </PrivyProvider>
          );
        }
        setPrivyWrapper(() => Wrapper);
      })
      .catch(() => setPrivyWrapper(null));
  }, []);

  if (PrivyWrapper) {
    return <PrivyWrapper>{children}</PrivyWrapper>;
  }

  return <>{children}</>;
}
