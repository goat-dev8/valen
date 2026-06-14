'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { BudgetMeter } from '@/components/app/budget-meter';
import { BudgetEventsList } from '@/components/budget/budget-events-list';
import { BudgetExplainer } from '@/components/budget/budget-explainer';
import { BudgetFaucetsFab } from '@/components/budget/budget-faucets-fab';
import { BudgetSidebar } from '@/components/budget/budget-sidebar';
import { BudgetStats } from '@/components/budget/budget-stats';
import { useAgents, useBudget, useBudgetEvents, useDashboardSummary } from '@/hooks/use-valen-api';

import { formatUsdcBaseUnits } from '@/lib/token-amount';

function formatUsdc(baseUnits?: string | number | null): string {
  return formatUsdcBaseUnits(baseUnits);
}

export default function BudgetsPage() {
  const { data: summary } = useDashboardSummary();
  const { data: agents, isLoading: agentsLoading } = useAgents({ limit: 100 });
  const activeAgents = useMemo(
    () => agents?.items.filter((agent) => agent.status === 'active') ?? [],
    [agents],
  );

  const defaultAgentId =
    summary?.agent?.id ?? activeAgents[0]?.id ?? null;

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAgentId) return;
    if (defaultAgentId) setSelectedAgentId(defaultAgentId);
  }, [defaultAgentId, selectedAgentId]);

  const agentId = selectedAgentId ?? defaultAgentId;
  const selectedAgent = activeAgents.find((agent) => agent.id === agentId) ?? summary?.agent;
  const chainId = summary?.organization.defaultChainId ?? 421614;

  const { data: budget, isLoading: budgetLoading } = useBudget(agentId);
  const { data: events, isLoading: eventsLoading } = useBudgetEvents(agentId);

  const cap = Number(budget?.cap ?? 0);
  const spent = Number(budget?.spent ?? 0);
  const utilization = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0;

  return (
    <div className="budget-ledger-page space-y-6">
      <Link href="/dashboard" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Command Center
      </Link>

      <PageHeader
        title="Budgets"
        description="USDC spending caps per agent — refusals produce public proof before settlement."
      >
        <Link href="/dashboard/authority" className="app-btn app-btn-outline">
          Authority
        </Link>
        <Link href="/dashboard/payments" className="app-btn app-btn-primary">
          x402 Payments
        </Link>
      </PageHeader>

      <BudgetExplainer />

      <div className="budget-agent-toolbar">
        <label className="budget-agent-picker">
          <span className="budget-agent-picker__label">Agent budget</span>
          <select
            className="app-input budget-agent-picker__select"
            value={agentId ?? ''}
            onChange={(e) => setSelectedAgentId(e.target.value || null)}
            disabled={agentsLoading || !activeAgents.length}
          >
            {!activeAgents.length && <option value="">No active agents</option>}
            {activeAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {budget && (
        <BudgetStats
          capUsdc={formatUsdc(budget.cap)}
          spentUsdc={formatUsdc(budget.spent)}
          remainingUsdc={formatUsdc(budget.remaining)}
          utilization={utilization}
          eventCount={events?.length ?? 0}
          status={budget.status ?? 'active'}
        />
      )}

      <div className="intent-wizard-layout">
        <div className="intent-wizard-main space-y-5">
          <section className="app-panel-floating budget-meter-panel">
            <div className="budget-meter-panel__header">
              <div>
                <h2 className="budget-meter-panel__title">Live USDC budget</h2>
                <p className="budget-meter-panel__desc">
                  Set or increase the rolling cap for{' '}
                  <strong>{selectedAgent?.name ?? 'your agent'}</strong>.
                </p>
              </div>
            </div>
            {budgetLoading || agentsLoading ? (
              <p className="text-sm text-[#5E6C7B]">Loading budget…</p>
            ) : (
              <BudgetMeter
                agentId={agentId}
                showTopup
                showActivity={false}
                chainId={chainId}
              />
            )}
          </section>

          <section className="app-panel-floating budget-events-panel">
            {eventsLoading ? (
              <p className="text-sm text-[#5E6C7B]">Loading budget activity…</p>
            ) : (
              <BudgetEventsList events={events ?? []} />
            )}
          </section>
        </div>

        <BudgetSidebar
          agentName={selectedAgent?.name ?? undefined}
          chainId={chainId}
          resetsAt={budget?.resets_at}
        />
      </div>

      <BudgetFaucetsFab />
    </div>
  );
}
