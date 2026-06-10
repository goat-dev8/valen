'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { operatorFetch } from '@/lib/api';

export default function ContractsPage() {
  const [chainId, setChainId] = useState('421614');

  const { data, error, isLoading } = useQuery({
    queryKey: ['operator-contracts', chainId],
    queryFn: () => operatorFetch<{ contracts: Array<Record<string, unknown>> }>(`contracts?chainId=${chainId}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contract Panel</h1>
          <p className="mt-2 text-neutral-600">Live deployed Solidity contracts with bytecode, pause, and admin checks.</p>
        </div>
        <Select value={chainId} onValueChange={setChainId}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="421614">Arbitrum Sepolia</SelectItem>
            <SelectItem value="46630">Robinhood Testnet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p>Reading on-chain contract state…</p>}
      {error && <p className="text-red-600">{(error as Error).message}</p>}

      <Card>
        <CardHeader><CardTitle>Deployed contracts</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Bytecode</TableHead>
                <TableHead>Paused</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.contracts ?? []).map((c) => (
                <TableRow key={String(c.name)}>
                  <TableCell>{String(c.name)}</TableCell>
                  <TableCell className="font-mono text-xs">{String(c.address)}</TableCell>
                  <TableCell>
                    <Badge variant={c.bytecodeExists ? 'success' : 'error'}>
                      {c.bytecodeExists ? 'yes' : 'no'}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.paused === null ? 'n/a' : c.paused ? 'paused' : 'active'}</TableCell>
                  <TableCell className="font-mono text-xs">{String(c.ownerOrAdmin ?? '—')}</TableCell>
                  <TableCell>{String(c.version)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
