'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import type { DashboardSummaryDto } from '@/types/api';
import { formatUsdcBaseUnits } from '@/lib/token-amount';

export type AccountKpi = {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'muted';
  href?: string;
};

export function AccountKpiStrip({
  metrics,
  healthLabel,
  healthOk = true,
}: {
  metrics: AccountKpi[];
  healthLabel?: string;
  healthOk?: boolean;
}) {
  return (
    <section className="app-panel-floating overflow-hidden" aria-label="Account overview">
      <div className="flex flex-wrap items-stretch divide-y divide-[#E8ECF0] md:flex-nowrap md:divide-x md:divide-y-0">
        {metrics.map((metric, index) => {
          const cell = (
            <div className="flex min-w-[140px] flex-1 flex-col justify-center px-5 py-4 md:px-6 md:py-5">
              <p className="text-xs font-medium text-[#8B98A5]">{metric.label}</p>
              <p
                className={`app-kpi-value mt-1 text-2xl font-bold tracking-tight md:text-[1.75rem] ${
                  metric.tone === 'positive'
                    ? 'text-emerald-600'
                    : metric.tone === 'muted'
                      ? 'text-[#8B98A5]'
                      : 'text-[#1A2332]'
                }`}
              >
                {metric.value}
              </p>
            </div>
          );

          if (metric.href) {
            return (
              <Link
                key={metric.label}
                href={metric.href}
                className={`flex-1 transition hover:bg-[#FAFBFC] ${index > 0 ? '' : ''}`}
              >
                {cell}
              </Link>
            );
          }
          return (
            <div key={metric.label} className="flex-1">
              {cell}
            </div>
          );
        })}
      </div>
      {healthLabel && (
        <div className="flex items-center justify-end gap-2 border-t border-[#E8ECF0]/80 bg-[#FAFBFC]/80 px-5 py-2.5 md:px-6">
          {healthOk ? (
            <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden />
          ) : null}
          <span className={`text-xs font-medium ${healthOk ? 'text-emerald-600' : 'text-amber-700'}`}>{healthLabel}</span>
        </div>
      )}
    </section>
  );
}

export function buildAccountKpis(input: {
  summary?: DashboardSummaryDto | null;
}): AccountKpi[] {
  const org = input.summary?.organizationStats;
  const budget = org?.budgetTotals;
  const governance = org?.governance;
  const symbol = budget?.assetSymbol ?? 'USDC';
  const budgetedAgents = budget?.budgetedAgents ?? 0;
  const hasBudget = Boolean(budget && budget.status === 'active' && budgetedAgents > 0);
  const remaining = hasBudget ? formatUsdcBaseUnits(budget?.remaining) : null;
  const spent = hasBudget ? formatUsdcBaseUnits(budget?.spent ?? '0') : '0';
  const passRate = governance?.successRatePercent ?? 0;
  const activeAgents = org?.activeAgents ?? 0;

  return [
    {
      label: 'USDC Budget',
      value: remaining != null ? `${remaining} ${symbol}` : 'Not configured',
      href: '/dashboard/budgets',
    },
    {
      label: 'Success Rate',
      value: `${passRate}%`,
      tone: passRate >= 80 ? 'positive' : 'default',
    },
    {
      label: 'USDC Spent',
      value: hasBudget ? `${spent} ${symbol}` : `0 ${symbol}`,
      tone: 'positive',
      href: '/dashboard/budgets',
    },
    {
      label: 'Active Agents',
      value: String(activeAgents),
      href: '/dashboard/agents',
    },
  ];
}
