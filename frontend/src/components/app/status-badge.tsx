import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  created: 'bg-slate-100 text-slate-600',
  validated: 'bg-blue-50 text-blue-600',
  compliance_failed: 'bg-red-50 text-red-600',
  risk_failed: 'bg-red-50 text-red-600',
  policy_rejected: 'bg-orange-50 text-orange-600',
  approval_required: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-600',
  settlement_submitted: 'bg-indigo-50 text-indigo-600',
  executed: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const RISK_STYLES: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-600',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ');
  return (
    <span className={cn('app-badge capitalize', STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600')}>
      {label}
    </span>
  );
}

export function RiskBadge({ tier }: { tier: string }) {
  return (
    <span className={cn('app-badge capitalize', RISK_STYLES[tier] ?? 'bg-slate-100 text-slate-600')}>
      {tier}
    </span>
  );
}

export function AgentStatusBadge({ status }: { status: string }) {
  const styles =
    status === 'active'
      ? 'bg-emerald-50 text-emerald-600'
      : status === 'suspended'
        ? 'bg-red-50 text-red-600'
        : 'bg-slate-100 text-slate-600';

  return <span className={cn('app-badge capitalize', styles)}>{status}</span>;
}
