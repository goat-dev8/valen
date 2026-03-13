'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/app/status-badge';
import { useExecutionSettlement } from '@/hooks/use-valen-api';

export function SettlementRow({
  executionId,
  executionStatus,
  createdAt,
}: {
  executionId: string;
  executionStatus: string;
  createdAt: string;
}) {
  const { data: settlement, isLoading } = useExecutionSettlement(executionId);

  return (
    <tr>
      <td>
        <Link href={`/dashboard/executions/${executionId}`} className="app-link font-mono text-xs">
          {executionId.slice(0, 12)}...
        </Link>
      </td>
      <td><StatusBadge status={executionStatus} /></td>
      <td>
        {isLoading ? (
          <span className="text-sm text-[#64748b]">Loading...</span>
        ) : settlement ? (
          <span className={`app-badge capitalize ${settlement.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : settlement.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
            {settlement.status}
          </span>
        ) : (
          <span className="text-sm text-[#64748b]">—</span>
        )}
      </td>
      <td className="font-mono text-xs text-[#007dfc]">{settlement?.txHash?.slice(0, 12) ?? '—'}...</td>
      <td className="text-[#64748b]">{new Date(createdAt).toLocaleString()}</td>
    </tr>
  );
}
