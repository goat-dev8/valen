'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { AgentStatusBadge, StatusBadge } from '@/components/app/status-badge';
import {
  useActivateAgent,
  useAgent,
  useCreateAgentApiKey,
  useExecutions,
  useLinkAgentWallet,
  usePolicies,
  useRevokeAgent,
  useSuspendAgent,
} from '@/hooks/use-valen-api';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  const reserved = agentId === 'new' || agentId === 'register';
  const { data: agent, isLoading, error } = useAgent(reserved ? '' : agentId);
  const { data: executions } = useExecutions({ agentId: reserved ? undefined : agentId, limit: 10 });
  const { data: policies } = usePolicies();
  const activateMutation = useActivateAgent();
  const suspendMutation = useSuspendAgent();
  const revokeMutation = useRevokeAgent();
  const linkWalletMutation = useLinkAgentWallet();
  const createApiKeyMutation = useCreateAgentApiKey();
  const [actionError, setActionError] = useState<string | null>(null);
  const [apiKeySecret, setApiKeySecret] = useState<string | null>(null);

  useEffect(() => {
    if (reserved) {
      router.replace('/dashboard/register-agent');
    }
  }, [reserved, router]);

  if (reserved) {
    return null;
  }

  const policyName = policies?.find((p) => p.id === agent?.defaultPolicyId)?.name;

  const handleSuspend = async () => {
    const reason = window.prompt('Reason for suspending this agent:');
    if (!reason?.trim()) return;
    setActionError(null);
    try {
      await suspendMutation.mutateAsync({ agentId, reason: reason.trim() });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Suspend failed');
    }
  };

  const handleRevoke = async () => {
    const reason = window.prompt('Reason for revoking this agent (irreversible):');
    if (!reason?.trim()) return;
    setActionError(null);
    try {
      await revokeMutation.mutateAsync({ agentId, reason: reason.trim() });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Revoke failed');
    }
  };

  const handleLinkWallet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    const form = new FormData(e.currentTarget);
    try {
      await linkWalletMutation.mutateAsync({
        agentId,
        body: {
          chainId: Number(form.get('chainId')),
          walletAddress: String(form.get('walletAddress')),
          walletType: String(form.get('walletType')),
          isPrimary: form.get('isPrimary') === 'on',
        },
      });
      e.currentTarget.reset();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Wallet link failed');
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    setApiKeySecret(null);
    const form = new FormData(e.currentTarget);
    try {
      const result = await createApiKeyMutation.mutateAsync({
        agentId,
        body: {
          name: String(form.get('keyName')),
          scopes: ['executions:create', 'executions:read'],
        },
      });
      if (result.oneTimeSecret) {
        setApiKeySecret(result.oneTimeSecret);
      }
      e.currentTarget.reset();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'API key creation failed');
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/agents" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </Link>

      <QueryState isLoading={isLoading} error={error} isEmpty={!agent}>
        {agent && (
          <>
            <PageHeader title={agent.name} description={`${agent.agentType} agent`}>
              <AgentStatusBadge status={agent.status} />
              {agent.status === 'draft' && (
                <button
                  type="button"
                  className="app-btn app-btn-primary"
                  disabled={activateMutation.isPending}
                  onClick={() => activateMutation.mutate(agent.id)}
                >
                  {activateMutation.isPending ? 'Activating...' : 'Activate Agent'}
                </button>
              )}
              {agent.status === 'active' && (
                <button type="button" className="app-btn app-btn-outline" onClick={handleSuspend} disabled={suspendMutation.isPending}>
                  Pause Agent
                </button>
              )}
              {agent.status !== 'revoked' && (
                <button type="button" className="app-btn app-btn-danger" onClick={handleRevoke} disabled={revokeMutation.isPending}>
                  Revoke Agent
                </button>
              )}
            </PageHeader>

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="app-card">
                <h3 className="app-card-title mb-3">Agent Profile</h3>
                <dl className="app-detail-list">
                  <div><dt>ID</dt><dd className="font-mono text-xs">{agent.id}</dd></div>
                  <div><dt>Type</dt><dd className="capitalize">{agent.agentType}</dd></div>
                  <div><dt>Default Policy</dt><dd>{policyName ?? agent.defaultPolicyId ?? '—'}</dd></div>
                  <div><dt>Description</dt><dd>{agent.description ?? '—'}</dd></div>
                  <div><dt>Created</dt><dd>{new Date(agent.createdAt).toLocaleString()}</dd></div>
                </dl>
              </div>

              <div className="app-card">
                <h3 className="app-card-title mb-3">Link Wallet</h3>
                <form onSubmit={handleLinkWallet} className="space-y-3">
                  <div className="app-form-group">
                    <label htmlFor="chainId">Chain</label>
                    <select id="chainId" name="chainId" className="app-input" required>
                      <option value={421614}>Arbitrum Sepolia</option>
                      <option value={46630}>Robinhood Testnet</option>
                    </select>
                  </div>
                  <div className="app-form-group">
                    <label htmlFor="walletAddress">Wallet Address</label>
                    <input id="walletAddress" name="walletAddress" className="app-input font-mono" placeholder="0x..." required />
                  </div>
                  <div className="app-form-group">
                    <label htmlFor="walletType">Wallet Type</label>
                    <select id="walletType" name="walletType" className="app-input" required>
                      <option value="eoa">EOA</option>
                      <option value="smart_wallet">Smart Wallet</option>
                      <option value="custodial">Custodial</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[#64748b]">
                    <input type="checkbox" name="isPrimary" defaultChecked />
                    Primary wallet for this chain
                  </label>
                  <button type="submit" className="app-btn app-btn-primary" disabled={linkWalletMutation.isPending}>
                    {linkWalletMutation.isPending ? 'Linking...' : 'Link Wallet'}
                  </button>
                </form>
              </div>
            </div>

            <div className="app-card">
              <h3 className="app-card-title mb-3">API Keys</h3>
              <p className="mb-4 text-sm text-[#64748b]">Issue scoped keys for programmatic agent access via Render API.</p>
              <form onSubmit={handleCreateApiKey} className="flex flex-wrap items-end gap-3">
                <div className="app-form-group min-w-[240px] flex-1">
                  <label htmlFor="keyName">Key Name</label>
                  <input id="keyName" name="keyName" className="app-input" placeholder="Production key" required />
                </div>
                <button type="submit" className="app-btn app-btn-primary" disabled={createApiKeyMutation.isPending}>
                  {createApiKeyMutation.isPending ? 'Creating...' : 'Create API Key'}
                </button>
              </form>
              {apiKeySecret && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-800">Copy this secret now — it will not be shown again.</p>
                  <code className="mt-2 block break-all font-mono text-xs text-amber-900">{apiKeySecret}</code>
                </div>
              )}
            </div>

            <div className="app-card">
              <h3 className="app-card-title mb-4">Recent Executions</h3>
              {!executions?.items.length ? (
                <p className="text-sm text-[#64748b]">No executions for this agent yet.</p>
              ) : (
                <div className="app-table-wrap">
                  <table className="app-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Action</th>
                        <th>Chain</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.items.map((ex) => (
                        <tr key={ex.id}>
                          <td>
                            <Link href={`/dashboard/executions/${ex.id}`} className="app-link font-mono text-xs">
                              {ex.id.slice(0, 8)}...
                            </Link>
                          </td>
                          <td className="capitalize">{ex.actionType.replace(/_/g, ' ')}</td>
                          <td><ChainBadge chainId={ex.targetChainId} /></td>
                          <td><StatusBadge status={ex.status} /></td>
                          <td className="text-[#64748b]">{new Date(ex.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
