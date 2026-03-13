'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { StatusBadge } from '@/components/app/status-badge';
import { useAgents, useExecutions, useMandates, useWalletVerifications } from '@/hooks/use-valen-api';
import { chainName } from '@/lib/constants';

export default function ExecutionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data, isLoading, error } = useExecutions({
    status: statusFilter || undefined,
    limit: 50,
  });
  const { data: agents } = useAgents({ limit: 100 });
  const { data: mandates } = useMandates();
  const { data: walletVerifications } = useWalletVerifications();
  const agentMap = new Map(agents?.items.map((a) => [a.id, a.name]) ?? []);
  const hasVerifiedWallet = walletVerifications?.some((wallet) => wallet.status === 'verified') ?? false;
  const readyAgent = agents?.items.find(
    (agent) =>
      agent.status === 'active' &&
      Boolean(agent.defaultPolicyId) &&
      hasVerifiedWallet &&
      mandates?.some((mandate) => mandate.agentId === agent.id && mandate.status === 'active'),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="All agent intents flowing through compliance, risk, rules, and settlement"
      >
        <select
          className="app-input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="approval_required">Approval required</option>
          <option value="executed">Executed</option>
          <option value="compliance_failed">Compliance failed</option>
          <option value="risk_failed">Risk failed</option>
          <option value="settlement_submitted">Settlement submitted</option>
          <option value="failed">Failed</option>
        </select>
        <Link
          href={readyAgent ? `/dashboard/executions/new?agentId=${readyAgent.id}` : '/dashboard/agents'}
          className={readyAgent ? 'app-btn app-btn-primary' : 'app-btn app-btn-outline'}
        >
          <Plus className="h-4 w-4" />
          {readyAgent ? 'Submit Intent' : 'Complete Readiness'}
        </Link>
      </PageHeader>

      <QueryState isLoading={isLoading} error={error} isEmpty={!data?.items.length} emptyMessage="No executions found">
        <div className="app-card">
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Agent</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Chain</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((ex) => (
                  <tr key={ex.id}>
                    <td>
                      <Link href={`/dashboard/executions/${ex.id}`} className="app-link font-mono text-xs">
                        {ex.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="font-medium text-[#012b54]">{agentMap.get(ex.agentId) ?? ex.agentId.slice(0, 8)}</td>
                    <td className="capitalize">{ex.actionType.replace(/_/g, ' ')}</td>
                    <td><StatusBadge status={ex.status} /></td>
                    <td className="text-[#64748b]">{chainName(ex.targetChainId)}</td>
                    <td className="text-sm text-[#64748b]">{new Date(ex.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </QueryState>
    </div>
  );
}
