'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { keccak256, toHex } from 'viem';
import { PageHeader } from '@/components/app/page-header';
import { useAgents, useCreateExecution } from '@/hooks/use-valen-api';

export default function SubmitIntentPage() {
  const router = useRouter();
  const { data: agents, isLoading: agentsLoading } = useAgents({ limit: 100, status: 'active' });
  const createMutation = useCreateExecution();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const agentId = formData.get('agentId') as string;
    const actionType = formData.get('actionType') as string;
    const targetChainId = Number(formData.get('targetChainId'));
    const targetAddress = formData.get('targetAddress') as string;
    const amount = formData.get('amount') as string;

    const payload = JSON.stringify({
      actionType,
      targetChainId,
      targetAddress,
      amount: amount || null,
      submittedAt: new Date().toISOString(),
    });
    const payloadHash = keccak256(toHex(payload));
    const idempotencyKey = `dashboard-${agentId.slice(0, 8)}-${Date.now()}`;

    try {
      const result = await createMutation.mutateAsync({
        agentId,
        idempotencyKey,
        actionType,
        targetChainId,
        targetAddress,
        amount: amount || undefined,
        payloadHash,
        metadata: { source: 'dashboard', payloadPreview: payload },
      });
      router.push(`/dashboard/executions/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit intent');
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/executions" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Executions
      </Link>

      <PageHeader title="Submit Intent" description="Submit an agent intent for compliance, risk, policy, and on-chain settlement via Render API" />

      <div className="app-card max-w-2xl">
        {agentsLoading ? (
          <p className="text-sm text-[#64748b]">Loading agents...</p>
        ) : !agents?.items.length ? (
          <p className="text-sm text-[#64748b]">
            No active agents. <Link href="/dashboard/register-agent" className="app-link">Register an agent</Link> first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="app-form-group">
            <label htmlFor="agent">Agent</label>
            <select id="agent" name="agentId" className="app-input" required>
              {agents?.items.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="app-form-group">
            <label htmlFor="action">Action Type</label>
            <select id="action" name="actionType" className="app-input" required>
              <option value="transfer">Transfer</option>
              <option value="swap">Swap</option>
              <option value="contract_call">Contract Call</option>
              <option value="rebalance">Rebalance</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="app-form-group">
              <label htmlFor="chain">Chain</label>
              <select id="chain" name="targetChainId" className="app-input" required>
                <option value={421614}>Arbitrum Sepolia</option>
                <option value={46630}>Robinhood Testnet</option>
              </select>
            </div>
            <div className="app-form-group">
              <label htmlFor="amount">Amount</label>
              <input id="amount" name="amount" type="text" placeholder="0.00" className="app-input" />
            </div>
          </div>
          <div className="app-form-group">
            <label htmlFor="target">Target Address</label>
            <input id="target" name="targetAddress" type="text" placeholder="0x..." className="app-input font-mono" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="app-btn app-btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Submitting...' : 'Submit for Evaluation'}
          </button>
          </form>
        )}
      </div>
    </div>
  );
}
