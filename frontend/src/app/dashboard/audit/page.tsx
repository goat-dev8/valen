'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { operatorFetch } from '@/lib/api';
import { formatTimestamp } from '@/lib/utils';

export default function AuditPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['operator-audit'],
    queryFn: () => operatorFetch<{
      databaseAuditLogs: Array<Record<string, unknown>>;
      recentExecutions: Array<Record<string, unknown>>;
    }>('audit?limit=50'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Panel</h1>
        <p className="mt-2 text-neutral-600">Database audit records correlated with recent execution history.</p>
      </div>

      {isLoading && <p>Loading audit records…</p>}
      {error && <p className="text-red-600">{(error as Error).message}</p>}

      <Card>
        <CardHeader><CardTitle>Database audit logs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Tx hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.databaseAuditLogs ?? []).map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell>{formatTimestamp(String(row.created_at))}</TableCell>
                  <TableCell>{String(row.action)}</TableCell>
                  <TableCell>{String(row.entity_type)}:{String(row.entity_id).slice(0, 8)}…</TableCell>
                  <TableCell className="font-mono text-xs">{String(row.tx_hash ?? '—')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent executions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.recentExecutions ?? []).map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell className="font-mono text-xs">{String(row.id)}</TableCell>
                  <TableCell>{String(row.status)}</TableCell>
                  <TableCell>{String(row.target_chain_id)}</TableCell>
                  <TableCell>{formatTimestamp(String(row.created_at))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
