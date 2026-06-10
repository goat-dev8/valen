'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { operatorFetch } from '@/lib/api';

const TABLES = [
  'organizations',
  'agents',
  'agent_wallets',
  'executions',
  'settlements',
  'compliance_checks',
  'risk_scores',
  'audit_logs',
];

export default function DatabasePage() {
  const [table, setTable] = useState('executions');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['operator-db', table, page, search],
    queryFn: () =>
      operatorFetch<{ rows: Record<string, unknown>[]; total: number; page: number; limit: number }>(
        `database/${table}?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`,
      ),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Panel</h1>
        <p className="mt-2 text-neutral-600">Live Supabase PostgreSQL reads with pagination and search.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Query controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Select value={table} onValueChange={(v) => { setTable(v); setPage(1); }}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TABLES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Search id/metadata" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Button onClick={() => refetch()}>Search</Button>
        </CardContent>
      </Card>

      {isLoading && <p>Loading {table}…</p>}
      {error && <p className="text-red-600">{(error as Error).message}</p>}

      {data && (
        <>
          <p className="text-sm text-neutral-500">Total rows: {data.total}</p>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(data.rows[0] ?? { id: '' }).slice(0, 8).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={String(row.id)} className="cursor-pointer" onClick={() => setSelectedRow(row)}>
                      {Object.keys(data.rows[0] ?? { id: '' }).slice(0, 8).map((key) => (
                        <TableCell key={key} className="max-w-[200px] truncate">
                          {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </>
      )}

      {selectedRow && (
        <Card>
          <CardHeader><CardTitle>Row inspection</CardTitle></CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded bg-neutral-950 p-4 text-xs text-neutral-100">{JSON.stringify(selectedRow, null, 2)}</pre>
            <Button className="mt-3" variant="secondary" onClick={() => setSelectedRow(null)}>Close</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
