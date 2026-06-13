'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useWallets } from '@privy-io/react-auth';
import { ArrowRight, Bot, CheckCircle, Circle, FileText, Landmark, ScrollText, Shield, TrendingUp, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { BuildathonProofBaseline } from '@/components/app/buildathon-proof-baseline';
import { PageHeader } from '@/components/app/page-header';
import { StatCard } from '@/components/app/stat-card';
import { QueryState } from '@/components/app/query-state';
import { StatusBadge } from '@/components/app/status-badge';
import { UserJourneyRail } from '@/components/app/user-journey-rail';
import { useOrganization } from '@/contexts/org-context';
import {
  useAgents,
  useAuditLogs,
  useExecutions,
  useMandates,
  usePolicies,
  useWalletVerifications,
} from '@/hooks/use-valen-api';
import { useWalletBalances } from '@/hooks/use-wallet-balances';
import { operatorFetch } from '@/lib/api';
import { baselineExecutionForChain } from '@/lib/buildathon-baseline';
import { chainName } from '@/lib/constants';
import { buildSetupSteps, setupProgress } from '@/lib/setup-state';
import { buildUserJourneySteps, userJourneyProgress } from '@/lib/user-journey';

type TreasuryData = {
  nativeBalanceEth?: string;
};

type GovernanceStatus = {
  queuedActionsCount?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const { wallets } = useWallets();
  const connectedWallet = wallets[0]?.address;
  const { organization } = useOrganization();
  const chainId = organization?.defaultChainId ?? 421614;
  const { data: totalAgents, isLoading: totalAgentsLoading } = useAgents({ limit: 100 });
  const { data: activeAgents, isLoading: agentsLoading } = useAgents({ status: 'active', limit: 1 });
  const { data: executions, isLoading: execLoading, error } = useExecutions({ limit: 10 });
  const { data: approvals } = useExecutions({ status: 'approval_required', limit: 1 });
  const { data: allExec, isLoading: allExecLoading } = useExecutions({ limit: 100 });
  const { data: auditLogs } = useAuditLogs({ limit: 100 });
  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const { data: walletVerifications, isLoading: walletVerificationsLoading } = useWalletVerifications();
  const { data: mandates, isLoading: mandatesLoading } = useMandates();
  const { data: walletBalances } = useWalletBalances(connectedWallet);
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
  const usdcBalance = walletBalances
    ?.find((row) => row.chainId === 421614)
    ?.tokens.find((token) => token.symbol === 'USDC')?.formatted;
  const journeySteps = buildUserJourneySteps({
    walletConnected: Boolean(connectedWallet),
    ownerWalletVerified: (walletVerifications ?? []).some((wallet) => wallet.status === 'verified'),
    agents: totalAgents?.items,
    policies,
    executions: allExec?.items,
    usdcBalanceFormatted: usdcBalance,
  });
  const journey = userJourneyProgress(journeySteps);
  const robinhoodBaseline = baselineExecutionForChain(46630);
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
        description="The operating system for autonomous finance — USDC budgets, rules, execution, and proof for every agent action."
      />

      <UserJourneyRail steps={journeySteps} />

      {robinhoodBaseline && (
        <section className="app-card flex flex-wrap items-center justify-between gap-4 border-[#cfe6ff] bg-[#f0f7ff]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#007dfc]">Headline demo</p>
            <h3 className="mt-1 text-lg font-semibold text-[#012b54]">Robinhood tokenized assets</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              Safe TSLA-style actions with full mandate, Stylus, and settlement proof — one click from Mission Control.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/demo/robinhood-tsla" className="app-btn app-btn-primary">
              Robinhood Assets
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={robinhoodBaseline.proofHref} className="app-btn app-btn-outline">
              Latest proof
            </Link>
          </div>
        </section>
      )}

      <BuildathonProofBaseline executions={allExec?.items} />

      <section className="app-card overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full bg-[#e8f4ff] px-3 py-1 text-xs font-semibold text-[#007dfc]">
              {journey.complete}/{journey.total} flow steps · {progress.complete}/{progress.total} authority setup
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-[#012b54]">
              {nextStep ? 'Finish setup before the next governed intent' : 'Your autonomous finance OS is ready'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
              Create an agent, give it a USDC budget and rules, fund it, let it act, and see immutable proof for every
              approval or refusal.
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eef6ff]">
              <div className="h-full rounded-full bg-[#007dfc]" style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={nextStep?.href ?? '/dashboard/executions'} className="app-btn app-btn-primary">
                {nextStep?.actionLabel ?? 'Review executions'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard/wallets" className="app-btn app-btn-outline">
                Wallet & Authority
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
          title="Rules"
          value={policies?.length ?? 0}
          change="Live rules endpoint"
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
            <Link href="/dashboard/executions" className="app-link">View all activity</Link>
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
