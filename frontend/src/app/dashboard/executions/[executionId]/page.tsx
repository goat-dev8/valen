'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { ExecutionDetailView } from '@/components/execution/execution-detail-view';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
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
import { executionAssetSymbol, formatExecutionAmount } from '@/lib/execution-display';

export default function ExecutionDetailPage() {
  const params = useParams();
  const executionId = params.executionId as string;
  const { data: ex, isLoading, error } = useExecution(executionId);
  const { data: agent } = useAgent(ex?.agentId ?? '');
  const { data: compliance } = useExecutionCompliance(executionId, Boolean(ex));
  const { data: risk } = useExecutionRisk(executionId);
  const { data: settlement } = useExecutionSettlement(executionId, Boolean(ex));
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
        body: { decision, reason, approvalProofRef },
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

  return (
    <div className="space-y-6">
      <Link href="/dashboard/executions" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Executions
      </Link>

      <QueryState isLoading={isLoading} error={error} isEmpty={!ex}>
        {ex && (
          <>
            <PageHeader
              title={`Execution ${ex.id.slice(0, 8)}…`}
              description={`${executionAssetSymbol(ex)} · ${formatExecutionAmount(ex)} · ${ex.actionType}`}
            />
            <ExecutionDetailView
              ex={ex}
              agent={agent}
              compliance={compliance}
              risk={risk}
              settlement={settlement}
              timeline={timeline}
              actionError={actionError}
              approvalReason={approvalReason}
              onApprovalReasonChange={setApprovalReason}
              onApproval={handleApproval}
              onCancel={handleCancel}
              onRetrySettlement={handleRetrySettlement}
              approvePending={approveMutation.isPending}
              cancelPending={cancelMutation.isPending}
              retryPending={retryMutation.isPending}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}
