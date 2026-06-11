'use client';

import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { SettlementRow } from '@/components/app/settlement-row';
import { useExecutions } from '@/hooks/use-valen-api';

export default function SettlementsPage() {
  const { data, isLoading, error } = useExecutions({ limit: 50 });

  const settlementExecutions = data?.items.filter((ex) =>
    ['settlement_submitted', 'executed', 'failed', 'validated', 'approved', 'approval_required'].includes(ex.status),
  ) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Settlement Monitor" description="Onchain settlement status across Arbitrum and Robinhood Chain" />

      <QueryState isLoading={isLoading} error={error} isEmpty={!settlementExecutions.length} emptyMessage="No settlements to monitor">
        <div className="app-card">
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
