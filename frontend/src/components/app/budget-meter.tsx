import { formatUnits } from 'viem';
import { useBudget } from '@/hooks/use-valen-api';

type BudgetMeterProps = {
  agentId?: string | null;
  compact?: boolean;
};

function formatBaseUnits(value?: string | null, decimals = 6): string {
  if (!value) return '0';
  try {
    return formatUnits(BigInt(value), decimals);
  } catch {
    return value;
  }
}

export function BudgetMeter({ agentId, compact = false }: BudgetMeterProps) {
  const { data: budget, isLoading } = useBudget(agentId);
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
    </div>
  );
}
