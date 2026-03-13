'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { PipelineTimeline } from '@/components/app/pipeline-timeline';
import { QueryState } from '@/components/app/query-state';
import { StatusBadge } from '@/components/app/status-badge';
import {
  useExecution,
  useExecutionCompliance,
  useExecutionRisk,
  useExecutionSettlement,
  useExecutionTimeline,
} from '@/hooks/use-valen-api';
import { explorerTxUrl } from '@/lib/explorer';

function TxLink({ chainId, txHash, label }: { chainId: number; txHash?: string | null; label: string }) {
  if (!txHash) return <span className="text-[#64748b]">{label}: unavailable</span>;
  return (
    <a href={explorerTxUrl(chainId, txHash)} target="_blank" rel="noreferrer" className="app-link inline-flex items-center gap-1">
      {label}: {txHash.slice(0, 14)}...
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export default function ExecutionProofPage() {
  const params = useParams();
  const executionId = params.executionId as string;
  const { data: execution, isLoading, error } = useExecution(executionId);
  const { data: compliance } = useExecutionCompliance(executionId);
  const { data: risk } = useExecutionRisk(executionId);
  const { data: settlement } = useExecutionSettlement(executionId);
  const { data: timeline } = useExecutionTimeline(executionId);

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/executions/${executionId}`} className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Execution
      </Link>

      <QueryState isLoading={isLoading} error={error} isEmpty={!execution}>
        {execution && (
          <>
            <PageHeader
              title={`Proof ${execution.id.slice(0, 8)}...`}
              description="VALEN operator-relayed proof transaction and audit trail. User wallet signatures are shown only where the user actually signed."
            >
              <ChainBadge chainId={execution.targetChainId} />
              <StatusBadge status={execution.status} />
            </PageHeader>

            <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
              <div className="app-card">
                <h3 className="app-card-title mb-4">Pipeline Proof</h3>
                <PipelineTimeline events={timeline} status={execution.status} />
              </div>

              <div className="space-y-5">
                <div className="app-card">
                  <h3 className="app-card-title mb-3">Authority</h3>
                  <dl className="app-detail-list">
                    <div><dt>Agent</dt><dd className="font-mono text-xs break-all">{execution.agentId}</dd></div>
                    <div><dt>Mandate</dt><dd className="font-mono text-xs break-all">{execution.mandateId ?? 'Unavailable'}</dd></div>
                    <div><dt>Policy</dt><dd className="font-mono text-xs break-all">{execution.policyId ?? 'Agent default'}</dd></div>
                    <div><dt>Payload Hash</dt><dd className="font-mono text-xs break-all">{execution.requestPayloadHash}</dd></div>
                  </dl>
                </div>

                <div className="app-card">
                  <h3 className="app-card-title mb-3">Verdicts</h3>
                  <dl className="app-detail-list">
                    <div><dt>Compliance Checks</dt><dd>{compliance?.length ?? 0}</dd></div>
                    <div><dt>Risk Score</dt><dd>{risk ? `${risk.score} (${risk.tier})` : 'Unavailable'}</dd></div>
                    <div><dt>Approval Required</dt><dd>{risk?.requiresApproval ? 'Yes' : 'No or unavailable'}</dd></div>
                  </dl>
                </div>

                <div className="app-card">
                  <h3 className="app-card-title mb-3">Settlement Proof</h3>
                  {!settlement ? (
                    <p className="text-sm text-[#64748b]">Settlement proof is not available yet.</p>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <p className="font-medium text-[#012b54]">VALEN operator-relayed proof transaction</p>
                      <TxLink chainId={settlement.chainId} txHash={settlement.submitTxHash} label="Submit tx" />
                      <TxLink chainId={settlement.chainId} txHash={settlement.approveTxHash} label="Approve tx" />
                      <TxLink chainId={settlement.chainId} txHash={settlement.txHash} label="Execute tx" />
                      <dl className="app-detail-list pt-2">
                        <div><dt>Block</dt><dd>{settlement.blockNumber ?? 'Unavailable'}</dd></div>
                        <div><dt>On-chain Settlement ID</dt><dd className="font-mono text-xs break-all">{settlement.onChainSettlementId ?? 'Unavailable'}</dd></div>
                        <div><dt>Failure Reason</dt><dd>{settlement.failureReason ?? 'None'}</dd></div>
                        <div><dt>Relayer</dt><dd>{settlement.relayerAddress ?? 'VALEN operator relayer'}</dd></div>
                      </dl>
                    </div>
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
