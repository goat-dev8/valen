'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bot, CheckCircle, Circle, FileText, Landmark, ScrollText, Shield, TrendingUp, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { BudgetMeter } from '@/components/app/budget-meter';
import { StatCard } from '@/components/app/stat-card';
import { QueryState } from '@/components/app/query-state';
import { StatusBadge } from '@/components/app/status-badge';
import { useOrganization } from '@/contexts/org-context';
import {
  useDashboardSummary,
  useAgents,
  useAuditLogs,
  useExecutions,
  useMandates,
  usePolicies,
  useWalletVerifications,
} from '@/hooks/use-valen-api';
import { operatorFetch } from '@/lib/api';
import { chainName } from '@/lib/constants';
import { buildSetupSteps, setupProgress } from '@/lib/setup-state';
import { formatProofAmount } from '@/lib/token-amount';

type TreasuryData = {
  nativeBalanceEth?: string;
};

type GovernanceStatus = {
  queuedActionsCount?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const { organization } = useOrganization();
  const chainId = organization?.defaultChainId ?? 421614;
  const { data: totalAgents, isLoading: totalAgentsLoading } = useAgents({ limit: 100 });
  const { data: activeAgents, isLoading: agentsLoading } = useAgents({ status: 'active', limit: 1 });
  const { data: executions, isLoading: execLoading, error } = useExecutions({ limit: 10 });
  const { data: approvals } = useExecutions({ status: 'approval_required', limit: 1 });
  const { data: allExec, isLoading: allExecLoading } = useExecutions({ limit: 100 });
  const { data: auditLogs } = useAuditLogs({ limit: 100 });
  const { data: dashboardSummary } = useDashboardSummary();
  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const { data: walletVerifications, isLoading: walletVerificationsLoading } = useWalletVerifications();
  const { data: mandates, isLoading: mandatesLoading } = useMandates();
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
  const setupSteps = buildSetupSteps({
    organization,
    agents: totalAgents?.items,
    policies,
    executions: allExec?.items,
    ownerWalletVerified: (walletVerifications ?? []).some((wallet) => wallet.status === 'verified'),
    signedMandateCount: (mandates ?? []).filter((mandate) => mandate.status === 'active').length,
  });
  const progress = setupProgress(setupSteps);
  const nextStep = setupSteps.find((step) => !step.complete);
  const latestProof = dashboardSummary?.latest.proof;
  const latestRobinhood = dashboardSummary?.latest.robinhood;
  const latestPayment = dashboardSummary?.latest.payment;
  const budgetStatus = dashboardSummary?.budget.status ?? 'Checking';
  const setupLoading =
    totalAgentsLoading || allExecLoading || policiesLoading || walletVerificationsLoading || mandatesLoading;

  useEffect(() => {
    if (!organization || setupLoading || !nextStep) return;

    const onboardingKey = `valen:onboarding-seen:${organization.id}`;
    if (!sessionStorage.getItem(onboardingKey)) {
      sessionStorage.setItem(onboardingKey, '1');
      router.replace('/onboarding');
    }
  }, [organization, nextStep, router, setupLoading]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mission Control"
        description="Create an agent, give it a USDC budget and rules, fund it, execute, and see proof for every approval or refusal."
      />

      <section className="app-card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full bg-[#e8f4ff] px-3 py-1 text-xs font-semibold text-[#007dfc]">
              The operating system for autonomous finance
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-[#012b54]">
              {nextStep ? 'Finish the setup path, then run a proof-producing action' : 'Your governed agent flow is ready'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
              VALEN binds wallet authority, signed mandates, rules, settlement, and audit evidence so every autonomous
              finance action ends with a proof URL. USDC budgets enforce deterministic refusals before settlement.
              honest until then.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {[
                ['Agent', dashboardSummary?.agent?.name ?? 'Not ready'],
                ['Rules', `${dashboardSummary?.counts.policies ?? policies?.length ?? 0} active`],
                ['Budget', budgetStatus ?? 'Checking'],
                ['Proof', latestProof ? 'Available' : 'Pending'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#eef0f3] bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">{label}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#012b54]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eef6ff]">
              <div className="h-full rounded-full bg-[#007dfc]" style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/dashboard/executions/new" className="app-btn app-btn-primary">
                Run governed action
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={latestProof?.href ?? '/proofs/pack'} className="app-btn app-btn-outline">
                See latest proof
              </Link>
              <Link href="/proofs/pack" className="app-btn app-btn-outline">
                Public proof pack
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {setupSteps.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className="flex gap-3 rounded-2xl border border-[#eef0f3] bg-white p-4 transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]"
              >
                <div className="mt-0.5">
                  {step.complete ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-[#94a3b8]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#012b54]">{step.title}</p>
                    {!step.complete && <span className="wallet-status wallet-status-warn">Next</span>}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">{step.description}</p>
                  {step.blockedReason && (
                    <p className="mt-2 text-xs font-medium text-amber-700">{step.blockedReason}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-4">
        <Link href={latestProof?.href ?? '/proofs/pack'} className="app-card transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007dfc]">Latest Proof</p>
          <h3 className="mt-3 text-lg font-semibold text-[#012b54]">
            {latestProof ? latestProof.executionId.slice(0, 8) : 'No executed proof yet'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            {latestProof
              ? `${latestProof.actionType?.replace(/_/g, ' ') ?? 'Execution'} on ${chainName(latestProof.chainId ?? chainId)}`
              : 'Run a governed action to create a proof page with settlement and audit evidence.'}
          </p>
        </Link>

        <Link href={latestRobinhood?.href ?? '/dashboard/demo/robinhood'} className="app-card transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007dfc]">Robinhood Proof</p>
          <h3 className="mt-3 text-lg font-semibold text-[#012b54]">
            {latestRobinhood ? latestRobinhood.executionId.slice(0, 8) : 'Open Robinhood flow'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            {latestRobinhood
              ? `${latestRobinhood.asset ?? 'Tokenized asset'} action on Robinhood Testnet`
              : 'Open the Robinhood headline demo for TSLA, AMZN, PLTR, NFLX, and AMD with allowed and refused paths.'}
          </p>
        </Link>

        <Link href="/dashboard/wallets" className="app-card transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007dfc]">Fund Agent</p>
          <h3 className="mt-3 text-lg font-semibold text-[#012b54]">USDC-first authority</h3>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            Verify wallet authority and sign mandates now. Phase C makes USDC the default asset and Phase F funds real budget vaults.
          </p>
        </Link>

        <Link href={latestPayment?.href ?? '/dashboard/payments'} className="app-card transition hover:border-[#cfe6ff] hover:bg-[#f8fbff]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007dfc]">x402 Payment Proof</p>
          <h3 className="mt-3 text-lg font-semibold text-[#012b54]">
            {latestPayment ? latestPayment.paymentId.slice(0, 8) : 'Run x402 payment'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#64748b]">
            {latestPayment
              ? `${latestPayment.status} · ${formatProofAmount(latestPayment.amount, chainId, undefined, 'USDC').replace(' USDC', '')} USDC`
              : 'Initiate and settle a governed x402 USDC payment with budget enforcement.'}
          </p>
        </Link>
      </section>

      <section className="app-card">
        <h3 className="app-card-title mb-4">Live USDC Budget</h3>
        <BudgetMeter agentId={dashboardSummary?.agent?.id} showTopup chainId={chainId} />
      </section>

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
          value="No aggregate yet"
          change="Risk appears on each execution proof"
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
