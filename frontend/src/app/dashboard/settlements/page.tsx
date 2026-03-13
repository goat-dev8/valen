'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { SettlementRow } from '@/components/app/settlement-row';
import { StatusBadge } from '@/components/app/status-badge';
import { ChainBadge } from '@/components/app/chain-badge';
import { useExecutions } from '@/hooks/use-valen-api';

export default function SettlementsPage() {
  const { data, isLoading, error } = useExecutions({ limit: 50 });

  const settlementExecutions =
    data?.items.filter((ex) =>
      ['settlement_submitted', 'executed', 'failed', 'validated', 'approved', 'approval_required'].includes(ex.status),
    ) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Settlement Monitor" description="Onchain settlement status across Arbitrum and Robinhood Chain" />

      <QueryState isLoading={isLoading} error={error} isEmpty={!settlementExecutions.length} emptyMessage="No settlements to monitor">
        <div className="space-y-3 md:hidden">
          {settlementExecutions.map((ex) => (
            <Link
              key={ex.id}
              href={`/dashboard/executions/${ex.id}`}
              className="block rounded-2xl border border-[#E8ECF0] bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-[#0066FF]">{ex.id.slice(0, 8)}…</span>
                <StatusBadge status={ex.status} />
              </div>
              <div className="mt-2">
                <ChainBadge chainId={ex.targetChainId} />
              </div>
              <p className="mt-2 text-xs text-[#8B98A5]">{new Date(ex.createdAt).toLocaleString()}</p>
            </Link>
          ))}
        </div>
        <div className="app-card hidden md:block">
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Execution</th>
                  <th>Chain</th>
                  <th>Intent Status</th>
                  <th>Settlement Status</th>
                  <th>Tx Hash</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {settlementExecutions.map((ex) => (
                  <SettlementRow key={ex.id} executionId={ex.id} executionStatus={ex.status} createdAt={ex.createdAt} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </QueryState>
    </div>
  );
}
