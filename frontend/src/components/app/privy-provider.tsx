'use client';

import { useEffect, useState } from 'react';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function ValenPrivyProvider({ children }: { children: React.ReactNode }) {
  const [PrivyWrapper, setPrivyWrapper] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!PRIVY_APP_ID) return;

    import('@privy-io/react-auth')
      .then(({ PrivyProvider }) => {
        function Wrapper({ children: inner }: { children: React.ReactNode }) {
          return (
            <PrivyProvider
              appId={PRIVY_APP_ID!}
              config={{
                loginMethods: ['email', 'wallet', 'google'],
                embeddedWallets: {
                  ethereum: { createOnLogin: 'users-without-wallets' },
                },
                appearance: { theme: 'light', accentColor: '#007dfc' },
              }}
            >
              {inner}
            </PrivyProvider>
          );
        }
        setPrivyWrapper(() => Wrapper);
        setLoadError(null);
      })
      .catch((err: Error) => {
        console.error('Privy failed to load', err);
        setLoadError(err.message);
        setPrivyWrapper(null);
      });
  }, []);

  if (PrivyWrapper) {
    return <PrivyWrapper>{children}</PrivyWrapper>;
  }

  if (loadError) {
    return (
      <>
        {children}
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 shadow-lg">
          Privy failed to load. Restart dev server after <code className="font-mono">pnpm install</code>, or use token login on /login.
        </div>
      </>
    );
  }

  return <>{children}</>;
}
