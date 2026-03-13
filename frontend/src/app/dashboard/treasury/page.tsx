'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { operatorFetch } from '@/lib/api';
import { explorerAddressUrl } from '@/lib/explorer';

type TreasuryData = {
  chainId?: number;
  treasuryAddress?: string;
  nativeBalanceEth?: string;
  accruedFeesWei?: string;
  collectedFeesWei?: string;
};

export default function TreasuryPage() {
  const [chainId, setChainId] = useState(421614);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['operator-treasury', chainId],
    queryFn: () => operatorFetch<TreasuryData>(`treasury?chainId=${chainId}`),
    retry: 1,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Treasury" description="Live ValenTreasury contract reads via operator API">
        <select
          value={chainId}
          onChange={(e) => setChainId(Number(e.target.value))}
          className="app-input w-auto"
        >
          <option value={421614}>Arbitrum Sepolia</option>
          <option value={46630}>Robinhood Testnet</option>
        </select>
        <button type="button" className="app-btn app-btn-outline" onClick={() => refetch()}>
          Refresh
        </button>
      </PageHeader>

      <QueryState isLoading={isLoading} error={error} isEmpty={!data}>
        {data && (
          <>
            <div className="flex items-center gap-3">
              <ChainBadge chainId={chainId} />
              {data.treasuryAddress && (
                <a
                  href={explorerAddressUrl(chainId, data.treasuryAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="app-link font-mono text-xs"
                >
                  {data.treasuryAddress.slice(0, 16)}...
                </a>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="app-card">
                <h3 className="app-card-title mb-2">Native Balance</h3>
                <p className="text-2xl font-bold">{data.nativeBalanceEth ?? '—'} ETH</p>
              </div>
              <div className="app-card">
                <h3 className="app-card-title mb-2">Accrued Fees</h3>
                <p className="text-2xl font-bold">{data.accruedFeesWei ?? '—'} wei</p>
              </div>
              <div className="app-card">
                <h3 className="app-card-title mb-2">Collected Fees</h3>
                <p className="text-2xl font-bold">{data.collectedFeesWei ?? '—'} wei</p>
              </div>
            </div>

            <div className="app-card">
              <h3 className="app-card-title mb-3">Raw Treasury Read</h3>
              <pre className="overflow-auto rounded-lg bg-[#f8fafc] p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
