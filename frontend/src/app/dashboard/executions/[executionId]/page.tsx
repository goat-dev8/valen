'use client';

import Link from 'next/link';
import { useWallets } from '@privy-io/react-auth';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, ExternalLink, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { PipelineTimeline } from '@/components/app/pipeline-timeline';
import { QueryState } from '@/components/app/query-state';
import { RiskBadge, StatusBadge } from '@/components/app/status-badge';
import {
  useAgent,
  useApproveExecution,
  useCancelExecution,
  useExecution,
  useExecutionCompliance,
  useExecutionRisk,
  useExecutionSettlement,
  useExecutionTimeline,
  useRetrySettlement,
} from '@/hooks/use-valen-api';
import { signApprovalProof } from '@/lib/approval-signature';
import { explorerAddressUrl, explorerTxUrl } from '@/lib/explorer';

function riskStatusMessage(status: string, hasRiskScore: boolean): string {
  if (status === 'failed' && hasRiskScore) {
    return 'Execution failed after risk was calculated (usually settlement).';
  }
  if (status === 'failed') return 'Execution failed before risk was calculated.';
  if (status === 'compliance_failed') return 'Execution failed during compliance; risk was not calculated.';
  if (status === 'risk_failed') return 'Risk evaluation failed for this execution.';
  if (status === 'cancelled') return 'Execution was cancelled before risk was calculated.';
  return 'Risk not calculated yet.';
}

function settlementStatusMessage(status: string): string {
  if (status === 'failed') return 'Execution failed before settlement was created.';
  if (status === 'cancelled') return 'Execution was cancelled before settlement.';
  if (['created', 'validated', 'compliance_failed', 'risk_failed', 'policy_rejected'].includes(status)) {
    return 'Settlement has not started for this execution.';
  }
  return 'No settlement record yet.';
}

