'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { operatorFetch } from '@/lib/api';

export default function SettlementLabPage() {
  const [organizationId, setOrganizationId] = useState('');
  const [executionId, setExecutionId] = useState('');
  const [chainId, setChainId] = useState('421614');
  const [settlementId, setSettlementId] = useState('');
  const [callData, setCallData] = useState('0x');
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(action: string, body?: unknown) {
    setLoading(true);
    setError(null);
    try {
      let path = action;
      if (action.startsWith('trigger/')) {
        path = `organizations/${organizationId}/executions/${executionId}/${action}`;
      } else if (action === 'create') {
        path = `organizations/${organizationId}/executions`;
      } else {
        path = `settlement/onchain/${action}`;
      }
      const response = await operatorFetch(path, {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      });
      setResult(response);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submitOnChain() {
    const raw = window.prompt('Submit payload JSON');
    if (!raw) return;
    await run('submit', { chainId: Number(chainId), payload: JSON.parse(raw) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settlement Test Lab</h1>
        <p className="mt-2 text-neutral-600">Drive backend pipeline and on-chain settlement on live testnets.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Execution context</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Organization UUID" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} />
          <Input placeholder="Execution UUID" value={executionId} onChange={(e) => setExecutionId(e.target.value)} />
          <Input placeholder="Chain ID" value={chainId} onChange={(e) => setChainId(e.target.value)} />
          <Input placeholder="Settlement ID (bytes32)" value={settlementId} onChange={(e) => setSettlementId(e.target.value)} />
          <Input placeholder="Call data" value={callData} onChange={(e) => setCallData(e.target.value)} className="md:col-span-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Backend pipeline</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={() => run('create', {
            agentId: prompt('Agent UUID') ?? '',
            idempotencyKey: `operator-${Date.now()}`,
            actionType: 'transfer',
            targetChainId: Number(chainId),
            targetAddress: '0xf76e6B0920e9332fF4410f6dD53F01722AbC71a3',
            amount: '1000000000000000',
            payloadHash: '0x' + '11'.repeat(32),
            metadata: { onchain: {} },
          })}>Create execution</Button>
          {['intent', 'compliance', 'risk', 'policy', 'settlement'].map((stage) => (
            <Button key={stage} variant="outline" disabled={loading || !organizationId || !executionId} onClick={() => run(`trigger/${stage}`)}>
              Trigger {stage}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>On-chain settlement</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={loading} onClick={submitOnChain}>
            Submit settlement
          </Button>
          <Button variant="secondary" disabled={loading || !settlementId} onClick={() => run('approve', { chainId: Number(chainId), settlementId })}>
            Approve settlement
          </Button>
          <Button variant="secondary" disabled={loading || !settlementId} onClick={() => run('execute', { chainId: Number(chainId), settlementId, callData, valueWei: '1000000000000000' })}>
            Execute settlement
          </Button>
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
