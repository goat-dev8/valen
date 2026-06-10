'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { operatorFetch } from '@/lib/api';

export default function StylusPage() {
  const [chainId, setChainId] = useState('421614');

  const { data, error, isLoading } = useQuery({
    queryKey: ['operator-stylus', chainId],
    queryFn: () => operatorFetch<{ engines: Array<Record<string, unknown>> }>(`stylus?chainId=${chainId}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Stylus Panel</h1>
          <p className="mt-2 text-neutral-600">Live Stylus engine registration, authorized caller, and health checks.</p>
        </div>
        <Select value={chainId} onValueChange={setChainId}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="421614">Arbitrum Sepolia</SelectItem>
            <SelectItem value="46630">Robinhood Testnet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p>Reading Stylus engine state…</p>}
      {error && <p className="text-red-600">{(error as Error).message}</p>}

      <Card>
        <CardHeader><CardTitle>Engines</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Engine</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Registry</TableHead>
                <TableHead>Registry version</TableHead>
                <TableHead>Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.engines ?? []).map((e) => (
                <TableRow key={String(e.name)}>
                  <TableCell>{String(e.name)}</TableCell>
                  <TableCell className="font-mono text-xs">{String(e.address)}</TableCell>
                  <TableCell>{String(e.deployedVersion)}</TableCell>
                  <TableCell>
                    <Badge variant={e.registryRegistered ? 'success' : 'error'}>
                      {e.registryRegistered ? 'registered' : 'missing'}
                    </Badge>
                  </TableCell>
                  <TableCell>{String(e.registryVersion ?? '—')}</TableCell>
                  <TableCell>
                    <Badge variant={e.healthy ? 'success' : 'error'}>{e.healthy ? 'healthy' : 'unhealthy'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
