'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { RiskBadge, StatusBadge } from '@/components/app/status-badge';
import {
  useApproveExecution,
  useExecution,
  useExecutionCompliance,
  useExecutionRisk,
  useExecutionSettlement,
  useExecutionTimeline,
} from '@/hooks/use-valen-api';
import { chainName } from '@/lib/constants';

export default function ExecutionDetailPage() {
  const params = useParams();
  const executionId = params.executionId as string;
  const { data: ex, isLoading, error } = useExecution(executionId);
  const { data: compliance } = useExecutionCompliance(executionId);
  const { data: risk } = useExecutionRisk(executionId);
  const { data: settlement } = useExecutionSettlement(executionId);
  const { data: timeline } = useExecutionTimeline(executionId);
  const approveMutation = useApproveExecution();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleApproval = async (decision: 'approved' | 'rejected') => {
    setActionError(null);
    try {
      await approveMutation.mutateAsync({
        executionId,
        body: { decision, reason: decision === 'approved' ? 'Approved via dashboard' : 'Rejected via dashboard' },
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/executions" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Executions
      </Link>

      <QueryState isLoading={isLoading} error={error} isEmpty={!ex}>
        {ex && (
          <>
            <PageHeader title={`Execution ${ex.id.slice(0, 8)}...`} description={`${ex.actionType} · ${chainName(ex.targetChainId)}`}>
              <StatusBadge status={ex.status} />
              {ex.status === 'approval_required' && (
                <>
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
            </PageHeader>

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="app-card lg:col-span-2">
                <h3 className="app-card-title mb-4">Pipeline Timeline</h3>
                {!timeline?.length ? (
                  <p className="text-sm text-[#64748b]">No timeline events recorded yet.</p>
                ) : (
                  <div className="space-y-0">
                    {timeline.map((step, i) => (
                      <div key={step.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-600">
                            {i + 1}
                          </div>
                          {i < timeline.length - 1 && <div className="min-h-[24px] w-px flex-1 bg-[#eef0f3]" />}
                        </div>
                        <div className="pb-6">
                          <p className="font-medium text-[#012b54]">{step.eventName}</p>
                          <p className="font-mono text-xs text-[#64748b]">{step.eventHash.slice(0, 16)}...</p>
                          <p className="text-sm text-[#64748b]">{new Date(step.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="app-card">
                  <h3 className="app-card-title mb-3">Intent Details</h3>
                  <dl className="app-detail-list">
                    <div><dt>Agent</dt><dd className="font-mono text-xs">{ex.agentId.slice(0, 12)}...</dd></div>
                    <div><dt>Target</dt><dd className="font-mono text-xs">{ex.targetAddress ?? '—'}</dd></div>
                    <div><dt>Payload Hash</dt><dd className="font-mono text-xs">{ex.requestPayloadHash.slice(0, 16)}...</dd></div>
                    <div><dt>Idempotency</dt><dd className="font-mono text-xs">{ex.idempotencyKey.slice(0, 16)}...</dd></div>
                  </dl>
                </div>

                {compliance && compliance.length > 0 && (
                  <div className="app-card">
                    <h3 className="app-card-title mb-3">Compliance</h3>
                    {compliance.map((c) => (
                      <div key={c.id} className="mb-2">
                        <span className="app-badge bg-emerald-50 text-emerald-600 capitalize">{c.status}</span>
                        <p className="mt-1 text-sm text-[#64748b]">{c.provider} · {c.reasonCode}</p>
                      </div>
                    ))}
                  </div>
                )}

                {risk && (
                  <div className="app-card">
                    <h3 className="app-card-title mb-3">Risk Score</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-[#012b54]">{risk.score}</span>
                      <RiskBadge tier={risk.tier} />
                    </div>
                    {risk.requiresApproval && (
                      <p className="mt-2 text-sm text-amber-600">Requires human approval</p>
                    )}
                  </div>
                )}

                {settlement && (
                  <div className="app-card">
                    <h3 className="app-card-title mb-3">Settlement</h3>
                    <dl className="app-detail-list">
                      <div><dt>Status</dt><dd className="capitalize">{settlement.status}</dd></div>
                      <div><dt>Tx Hash</dt><dd className="font-mono text-xs">{settlement.txHash ?? '—'}</dd></div>
                      <div><dt>Contract</dt><dd className="font-mono text-xs">{settlement.contractAddress.slice(0, 12)}...</dd></div>
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
