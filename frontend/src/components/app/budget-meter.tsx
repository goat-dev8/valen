import { useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useBudget, useBudgetTopup } from '@/hooks/use-valen-api';

type BudgetMeterProps = {
  agentId?: string | null;
  compact?: boolean;
  showTopup?: boolean;
  chainId?: number;
};

const USDC_SEPOLIA = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

function formatBaseUnits(value?: string | null, decimals = 6): string {
  if (!value) return '0';
  try {
    return formatUnits(BigInt(value), decimals);
  } catch {
    return value;
  }
}

export function BudgetMeter({ agentId, compact = false, showTopup = false, chainId = 421614 }: BudgetMeterProps) {
  const { data: budget, isLoading } = useBudget(agentId);
  const topupMutation = useBudgetTopup(agentId);
  const [capUsdc, setCapUsdc] = useState('1');
  const cap = Number(budget?.cap ?? 0);
  const spent = Number(budget?.spent ?? 0);
  const percent = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0;

  if (!agentId) {
    return <p className="text-sm text-[#64748b]">Select an agent to see budget.</p>;
  }
  if (isLoading) {
    return <p className="text-sm text-[#64748b]">Loading budget...</p>;
  }
  if (!budget) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-800">No active budget</p>
        <p className="mt-1 text-xs leading-5 text-amber-700">
          Configure a USDC budget before expecting budget pass/refusal evidence.
        </p>
        {showTopup && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              topupMutation.mutate({
                chainId,
                assetAddress: USDC_SEPOLIA,
                assetSymbol: 'USDC',
                cap: parseUnits(capUsdc, 6).toString(),
              });
            }}
          >
            <label className="block text-xs font-medium text-amber-800">
              Budget cap (USDC)
              <input
                value={capUsdc}
                onChange={(event) => setCapUsdc(event.target.value)}
                className="app-input mt-1"
                placeholder="1.0"
              />
            </label>
            <button type="submit" className="app-btn app-btn-primary" disabled={topupMutation.isPending}>
              {topupMutation.isPending ? 'Saving...' : 'Configure budget'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[#eef0f3] bg-white ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007dfc]">USDC Budget</p>
          <p className="mt-1 text-sm text-[#64748b]">{budget.status ?? 'active'} · {budget.asset_symbol ?? 'USDC'}</p>
        </div>
        <strong className="text-sm text-[#012b54]">
          {formatBaseUnits(budget.remaining)} / {formatBaseUnits(budget.cap)} left
        </strong>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef6ff]">
        <div className="h-full rounded-full bg-[#007dfc]" style={{ width: `${percent}%` }} />
      </div>
      {!compact && (
        <dl className="app-detail-list mt-4">
          <div><dt>Spent</dt><dd>{formatBaseUnits(budget.spent)} USDC</dd></div>
          <div><dt>Evidence</dt><dd className="break-all font-mono text-xs">{budget.evidence_hash ?? 'Unavailable'}</dd></div>
          <div><dt>Resets</dt><dd>{budget.resets_at ? new Date(budget.resets_at).toLocaleString() : 'Unavailable'}</dd></div>
        </dl>
      )}
      {showTopup && (
        <form
          className="mt-4 space-y-3 border-t border-[#eef0f3] pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            topupMutation.mutate({
              chainId,
              assetAddress: USDC_SEPOLIA,
              assetSymbol: 'USDC',
              cap: parseUnits(capUsdc, 6).toString(),
            });
          }}
        >
          <label className="block text-xs font-medium text-[#64748b]">
            Increase cap (USDC)
            <input
              value={capUsdc}
              onChange={(event) => setCapUsdc(event.target.value)}
              className="app-input mt-1"
              placeholder="1.0"
            />
          </label>
          <button type="submit" className="app-btn app-btn-outline" disabled={topupMutation.isPending}>
            {topupMutation.isPending ? 'Updating...' : 'Top up budget'}
          </button>
        </form>
      )}
    </div>
  );
}
