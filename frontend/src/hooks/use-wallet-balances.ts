'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWalletBalancesAllChains, fetchWalletBalancesForChain } from '@/lib/wallet-balances';

export function useWalletBalances(walletAddress?: string | null) {
  return useQuery({
    queryKey: ['wallet-balances', walletAddress],
    queryFn: () => fetchWalletBalancesAllChains(walletAddress!),
    enabled: Boolean(walletAddress),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useWalletBalanceForChain(walletAddress: string | null | undefined, chainId: number) {
  return useQuery({
    queryKey: ['wallet-balance', walletAddress, chainId],
    queryFn: () => fetchWalletBalancesForChain(chainId, walletAddress!),
    enabled: Boolean(walletAddress),
    staleTime: 30_000,
  });
}