export default function ExecutionDetailPage() {
  const params = useParams();
  const executionId = params.executionId as string;
  const { data: ex, isLoading, error } = useExecution(executionId);
  const { data: agent } = useAgent(ex?.agentId ?? '');
  const { data: compliance } = useExecutionCompliance(executionId, Boolean(ex));
  const settlementFetchEnabled = Boolean(
    ex &&
      (['settlement_submitted', 'executed', 'approved'].includes(ex.status) ||
        (ex.status === 'failed' && Array.isArray(compliance) && compliance.length > 0)),
  );
  const { data: risk } = useExecutionRisk(executionId);
  const { data: settlement } = useExecutionSettlement(executionId, settlementFetchEnabled);
  const { data: timeline } = useExecutionTimeline(executionId);
  const { wallets } = useWallets();
  const approveMutation = useApproveExecution();
  const cancelMutation = useCancelExecution();
  const retryMutation = useRetrySettlement();
  const [actionError, setActionError] = useState<string | null>(null);
  const [approvalReason, setApprovalReason] = useState('');

  const handleApproval = async (decision: 'approved' | 'rejected') => {
    setActionError(null);
    if (!ex) return;
    const reason = approvalReason.trim() || (decision === 'approved' ? 'Approved via dashboard' : 'Rejected via dashboard');
    try {
      const approvalProofRef = await signApprovalProof({
        wallet: wallets[0],
        execution: ex,
        decision,
        reason,
      });
      await approveMutation.mutateAsync({
        executionId,
        body: {
          decision,
          reason,
          approvalProofRef,
        },
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('Reason for cancelling this execution:');
    if (!reason?.trim()) return;
    setActionError(null);
    try {
      await cancelMutation.mutateAsync({ executionId, reason: reason.trim() });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  const handleRetrySettlement = async () => {
    if (!settlement) return;
    const reason = window.prompt('Reason for retrying settlement:');
    if (!reason?.trim()) return;
    setActionError(null);
    try {
      await retryMutation.mutateAsync({ settlementId: settlement.id, reason: reason.trim() });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Retry failed');
    }
  };

  const canCancel = ex && !['executed', 'failed', 'cancelled'].includes(ex.status);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/executions" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Executions
      </Link>

      <QueryState isLoading={isLoading} error={error} isEmpty={!ex}>
        {ex && (
          <>
            <PageHeader title={`Execution ${ex.id.slice(0, 8)}...`} description={`${ex.actionType} intent`}>
              <ChainBadge chainId={ex.targetChainId} />
              <StatusBadge status={ex.status} />
              <Link href={`/dashboard/executions/${ex.id}/proof`} className="app-btn app-btn-outline">
                View Proof
              </Link>
              {ex.status === 'approval_required' && (
                <>
                  <input
                    type="text"
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder="Approval reason"
                    className="app-input max-w-xs"
                  />
                  <button type="button" className="app-btn app-btn-success" onClick={() => handleApproval('approved')} disabled={approveMutation.isPending}>
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                  <button type="button" className="app-btn app-btn-danger" onClick={() => handleApproval('rejected')} disabled={approveMutation.isPending}>
                    <X className="h-4 w-4" />
                    Deny
                  </button>
                </>
              )}
              {canCancel && (
                <button type="button" className="app-btn app-btn-outline" onClick={handleCancel} disabled={cancelMutation.isPending}>
                  Cancel
                </button>
              )}
            </PageHeader>

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="app-card lg:col-span-2">
                <h3 className="app-card-title mb-4">Pipeline Timeline</h3>
                <PipelineTimeline events={timeline} status={ex.status} />
              </div>

              <div className="space-y-5">
                <div className="app-card">
                  <h3 className="app-card-title mb-3">Intent Details</h3>
                  <dl className="app-detail-list">
                    <div><dt>Agent</dt><dd>{agent?.name ?? ex.agentId.slice(0, 12)}...</dd></div>
                    <div><dt>Mandate</dt><dd className="font-mono text-xs break-all">{ex.mandateId ?? '—'}</dd></div>
                    <div><dt>Policy</dt><dd className="font-mono text-xs break-all">{ex.policyId ?? 'agent default'}</dd></div>
                    <div><dt>Chain</dt><dd><ChainBadge chainId={ex.targetChainId} /></dd></div>
                    <div><dt>Target</dt><dd className="font-mono text-xs break-all">{ex.targetAddress ?? '—'}</dd></div>
                    <div><dt>Payload Hash</dt><dd className="font-mono text-xs break-all">{ex.requestPayloadHash}</dd></div>
                    <div><dt>Idempotency</dt><dd className="font-mono text-xs break-all">{ex.idempotencyKey}</dd></div>
                  </dl>
                </div>

                <div className="app-card">
                  <h3 className="app-card-title mb-3">Compliance</h3>
                  {!compliance?.length ? (
                    <p className="text-sm text-[#64748b]">No compliance checks yet.</p>
                  ) : (
                    compliance.map((c) => (
                      <div key={c.id} className="mb-2">
                        <span className="app-badge bg-emerald-50 text-emerald-600 capitalize">{c.status}</span>
                        <p className="mt-1 text-sm text-[#64748b]">{c.provider} · {c.reasonCode}</p>
                        {c.checkedAt && <p className="text-xs text-[#64748b]">{new Date(c.checkedAt).toLocaleString()}</p>}
                      </div>
                    ))
                  )}
                </div>

                <div className="app-card">
                  <h3 className="app-card-title mb-3">Risk Score</h3>
                  {!risk ? (
                    <p className="text-sm text-[#64748b]">{riskStatusMessage(ex.status, Boolean(risk))}</p>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-[#012b54]">{risk.score}</span>
                        <RiskBadge tier={risk.tier} />
                      </div>
                      {risk.requiresApproval && (
                        <p className="mt-2 text-sm text-amber-600">Requires human approval</p>
                      )}
                    </>
                  )}
                </div>

                <div className="app-card">
                  <h3 className="app-card-title mb-3">Settlement</h3>
                  {!settlement ? (
                    <p className="text-sm text-[#64748b]">{settlementStatusMessage(ex.status)}</p>
                  ) : (
                    <>
                      <dl className="app-detail-list">
                        <div><dt>Status</dt><dd className="capitalize">{settlement.status}</dd></div>
                        <div>
                          <dt>Tx Hash</dt>
                          <dd>
                            {settlement.txHash ? (
                              <a
                                href={explorerTxUrl(settlement.chainId, settlement.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="app-link inline-flex items-center gap-1 font-mono text-xs"
                              >
                                {settlement.txHash.slice(0, 16)}...
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt>Contract</dt>
                          <dd>
                            <a
                              href={explorerAddressUrl(settlement.chainId, settlement.contractAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="app-link inline-flex items-center gap-1 font-mono text-xs"
                            >
                              {settlement.contractAddress.slice(0, 12)}...
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </dd>
                        </div>
                      </dl>
                      {['failed', 'reverted'].includes(settlement.status) && (
                        <button type="button" className="app-btn app-btn-outline mt-3" onClick={handleRetrySettlement} disabled={retryMutation.isPending}>
                          <RefreshCw className="h-4 w-4" />
                          Retry Settlement
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
