'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { operatorFetch } from '@/lib/api';

type GovernanceStatus = {
  chainId?: number;
  governanceAddress?: string;
  timelockAddress?: string;
  minDelaySeconds?: number;
  governanceHasProposerRole?: boolean;
  governanceHasExecutorRole?: boolean;
  queuedActionsCount?: number;
};

export default function GovernancePage() {
  const [chainId, setChainId] = useState(421614);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['governance-status', chainId],
    queryFn: () => operatorFetch<GovernanceStatus>(`governance/status?chainId=${chainId}`),
    retry: 1,
  });

  const delayHours = data?.minDelaySeconds ? Math.round(data.minDelaySeconds / 3600) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Governance" description="ValenGovernance + ValenTimelock on live testnet contracts">
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
              <span className="text-sm text-[#64748b]">On-chain governance read via Render operator API</span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="app-card">
                <h3 className="app-card-title mb-3">Timelock</h3>
                <dl className="app-detail-list">
                  <div><dt>Min Delay</dt><dd>{delayHours != null ? `${delayHours}h (${data.minDelaySeconds}s)` : '—'}</dd></div>
                  <div><dt>Timelock</dt><dd className="font-mono text-xs break-all">{data.timelockAddress ?? '—'}</dd></div>
                  <div><dt>Governance</dt><dd className="font-mono text-xs break-all">{data.governanceAddress ?? '—'}</dd></div>
                </dl>
              </div>

              <div className="app-card">
                <h3 className="app-card-title mb-3">Roles</h3>
                <dl className="app-detail-list">
                  <div>
                    <dt>Proposer on Timelock</dt>
                    <dd>
                      <span className={`app-badge ${data.governanceHasProposerRole ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {data.governanceHasProposerRole ? 'Granted' : 'Missing'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Executor on Timelock</dt>
                    <dd>
                      <span className={`app-badge ${data.governanceHasExecutorRole ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {data.governanceHasExecutorRole ? 'Granted' : 'Missing'}
                      </span>
                    </dd>
                  </div>
                  <div><dt>Queued Actions</dt><dd>{data.queuedActionsCount ?? 0}</dd></div>
                </dl>
              </div>
            </div>

            <div className="app-card">
              <h3 className="app-card-title mb-3">Raw Contract State</h3>
              <pre className="overflow-auto rounded-lg bg-[#f8fafc] p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
