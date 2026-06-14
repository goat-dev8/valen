'use client';

import { useMemo } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useWalletVerifications } from '@/hooks/use-valen-api';

export function useConnectedWalletAddress() {
  const { wallets, ready: walletsReady } = useWallets();
  const { data: verifications } = useWalletVerifications();

  return useMemo(() => {
    const privyAddress = wallets[0]?.address ?? null;
    const verifiedWallets = (verifications ?? []).filter((wallet) => wallet.status === 'verified');
    const verifiedAddress = verifiedWallets[0]?.walletAddress ?? null;
    const address = privyAddress ?? verifiedAddress;

    return {
      address,
      privyAddress,
      verifiedAddress,
      verifiedWallets,
      walletsReady,
      isPrivyConnected: Boolean(privyAddress),
      isVerified: verifiedWallets.length > 0,
    };
  }, [wallets, verifications, walletsReady]);
}
