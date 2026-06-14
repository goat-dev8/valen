import type { ExecutionDto } from '@/types/api';
import { formatExecutionAmount, resolveExecutionAsset } from './execution-display';

export type OutcomeKind = 'executed' | 'refused' | 'pending';

export const REFUSED_STATUSES = ['compliance_failed', 'risk_failed', 'policy_rejected', 'failed', 'cancelled'];
export const PENDING_STATUSES = ['created', 'validated', 'approval_required', 'approved', 'settlement_submitted'];

export const OUTCOME_LEDGER_LABEL = 'Outcome Ledger';
export const OUTCOME_LEDGER_NAV_SECTION = 'Verification';

export function outcomeKind(status: string): OutcomeKind {
  if (status === 'executed') return 'executed';
  if (REFUSED_STATUSES.includes(status)) return 'refused';
  return 'pending';
}

export function publicProofHref(execution: ExecutionDto): string {
  const kind = outcomeKind(execution.status);
  if (kind === 'executed') return `/proofs/executions/${execution.id}`;
  if (kind === 'refused') return `/proofs/refusals/${execution.id}`;
  return `/dashboard/executions/${execution.id}`;
}

export function assetSymbol(execution: ExecutionDto): string {
  const resolved = resolveExecutionAsset(execution);
  if (resolved) return resolved.symbol;
  if (execution.targetChainId === 421614) return 'USDC';
  if (execution.assetAddress && execution.assetAddress !== 'native') return 'TOKEN';
  return 'ETH';
}

export function outcomeHeadline(execution: ExecutionDto): string {
  const asset = assetSymbol(execution);
  const action = execution.actionType.replace(/_/g, ' ');
  const kind = outcomeKind(execution.status);
  const amount = execution.valueAmount ? ` · ${formatExecutionAmount(execution)}` : '';
  if (kind === 'executed') return `${asset} ${action} settled${amount}`;
  if (kind === 'refused') return `${asset} ${action} refused${amount}`;
  return `${asset} ${action} in progress${amount}`;
}

export function outcomeKindLabel(kind: OutcomeKind): string {
  if (kind === 'executed') return 'Settled';
  if (kind === 'refused') return 'Refused';
  return 'In progress';
}

export function matchesOutcomeSearch(
  execution: ExecutionDto,
  query: string,
  agentName?: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const symbol = assetSymbol(execution).toLowerCase();
  return (
    execution.id.toLowerCase().includes(q) ||
    execution.actionType.toLowerCase().includes(q) ||
    execution.status.toLowerCase().includes(q) ||
    symbol.includes(q) ||
    (agentName?.toLowerCase().includes(q) ?? false)
  );
}
