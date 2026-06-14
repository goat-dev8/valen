'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, ExternalLink, RefreshCw, X } from 'lucide-react';
import { AssetIcon } from '@/lib/asset-icons';
import { ChainBadge } from '@/components/app/chain-badge';
import { GovernancePipelineStrip } from '@/components/command-center/governance-pipeline-strip';
import { PipelineTimeline } from '@/components/app/pipeline-timeline';
import { RiskBadge, StatusBadge } from '@/components/app/status-badge';
import { copyToClipboard, formatExecutionAmount, resolveExecutionAsset } from '@/lib/execution-display';
import { explainExecutionFailure } from '@/lib/execution-failure';
import { explorerAddressUrl, explorerTxUrl } from '@/lib/explorer';
import type {
  AgentDto,
  ComplianceCheckDto,
  ExecutionDto,
  ExecutionTimelineEventDto,
  RiskEvaluationDto,
  SettlementDto,
} from '@/types/api';

function HashRow({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const onCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div>
      <dt>{label}</dt>
      <dd className="flex flex-wrap items-center gap-2">
        <code className="break-all font-mono text-xs">{value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value}</code>
        <button type="button" className="app-btn app-btn-outline px-2 py-1 text-xs" onClick={onCopy}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          Copy
        </button>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="app-link inline-flex items-center gap-1 text-xs">
            Explorer
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </dd>
    </div>
  );
}

type ExecutionDetailViewProps = {
  ex: ExecutionDto;
  agent?: AgentDto | null;
  compliance?: ComplianceCheckDto[];
  risk?: RiskEvaluationDto | null;
  settlement?: SettlementDto | null;
  timeline?: ExecutionTimelineEventDto[];
  actionError?: string | null;
  approvalReason: string;
  onApprovalReasonChange: (value: string) => void;
  onApproval: (decision: 'approved' | 'rejected') => void;
  onCancel: () => void;
  onRetrySettlement: () => void;
  approvePending: boolean;
  cancelPending: boolean;
  retryPending: boolean;
};

