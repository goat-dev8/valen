'use client';

import Link from 'next/link';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { StatusBadge } from '@/components/app/status-badge';
import { useExecution, useExecutionSettlement, useRetrySettlement } from '@/hooks/use-valen-api';
import { explorerTxUrl } from '@/lib/explorer';

export function SettlementRow({
  executionId,
  executionStatus,
  createdAt,
}: {
  executionId: string;
  executionStatus: string;
  createdAt: string;
}) {
  const { data: execution } = useExecution(executionId);
  const { data: settlement, isLoading, error } = useExecutionSettlement(executionId);
  const retryMutation = useRetrySettlement();

  const handleRetry = async () => {
    if (!settlement) return;
    const reason = window.prompt('Reason for retry:');
    if (!reason?.trim()) return;
    await retryMutation.mutateAsync({ settlementId: settlement.id, reason: reason.trim() });
  };

  return (
    <tr>
      <td>
        <Link href={`/dashboard/executions/${executionId}`} className="app-link font-mono text-xs">
          {executionId.slice(0, 12)}...
        </Link>
      </td>
      <td>{execution && <ChainBadge chainId={execution.targetChainId} />}</td>
      <td><StatusBadge status={executionStatus} /></td>
      <td>
        {isLoading ? (
          <span className="text-sm text-[#64748b]">Loading...</span>
        ) : error ? (
          <span className="text-sm text-red-600">Error</span>
        ) : settlement ? (
          <span className={`app-badge capitalize ${
            settlement.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600'
            : settlement.status === 'failed' || settlement.status === 'reverted' ? 'bg-red-50 text-red-600'
            : 'bg-indigo-50 text-indigo-600'
          }`}>
            {settlement.status}
          </span>
        ) : (
          <span className="text-sm text-[#64748b]">Pending</span>
        )}
      </td>
      <td>
        {settlement?.txHash ? (
          <a
            href={explorerTxUrl(settlement.chainId, settlement.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="app-link inline-flex items-center gap-1 font-mono text-xs"
          >
            {settlement.txHash.slice(0, 12)}...
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="font-mono text-xs text-[#64748b]">—</span>
        )}
      </td>
      <td className="text-[#64748b]">{new Date(createdAt).toLocaleString()}</td>
      <td>
        {settlement && ['failed', 'reverted'].includes(settlement.status) && (
          <button type="button" className="app-btn app-btn-outline text-xs" onClick={handleRetry} disabled={retryMutation.isPending}>
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </td>
    </tr>
  );
}
