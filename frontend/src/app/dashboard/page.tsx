'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bot, CheckCircle, FileText, Landmark, ScrollText, Shield, TrendingUp, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { StatCard } from '@/components/app/stat-card';
import { QueryState } from '@/components/app/query-state';
import { StatusBadge } from '@/components/app/status-badge';
import { useOrganization } from '@/contexts/org-context';
import { useAgents, useAuditLogs, useExecutions, usePolicies } from '@/hooks/use-valen-api';
import { operatorFetch } from '@/lib/api';
import { chainName } from '@/lib/constants';

type TreasuryData = {
  nativeBalanceEth?: string;
};

type GovernanceStatus = {
  queuedActionsCount?: number;
};

export default function DashboardPage() {
  const { organization } = useOrganization();
  const chainId = organization?.defaultChainId ?? 421614;
  const { data: totalAgents } = useAgents({ limit: 1 });
  const { data: activeAgents, isLoading: agentsLoading } = useAgents({ status: 'active', limit: 1 });
  const { data: executions, isLoading: execLoading, error } = useExecutions({ limit: 10 });
  const { data: approvals } = useExecutions({ status: 'approval_required', limit: 1 });
  const { data: allExec } = useExecutions({ limit: 100 });
  const { data: auditLogs } = useAuditLogs({ limit: 100 });
  const { data: policies } = usePolicies();
  const treasuryQuery = useQuery({
    queryKey: ['operator-treasury-overview', chainId],
    queryFn: () => operatorFetch<TreasuryData>(`treasury?chainId=${chainId}`),
  });
  const governanceQuery = useQuery({
    queryKey: ['operator-governance-overview', chainId],
    queryFn: () => operatorFetch<GovernanceStatus>(`governance/status?chainId=${chainId}`),
  });

  const total = allExec?.total ?? 0;
  const executed = allExec?.items.filter((e) => e.status === 'executed').length ?? 0;
  const failed = allExec?.items.filter((e) => e.status.includes('failed') || e.status === 'cancelled').length ?? 0;
  const passRate = total > 0 ? Math.round((executed / total) * 1000) / 10 : 0;
  const auditEventCount = auditLogs?.total ?? 0;
  const complianceAuditCount =
    auditLogs?.items.filter((log) => log.action.includes('compliance') || log.action === 'execution.attested').length ??
    0;
  const settlementAuditCount =
    auditLogs?.items.filter((log) => log.action.startsWith('settlement.')).length ?? 0;

  const statusCounts = allExec?.items.reduce<Record<string, number>>((acc, ex) => {
    acc[ex.status] = (acc[ex.status] ?? 0) + 1;
    return acc;
  }, {}) ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Risk Overview"
        description="Monitor agent intents, compliance throughput, and settlement pipeline"
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Agents"
          value={totalAgents?.total ?? 0}
          change="Render agents endpoint"
          changeType="neutral"
          icon={Bot}
        />
        <StatCard
          title="Active Agents"
          value={activeAgents?.total ?? 0}
          change={`${activeAgents?.total ?? 0} active`}
          changeType="neutral"
          icon={Bot}
        />
        <StatCard
          title="Total Executions"
          value={total}
          change={`${executed} executed`}
          changeType="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Successful Settlements"
          value={executed}
          change={`${passRate}% execution success rate`}
          changeType="up"
          icon={Shield}
        />
        <StatCard
          title="Failed Settlements"
          value={failed}
          change={failed ? 'Review failed executions' : 'No failures in latest page'}
          changeType={failed ? 'down' : 'up'}
          icon={XCircle}
        />
        <StatCard
          title="Pending Approvals"
          value={approvals?.total ?? 0}
          change={approvals?.total ? 'Requires action' : 'All clear'}
          changeType={approvals?.total ? 'down' : 'up'}
          icon={CheckCircle}
        />
        <StatCard
          title="Treasury Balance"
          value={treasuryQuery.data ? `${treasuryQuery.data.nativeBalanceEth ?? '0'} ETH` : 'Loading'}
          change={treasuryQuery.isError ? 'Render treasury read failed' : chainName(chainId)}
          changeType={treasuryQuery.isError ? 'down' : 'neutral'}
          icon={Landmark}
        />
        <StatCard
          title="Governance Proposals"
          value={governanceQuery.data?.queuedActionsCount ?? 0}
          change={governanceQuery.isError ? 'Render governance read failed' : 'Queued actions'}
          changeType={governanceQuery.isError ? 'down' : 'neutral'}
          icon={FileText}
        />
        <StatCard
          title="Compliance Checks"
          value={complianceAuditCount}
          change="From audit events exposed by Render"
          changeType="neutral"
          icon={Shield}
        />
        <StatCard
          title="Risk Evaluations"
          value="Not exposed"
          change="No aggregate Render endpoint yet"
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatCard
          title="Audit Events"
          value={auditEventCount}
          change={`${settlementAuditCount} settlement events`}
          changeType="neutral"
          icon={ScrollText}
        />
        <StatCard
          title="Policies"
          value={policies?.length ?? 0}
          change="Live policies endpoint"
          changeType="neutral"
          icon={FileText}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="app-card lg:col-span-1">
          <h3 className="app-card-title mb-4">Status Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-sm font-semibold text-[#012b54]">{count}</span>
              </div>
            ))}
            {!Object.keys(statusCounts).length && (
              <p className="text-sm text-[#64748b]">No execution data yet</p>
            )}
          </div>
        </div>

        <div className="app-card lg:col-span-2">
          <div className="app-card-header">
            <h3 className="app-card-title">Recent Executions</h3>
            <Link href="/dashboard/executions" className="app-link">View all</Link>
          </div>
          <QueryState isLoading={execLoading || agentsLoading} error={error} isEmpty={!executions?.items.length} emptyMessage="No executions yet">
            <div className="app-table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Chain</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {executions?.items.map((ex) => (
                    <tr key={ex.id}>
                      <td>
                        <Link href={`/dashboard/executions/${ex.id}`} className="app-link font-mono text-xs">
                          {ex.id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="capitalize">{ex.actionType.replace(/_/g, ' ')}</td>
                      <td><StatusBadge status={ex.status} /></td>
                      <td className="text-[#64748b]">{chainName(ex.targetChainId)}</td>
                      <td className="text-sm text-[#64748b]">{new Date(ex.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </QueryState>
        </div>
      </div>

      {(approvals?.total ?? 0) > 0 && (
        <Link
          href="/dashboard/approvals"
          className="flex items-center gap-2 rounded-xl bg-[#fff7ed] px-4 py-3 text-sm font-medium text-amber-700"
        >
          <CheckCircle className="h-4 w-4" />
          {approvals?.total} pending approvals — review now
        </Link>
      )}
    </div>
  );
}
