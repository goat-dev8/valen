'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { AgentFleetGrid } from '@/components/agents/agent-fleet-grid';
import { AgentTemplateGallery } from '@/components/agents/agent-template-gallery';
import { useAgents, useExecutions, useMandates, useWalletVerifications } from '@/hooks/use-valen-api';
import { agentTypeOption } from '@/lib/agent-types';

export default function AgentsPage() {
  const { data, isLoading, error } = useAgents({ limit: 50 });
  const { data: mandates } = useMandates();
  const { data: executions } = useExecutions({ limit: 100 });
  const { data: walletVerifications } = useWalletVerifications();
  const hasVerifiedWallet = walletVerifications?.some((wallet) => wallet.status === 'verified') ?? false;

  const rows =
    data?.items.map((agent) => {
      const hasMandate = mandates?.some((m) => m.agentId === agent.id && m.status === 'active') ?? false;
      const typeMeta = agentTypeOption(agent.agentType);
      const agentExecs = executions?.items.filter((ex) => ex.agentId === agent.id) ?? [];
      const proofCount = agentExecs.filter((ex) => ex.status === 'executed').length;
      const lastExecution = agentExecs[0]?.createdAt ?? null;
      const readinessCount = [
        agent.status === 'active',
        Boolean(agent.defaultPolicyId),
        hasVerifiedWallet,
        hasMandate,
      ].filter(Boolean).length;
      return {
        agent,
        readinessCount,
        typeMeta,
        hasMandate,
        hasPolicy: Boolean(agent.defaultPolicyId),
        proofCount,
        lastExecution,
      };
    }) ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Agent Fleet" description="Governed autonomous agents with mandates, identity, and proof history">
        <Link href="/dashboard/agents/studio" className="app-btn app-btn-primary">
          <Plus className="h-4 w-4" />
          Agent Studio
        </Link>
      </PageHeader>

      <QueryState isLoading={isLoading} error={error} isEmpty={false}>
        <AgentFleetGrid rows={rows} emptyMessage="No agents yet — clone a starter below or open Agent Studio." />
      </QueryState>

      <AgentTemplateGallery existingAgents={rows.map((row) => row.agent)} />
    </div>
  );
}
