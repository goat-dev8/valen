'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { operatorFetch } from '@/lib/api';
import { keccak256, stringToHex, zeroHash } from 'viem';

export default function GovernanceLabPage() {
  const [chainId, setChainId] = useState('421614');
  const [target, setTarget] = useState('0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3');
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: status } = useQuery({
    queryKey: ['governance-status', chainId],
    queryFn: () => operatorFetch<Record<string, unknown>>(`governance/status?chainId=${chainId}`),
  });

  async function run(path: string, body: unknown) {
    setError(null);
    try {
      const response = await operatorFetch(path, { method: 'POST', body: JSON.stringify(body) });
      setResult(response);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const proposalHash = keccak256(stringToHex(`operator-proposal-${Date.now()}`));
  const metadataHash = keccak256(stringToHex(`operator-metadata-${Date.now()}`));
  const salt = keccak256(stringToHex(`operator-salt-${Date.now()}`));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Governance Lab</h1>
        <p className="mt-2 text-neutral-600">Register proposals and queue/execute timelock actions on live testnets.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Timelock status</CardTitle></CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded bg-neutral-100 p-3 text-xs">{JSON.stringify(status, null, 2)}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={chainId} onChange={(e) => setChainId(e.target.value)} placeholder="Chain ID" />
          <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target address" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run('governance/proposal', { chainId: Number(chainId), proposalHash, metadataHash })}>
              Create proposal
            </Button>
            <Button variant="outline" onClick={() => run('governance/queue', {
              chainId: Number(chainId),
              target,
              valueWei: '0',
              data: '0x',
              predecessor: zeroHash,
              salt,
              delay: 1,
            })}>
              Queue proposal
            </Button>
            <Button variant="secondary" onClick={() => run('governance/execute', {
              chainId: Number(chainId),
              target,
              valueWei: '0',
              data: '0x',
              predecessor: zeroHash,
              salt,
            })}>
              Execute proposal
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-red-600">{error}</p>}
      {result !== null && (
        <Card>
          <CardHeader><CardTitle>Result</CardTitle></CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded bg-neutral-950 p-4 text-xs text-neutral-100">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
