'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SetupModal } from '@/components/onboarding/setup-modal';
import { GuidedSetupPanel } from '@/components/onboarding/guided-setup-panel';
import { PageHeader } from '@/components/app/page-header';
import { AccountKpiStrip, buildAccountKpis } from '@/components/command-center/account-kpi-strip';
import { AgentsListCompact } from '@/components/command-center/agents-list-compact';
import { AssetStrip } from '@/components/command-center/asset-strip';
import { CommandSurface } from '@/components/command-center/command-surface';
import { GovernancePipelineStrip } from '@/components/command-center/governance-pipeline-strip';
import { X402PaymentDrawer } from '@/components/payments/x402-payment-drawer';
import { useOrganization } from '@/contexts/org-context';
import {
  useDashboardSummary,
  useAgents,
  useExecutions,
  useMandates,
  usePolicies,
  useWalletVerifications,
} from '@/hooks/use-valen-api';
import { buildSetupSteps, setupProgress } from '@/lib/setup-state';

export default function DashboardPage() {
  const { organization } = useOrganization();
  const { data: totalAgents, isLoading: totalAgentsLoading } = useAgents({ limit: 100 });
  const { data: activeAgents } = useAgents({ status: 'active', limit: 1 });
  const { data: approvals } = useExecutions({ status: 'approval_required', limit: 1 });
  const { data: allExec, isLoading: allExecLoading, error } = useExecutions({ limit: 100 });
  const { data: dashboardSummary } = useDashboardSummary();
  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const { data: walletVerifications, isLoading: walletVerificationsLoading } = useWalletVerifications();
  const { data: mandates, isLoading: mandatesLoading } = useMandates();

  const total = allExec?.total ?? 0;
  const executed = allExec?.items.filter((e) => e.status === 'executed').length ?? 0;
  const passRate = total > 0 ? Math.round((executed / total) * 1000) / 10 : 0;

  const setupSteps = buildSetupSteps({
    organization,
    agents: totalAgents?.items,
    policies,
    executions: allExec?.items,
    ownerWalletVerified: (walletVerifications ?? []).some((wallet) => wallet.status === 'verified'),
    signedMandateCount: (mandates ?? []).filter((mandate) => mandate.status === 'active').length,
  });
  const progress = setupProgress(setupSteps);
  const latestProof = dashboardSummary?.latest.proof;
  const setupLoading =
    totalAgentsLoading || allExecLoading || policiesLoading || walletVerificationsLoading || mandatesLoading;
  const setupComplete = progress.percent >= 100;

  const mandateAgentIds = useMemo(
    () => new Set((mandates ?? []).filter((m) => m.status === 'active').map((m) => m.agentId)),
    [mandates],
  );

  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [x402Open, setX402Open] = useState(false);
  const [x402Amount, setX402Amount] = useState('0.01');

  useEffect(() => {
    if (!organization || setupLoading || setupComplete) return;
    const onboardingKey = `valen:onboarding-seen:${organization.id}`;
    if (!sessionStorage.getItem(onboardingKey)) {
      sessionStorage.setItem(onboardingKey, '1');
      setSetupModalOpen(true);
    }
  }, [organization, setupComplete, setupLoading]);

  const dashboardKpis = useMemo(
    () =>
      buildAccountKpis({
        summary: dashboardSummary,
        activeAgentCount: activeAgents?.total ?? 0,
        totalAgentCount: totalAgents?.total ?? 0,
        passRate,
        executedCount: executed,
      }),
    [dashboardSummary, activeAgents?.total, totalAgents?.total, passRate, executed],
  );

  const systemsHealthy = setupComplete && (approvals?.total ?? 0) === 0;

  const pipelineExecution = allExec?.items[0];
  const inFlight = allExec?.items.filter((e) =>
    ['created', 'validated', 'approval_required', 'approved', 'settlement_submitted'].includes(e.status),
  );

  const openX402 = (amount?: string) => {
    setX402Amount(amount ?? '0.01');
    setX402Open(true);
  };

  return (
    <div className="space-y-5">
      <SetupModal open={setupModalOpen} onClose={() => setSetupModalOpen(false)} steps={setupSteps} />
      <X402PaymentDrawer open={x402Open} onClose={() => setX402Open(false)} initialAmount={x402Amount} />

      <PageHeader
        title="Command Center"
        description="Governed autonomous agents — every action ends with a public proof."
      >
        <Link href="/dashboard/proofs" className="app-btn app-btn-outline">
          Outcome Ledger
        </Link>
        {!setupComplete && (
          <button type="button" className="app-btn app-btn-outline" onClick={() => setSetupModalOpen(true)}>
            Setup guide
          </button>
        )}
        <Link href="/dashboard/agents/studio" className="app-btn app-btn-outline">
          Agent Studio
        </Link>
        <Link href={latestProof?.href ?? '/proofs/pack'} className="app-btn btn-proof">
          Latest proof
        </Link>
      </PageHeader>

      <AccountKpiStrip metrics={dashboardKpis} />

      <GuidedSetupPanel steps={setupSteps} />

      {(approvals?.total ?? 0) > 0 && (
        <Link
          href="/dashboard/approvals"
          className="app-panel-premium flex items-center gap-2 px-4 py-3 text-sm font-medium text-amber-800"
        >
          <CheckCircle className="h-4 w-4 shrink-0" />
          {approvals?.total} pending approvals — review now
        </Link>
      )}

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-[1fr_1.05fr]">
        <AgentsListCompact
          agents={totalAgents?.items ?? []}
          mandateAgentIds={mandateAgentIds}
          activeCount={activeAgents?.total ?? 0}
          systemsHealthy={systemsHealthy}
        />

        <div className="space-y-5">
          <CommandSurface summary={dashboardSummary} onX402Open={openX402} />
          <AssetStrip onX402Click={() => openX402('0.01')} />
          <GovernancePipelineStrip
            status={inFlight?.[0]?.status ?? pipelineExecution?.status}
            state={
              inFlight?.length
                ? 'running'
                : pipelineExecution?.status?.includes('failed') || pipelineExecution?.status?.includes('rejected')
                  ? 'refused'
                  : pipelineExecution?.status === 'executed'
                    ? 'complete'
                    : 'idle'
            }
          />
        </div>
      </div>

      {error && (
        <div className="app-panel-premium px-4 py-3 text-sm font-medium text-red-700">
          Failed to load recent executions. Refresh the page or try again shortly.
        </div>
      )}
    </div>
  );
}
