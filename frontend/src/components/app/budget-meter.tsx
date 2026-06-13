import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';
import { useBudget, useBudgetEvents, useBudgetTopup } from '@/hooks/use-valen-api';

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

type TopupSuccess = {
  addedUsdc: string;
  beforeCap: string;
  afterCap: string;
  beforeRemaining: string;
  afterRemaining: string;
  evidenceHash: string;
};

export function BudgetMeter({ agentId, compact = false, showTopup = false, chainId = 421614 }: BudgetMeterProps) {
  const { data: budget, isLoading } = useBudget(agentId);
  const { data: events } = useBudgetEvents(agentId);
  const topupMutation = useBudgetTopup(agentId);
  const [capUsdc, setCapUsdc] = useState('1');
  const [topupSuccess, setTopupSuccess] = useState<TopupSuccess | null>(null);
  const cap = Number(budget?.cap ?? 0);
  const spent = Number(budget?.spent ?? 0);
  const percent = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0;

  const submitTopup = (event: React.FormEvent) => {
    event.preventDefault();
    if (!capUsdc.trim() || Number(capUsdc) <= 0) return;

    const beforeCap = budget?.cap ?? '0';
    const beforeRemaining = budget?.remaining ?? beforeCap;
    const incrementBase = parseUnits(capUsdc, 6);
    const newCapBase = (BigInt(beforeCap) + incrementBase).toString();

    topupMutation.mutate(
      {
        chainId,
        assetAddress: USDC_SEPOLIA,
        assetSymbol: 'USDC',
        cap: newCapBase,
      },
      {
        onSuccess: (result) => {
          setTopupSuccess({
            addedUsdc: capUsdc,
            beforeCap: formatBaseUnits(beforeCap),
            afterCap: formatBaseUnits(result.cap),
            beforeRemaining: formatBaseUnits(beforeRemaining),
            afterRemaining: formatBaseUnits(result.remaining),
            evidenceHash: result.evidence_hash ?? '',
          });
        },
      },
    );
  };

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
          Set a USDC spending cap before running governed payments or transfers.
        </p>
        {showTopup && (
          <form className="mt-4 space-y-3" onSubmit={submitTopup}>
            <label className="block text-xs font-medium text-amber-800">
              Initial budget cap (USDC)
              <input
                value={capUsdc}
                onChange={(event) => setCapUsdc(event.target.value)}
                className="app-input mt-1"
                placeholder="1.0"
              />
            </label>
            <p className="text-xs text-amber-700">This sets the maximum USDC the agent can spend in the current 24h window.</p>
            <button type="submit" className="app-btn app-btn-primary" disabled={topupMutation.isPending}>
              {topupMutation.isPending ? 'Saving...' : 'Set budget cap'}
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
        <div className="text-right">
          <strong className="text-sm text-[#012b54]">{formatBaseUnits(budget.remaining)} USDC remaining</strong>
          <p className="text-xs text-[#64748b]">
            cap {formatBaseUnits(budget.cap)} · spent {formatBaseUnits(budget.spent)}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef6ff]">
        <div className="h-full rounded-full bg-[#007dfc]" style={{ width: `${percent}%` }} />
      </div>
      {!compact && (
        <dl className="app-detail-list mt-4">
          <div>
            <dt>Cap (24h limit)</dt>
            <dd>{formatBaseUnits(budget.cap)} USDC</dd>
          </div>
          <div>
            <dt>Spent</dt>
            <dd>{formatBaseUnits(budget.spent)} USDC</dd>
          </div>
          <div>
            <dt>Remaining</dt>
            <dd>{formatBaseUnits(budget.remaining)} USDC</dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd className="break-all font-mono text-xs">
              {budget.evidence_hash ? (
                <button
                  type="button"
                  className="text-left hover:text-[#007dfc]"
                  onClick={() => navigator.clipboard.writeText(budget.evidence_hash!)}
                  title="Click to copy evidence hash"
                >
                  {budget.evidence_hash}
                </button>
              ) : (
                'Unavailable'
              )}
            </dd>
          </div>
          <div>
            <dt>Resets</dt>
            <dd>{budget.resets_at ? new Date(budget.resets_at).toLocaleString() : 'Unavailable'}</dd>
          </div>
        </dl>
      )}

      {topupSuccess && (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold">Added {topupSuccess.addedUsdc} USDC to budget cap</p>
              <p className="mt-1 text-emerald-800">
                Cap: {topupSuccess.beforeCap} → {topupSuccess.afterCap} USDC
              </p>
              <p className="mt-1 text-emerald-800">
                Remaining: {topupSuccess.beforeRemaining} → {topupSuccess.afterRemaining} USDC
              </p>
              {topupSuccess.evidenceHash && (
                <p className="mt-2 break-all font-mono text-xs text-emerald-700">
                  Proof anchor: {topupSuccess.evidenceHash}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showTopup && (
        <form className="mt-4 space-y-3 border-t border-[#eef0f3] pt-4" onSubmit={submitTopup}>
          <label className="block text-xs font-medium text-[#64748b]">
            Add to budget cap (USDC)
            <input
              value={capUsdc}
              onChange={(event) => setCapUsdc(event.target.value)}
              className="app-input mt-1"
              placeholder="1.0"
            />
          </label>
          <p className="text-xs leading-5 text-[#64748b]">
            Adds to the current cap and starts a fresh 24h window with spending reset to zero.
          </p>
          <button type="submit" className="app-btn app-btn-outline" disabled={topupMutation.isPending}>
            {topupMutation.isPending ? 'Updating...' : 'Add to budget cap'}
          </button>
        </form>
      )}

      {!compact && events && events.length > 0 && (
        <div className="mt-4 border-t border-[#eef0f3] pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">Recent budget activity</p>
          <div className="mt-3 space-y-2">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="rounded-xl border border-[#eef0f3] p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold capitalize text-[#012b54]">{event.kind.replace(/_/g, ' ')}</span>
                  <span className="text-[#64748b]">{new Date(event.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-[#64748b]">
                  Amount: {formatBaseUnits(event.amount)} USDC · Remaining: {formatBaseUnits(event.remaining)} USDC
                </p>
                {event.execution_id && (
                  <Link href={`/dashboard/executions/${event.execution_id}`} className="app-link mt-1 inline-flex items-center gap-1">
                    View execution proof
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
