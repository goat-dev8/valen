'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { operatorFetch } from '@/lib/api';

export default function TreasuryPage() {
  const [chainId, setChainId] = useState('421614');

  const { data, error, isLoading } = useQuery({
    queryKey: ['operator-treasury', chainId],
    queryFn: () => operatorFetch<Record<string, unknown>>(`treasury?chainId=${chainId}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Treasury Panel</h1>
          <p className="mt-2 text-neutral-600">Live treasury balances and fee accrual from deployed contracts.</p>
        </div>
        <Select value={chainId} onValueChange={setChainId}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="421614">Arbitrum Sepolia</SelectItem>
            <SelectItem value="46630">Robinhood Testnet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p>Reading treasury state…</p>}
      {error && <p className="text-red-600">{(error as Error).message}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Native balance</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{String(data?.nativeBalanceEth ?? '—')} ETH</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Accrued fees</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{String(data?.accruedFeesWei ?? '—')} wei</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Collected fees</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{String(data?.collectedFeesWei ?? '—')} wei</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Raw treasury read</CardTitle></CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded bg-neutral-100 p-3 text-xs">{JSON.stringify(data, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
