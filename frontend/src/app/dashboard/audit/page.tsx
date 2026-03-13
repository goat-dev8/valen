'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { useAuditExport, useAuditLogs } from '@/hooks/use-valen-api';

const AUDIT_ACTIONS = [
  'execution.attested',
  'settlement.submit',
  'settlement.approve',
  'settlement.executed',
  'settlement.failed',
];

export default function AuditPage() {
  const { data, isLoading, error } = useAuditLogs({ limit: 100 });
  const exportMutation = useAuditExport();
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filtered = actionFilter === 'all'
    ? data?.items ?? []
    : (data?.items ?? []).filter((log) => log.action === actionFilter);

  const handleExport = async () => {
    setExportMsg(null);
    try {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      const result = await exportMutation.mutateAsync({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        format: 'json',
        entityTypes: ['execution', 'settlement', 'policy'],
      });
      setExportMsg(`Export ${result.exportId} started — ${result.recordCount} records (${result.status})`);
    } catch (err) {
      setExportMsg(err instanceof Error ? err.message : 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Immutable evidence trail for compliance and regulatory export">
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="app-input w-auto">
          <option value="all">All actions</option>
          {AUDIT_ACTIONS.map((action) => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
        <button type="button" className="app-btn app-btn-primary" onClick={handleExport} disabled={exportMutation.isPending}>
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </PageHeader>

      {exportMsg && <p className="text-sm text-[#64748b]">{exportMsg}</p>}

      <QueryState isLoading={isLoading} error={error} isEmpty={!filtered.length} emptyMessage="No audit logs found">
        <div className="app-card">
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Event Hash</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="capitalize">{log.actorType.replace(/_/g, ' ')}</td>
                    <td className="font-mono text-xs">{log.action}</td>
                    <td className="font-mono text-xs">{log.entityType}:{log.entityId.slice(0, 8)}...</td>
                    <td className="font-mono text-xs text-[#64748b]">{log.eventHash.slice(0, 12)}...</td>
                    <td className="text-[#64748b]">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </QueryState>
    </div>
  );
}
