'use client';

import Link from 'next/link';
import { useWallets } from '@privy-io/react-auth';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { useAgents, useApproveExecution, useExecutions } from '@/hooks/use-valen-api';
import { signApprovalProof } from '@/lib/approval-signature';
import { chainName } from '@/lib/constants';

export default function ApprovalsPage() {
  const { data, isLoading, error, refetch } = useExecutions({ status: 'approval_required', limit: 50 });
  const { data: agents } = useAgents({ limit: 100 });
  const { wallets } = useWallets();
  const approveMutation = useApproveExecution();
  const [actionError, setActionError] = useState<string | null>(null);
  const agentMap = new Map(agents?.items.map((a) => [a.id, a.name]) ?? []);

  const handleApproval = async (executionId: string, decision: 'approved' | 'rejected') => {
    setActionError(null);
    const execution = data?.items.find((item) => item.id === executionId);
    if (!execution) return;
    const reason = decision === 'approved' ? 'Approved via signed approval queue' : 'Rejected via signed approval queue';
    try {
      const approvalProofRef = await signApprovalProof({
        wallet: wallets[0],
        execution,
        decision,
        reason,
      });
      await approveMutation.mutateAsync({
        executionId,
        body: { decision, reason, approvalProofRef },
      });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Approval Queue" description="Human oversight required for high-risk agent intents" />
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <QueryState isLoading={isLoading} error={error} isEmpty={!data?.items.length} emptyMessage="No pending approvals">
        <div className="space-y-4">
          {data?.items.map((item) => (
            <div key={item.id} className="app-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link href={`/dashboard/executions/${item.id}`} className="app-link text-lg font-semibold">
                    {item.id.slice(0, 12)}...
                  </Link>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {agentMap.get(item.agentId) ?? item.agentId.slice(0, 8)} · {item.actionType.replace(/_/g, ' ')} · {chainName(item.targetChainId)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#64748b]">
                    <span className="rounded-full bg-[#f8fafc] px-3 py-1">Mandate: {item.mandateId?.slice(0, 8) ?? 'missing'}</span>
                    <span className="rounded-full bg-[#f8fafc] px-3 py-1">Policy: {item.policyId?.slice(0, 8) ?? 'agent default'}</span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Wallet signature required</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" className="app-btn app-btn-success" onClick={() => handleApproval(item.id, 'approved')} disabled={approveMutation.isPending}>
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                  <button type="button" className="app-btn app-btn-danger" onClick={() => handleApproval(item.id, 'rejected')} disabled={approveMutation.isPending}>
                    <X className="h-4 w-4" />
                    Deny
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </div>
  );
}
