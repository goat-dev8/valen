'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { AgentStatusBadge } from '@/components/app/status-badge';
import { useAgents, useMandates, useWalletVerifications } from '@/hooks/use-valen-api';

export default function AgentsPage() {
  const { data, isLoading, error } = useAgents({ limit: 50 });
  const { data: mandates } = useMandates();
  const { data: walletVerifications } = useWalletVerifications();
  const hasVerifiedWallet = walletVerifications?.some((wallet) => wallet.status === 'verified') ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title="Agents" description="Registered autonomous agents with mandates and API access">
        <Link href="/dashboard/register-agent" className="app-btn app-btn-primary">
          <Plus className="h-4 w-4" />
          Register Agent
        </Link>
      </PageHeader>

      <QueryState isLoading={isLoading} error={error} isEmpty={!data?.items.length} emptyMessage="No agents registered yet">
        <div className="grid gap-5 md:grid-cols-2">
          {data?.items.map((agent) => {
            const hasMandate = mandates?.some((mandate) => mandate.agentId === agent.id && mandate.status === 'active') ?? false;
            const readinessCount = [
              agent.status === 'active',
              Boolean(agent.defaultPolicyId),
              hasVerifiedWallet,
              hasMandate,
            ].filter(Boolean).length;

            return (
              <Link key={agent.id} href={`/dashboard/agents/${agent.id}`} className="app-card app-card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#012b54]">{agent.name}</h3>
                    <p className="text-sm capitalize text-[#64748b]">{agent.agentType} agent</p>
                  </div>
                  <AgentStatusBadge status={agent.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-[#eef0f3] pt-4">
                  <div>
                    <p className="text-xs text-[#64748b]">Policy</p>
                    <p className="text-sm font-medium text-[#012b54]">{agent.defaultPolicyId ? 'Assigned' : 'Missing'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">Readiness</p>
                    <p className="text-sm font-medium text-[#012b54]">{readinessCount}/4</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">Updated</p>
                    <p className="text-sm font-medium text-[#012b54]">
                      {new Date(agent.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </QueryState>
    </div>
  );
}