export function ExecutionDetailView({
  ex,
  agent,
  compliance,
  risk,
  settlement,
  timeline,
  actionError,
  approvalReason,
  onApprovalReasonChange,
  onApproval,
  onCancel,
  onRetrySettlement,
  approvePending,
  cancelPending,
  retryPending,
}: ExecutionDetailViewProps) {
  const asset = resolveExecutionAsset(ex);
  const amountLabel = formatExecutionAmount(ex);
  const txHash = settlement?.txHash ?? null;
  const failureExplanation = explainExecutionFailure({ execution: ex, compliance, risk, settlement });
  const canCancel = !['executed', 'failed', 'cancelled'].includes(ex.status);
  const pipelineState =
    ex.status === 'executed'
      ? 'complete'
      : ['compliance_failed', 'risk_failed', 'policy_rejected', 'failed'].includes(ex.status)
        ? 'refused'
        : ['created', 'validated', 'approval_required', 'approved', 'settlement_submitted'].includes(ex.status)
          ? 'running'
          : 'idle';

  return (
    <div className="space-y-6">
      <section className="app-panel-floating overflow-hidden p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <AssetIcon symbol={asset?.symbol ?? 'USDC'} size={56} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B98A5]">Execution</p>
              <h2 className="mt-1 text-2xl font-bold text-[#1A2332]">
                {amountLabel}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ChainBadge chainId={ex.targetChainId} />
                <StatusBadge status={ex.status} />
                <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#475569]">
                  {asset?.symbol ?? 'Asset'} · {ex.actionType}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/executions/${ex.id}/proof`} className="app-btn btn-proof">
              View Proof
            </Link>
            {txHash && (
              <a
                href={explorerTxUrl(settlement!.chainId, txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="app-btn app-btn-outline"
              >
                <ExternalLink className="h-4 w-4" />
                Explorer
              </a>
            )}
            {ex.status === 'approval_required' && (
              <>
                <input
                  type="text"
                  value={approvalReason}
                  onChange={(e) => onApprovalReasonChange(e.target.value)}
                  placeholder="Approval reason"
                  className="app-input max-w-xs"
                />
                <button type="button" className="app-btn app-btn-success" onClick={() => onApproval('approved')} disabled={approvePending}>
                  <Check className="h-4 w-4" />
                  Approve
                </button>
                <button type="button" className="app-btn app-btn-danger" onClick={() => onApproval('rejected')} disabled={approvePending}>
                  <X className="h-4 w-4" />
                  Deny
                </button>
              </>
            )}
            {canCancel && (
              <button type="button" className="app-btn app-btn-outline" onClick={onCancel} disabled={cancelPending}>
                Cancel
              </button>
            )}
          </div>
        </div>
        {txHash && (
          <div className="mt-4 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8B98A5]">Settlement transaction</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm text-[#1A2332]">{txHash.slice(0, 14)}…{txHash.slice(-10)}</code>
              <button
                type="button"
                className="app-btn app-btn-outline px-2 py-1 text-xs"
                onClick={() => copyToClipboard(txHash)}
              >
                <Copy className="h-3 w-3" />
                Copy hash
              </button>
              <span className="wallet-status wallet-status-ok capitalize">{settlement?.status ?? 'settled'}</span>
            </div>
          </div>
        )}
      </section>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8B98A5]">Governance pipeline</p>
        <GovernancePipelineStrip status={ex.status} state={pipelineState} />
      </section>

      {failureExplanation && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-900">{failureExplanation.headline}</p>
          <p className="mt-2 text-sm leading-6 text-red-800">{failureExplanation.humanReason}</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="app-card">
          <h3 className="app-card-title mb-4">Execution summary</h3>
          <dl className="app-detail-list">
            <div><dt>Amount</dt><dd className="font-semibold text-[#012b54]">{amountLabel}</dd></div>
            <div><dt>Asset</dt><dd>{asset?.symbol ?? ex.assetAddress ?? '—'}</dd></div>
            <div><dt>Chain</dt><dd><ChainBadge chainId={ex.targetChainId} /></dd></div>
            <div><dt>Agent</dt><dd>{agent?.name ?? ex.agentId}</dd></div>
            <div><dt>Recipient</dt><dd className="font-mono text-xs break-all">{ex.targetAddress ?? '—'}</dd></div>
            <div><dt>Mandate</dt><dd className="font-mono text-xs break-all">{ex.mandateId ?? '—'}</dd></div>
            <div><dt>Policy</dt><dd className="font-mono text-xs break-all">{ex.policyId ?? 'agent default'}</dd></div>
          </dl>
        </section>

        <section className="app-card">
          <h3 className="app-card-title mb-4">Evidence</h3>
          <dl className="app-detail-list">
            <HashRow label="Payload hash" value={ex.requestPayloadHash} />
            <HashRow label="Idempotency" value={ex.idempotencyKey} />
            <HashRow
              label="Settlement tx"
              value={txHash}
              href={txHash ? explorerTxUrl(settlement!.chainId, txHash) : undefined}
            />
            <HashRow
              label="Settlement contract"
              value={settlement?.contractAddress}
              href={settlement ? explorerAddressUrl(settlement.chainId, settlement.contractAddress) : undefined}
            />
            <div>
              <dt>Public proof</dt>
              <dd>
                <Link href={`/dashboard/executions/${ex.id}/proof`} className="app-link">
                  Open proof page
                </Link>
              </dd>
            </div>
          </dl>
          {settlement && ['failed', 'reverted'].includes(settlement.status) && (
            <button type="button" className="app-btn app-btn-outline mt-4" onClick={onRetrySettlement} disabled={retryPending}>
              <RefreshCw className="h-4 w-4" />
              Retry settlement
            </button>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="app-card lg:col-span-2">
          <h3 className="app-card-title mb-4">Timeline</h3>
          <PipelineTimeline events={timeline} status={ex.status} />
        </section>

        <div className="space-y-5">
          <section className="app-card">
            <h3 className="app-card-title mb-3">Compliance</h3>
            {!compliance?.length ? (
              <p className="text-sm text-[#64748b]">No compliance checks yet.</p>
            ) : (
              compliance.map((c) => (
                <div key={c.id} className="mb-2">
                  <span className="app-badge bg-emerald-50 text-emerald-600 capitalize">{c.status}</span>
                  <p className="mt-1 text-sm text-[#64748b]">{c.provider} · {c.reasonCode}</p>
                </div>
              ))
            )}
          </section>
          <section className="app-card">
            <h3 className="app-card-title mb-3">Risk</h3>
            {!risk ? (
              <p className="text-sm text-[#64748b]">Risk not calculated yet.</p>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-[#012b54]">{risk.score}</span>
                <RiskBadge tier={risk.tier} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
