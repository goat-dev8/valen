'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { BudgetMeter } from '@/components/app/budget-meter';
import { IdentityCard } from '@/components/agents/identity-card';
import { GovernanceCrewDiagram } from '@/components/agents/governance-crew-diagram';
import { TechnicalDisclosure } from '@/components/ui/technical-disclosure';
import { PageHeader } from '@/components/app/page-header';
import { QueryState } from '@/components/app/query-state';
import { AgentStatusBadge, StatusBadge } from '@/components/app/status-badge';
import {
  useActivateAgent,
  useAgent,
  useAgentIdentity,
  useAgentApiKeys,
  useCreateAgentApiKey,
  useExecutions,
  useLinkAgentWallet,
  useMandates,
  usePolicies,
  useRevokeAgent,
  useSuspendAgent,
  useUpdateAgent,
  useWalletVerifications,
} from '@/hooks/use-valen-api';
import { formatApiErrorMessage, normalizeEvmAddressInput } from '@/lib/utils';
import { agentReadinessSummary, buildAgentReadinessSteps } from '@/lib/agent-readiness';
import { agentTypeLabel, agentTypeOption } from '@/lib/agent-types';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = params.agentId as string;
  const welcome = searchParams.get('welcome') === '1';
  const reserved = agentId === 'new' || agentId === 'register';
  const { data: agent, isLoading, error } = useAgent(reserved ? '' : agentId);
  const { data: identity } = useAgentIdentity(reserved ? '' : agentId);
  const { data: executions } = useExecutions({ agentId: reserved ? undefined : agentId, limit: 10 });
  const { data: policies } = usePolicies();
  const { data: walletVerifications } = useWalletVerifications();
  const { data: mandates } = useMandates();
  const { data: apiKeys } = useAgentApiKeys(reserved ? '' : agentId);
  const activateMutation = useActivateAgent();
  const suspendMutation = useSuspendAgent();
  const revokeMutation = useRevokeAgent();
  const linkWalletMutation = useLinkAgentWallet();
  const createApiKeyMutation = useCreateAgentApiKey();
  const updateAgentMutation = useUpdateAgent();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [apiKeySecret, setApiKeySecret] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(welcome);
  const [tab, setTab] = useState<'overview' | 'policy' | 'keys' | 'activity'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'policy' as const, label: 'Policy & Authority' },
    { id: 'keys' as const, label: 'API Keys' },
    { id: 'activity' as const, label: 'Activity' },
  ];

  useEffect(() => {
    if (reserved) {
      router.replace('/dashboard/agents/studio');
    }
  }, [reserved, router]);

  useEffect(() => {
    setShowWelcome(welcome);
  }, [welcome]);

  const policyName = policies?.find((p) => p.id === agent?.defaultPolicyId)?.name;
  const agentMandates =
    mandates?.filter((mandate) => mandate.agentId === agentId && mandate.status === 'active') ?? [];
  const mandateBoundApiKeys =
    apiKeys?.filter(
      (apiKey) =>
        apiKey.status === 'active' &&
        apiKey.mandateId &&
        agentMandates.some((mandate) => mandate.id === apiKey.mandateId),
    ) ?? [];
  const hasVerifiedWallet = walletVerifications?.some((wallet) => wallet.status === 'verified') ?? false;
  const typeMeta = agent ? agentTypeOption(agent.agentType) : null;
  const capabilities = Array.isArray(agent?.metadata?.capabilities)
    ? agent.metadata.capabilities.filter((item): item is string => typeof item === 'string')
    : [];
  const readinessSteps = agent
    ? buildAgentReadinessSteps({
        agentId,
        agentStatus: agent.status,
        agentType: agent.agentType,
        defaultPolicyId: agent.defaultPolicyId,
        policyName,
        hasVerifiedWallet,
        mandateCount: agentMandates.length,
        mandateBoundApiKeyCount: mandateBoundApiKeys.length,
      })
    : [];
  const { completeRequired, totalRequired, readinessComplete, nextStep } = agentReadinessSummary(readinessSteps);
  const apiKeysOpenByDefault = Boolean(typeMeta?.requiresApiKey && mandateBoundApiKeys.length === 0);

  if (reserved) {
    return null;
  }

  const handleSuspend = async () => {
    const reason = window.prompt('Reason for suspending this agent:');
    if (!reason?.trim()) return;
    setActionError(null);
    try {
      await suspendMutation.mutateAsync({ agentId, reason: reason.trim() });
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Suspend failed'));
    }
  };

  const handleRevoke = async () => {
    const reason = window.prompt('Reason for revoking this agent (irreversible):');
    if (!reason?.trim()) return;
    setActionError(null);
    try {
      await revokeMutation.mutateAsync({ agentId, reason: reason.trim() });
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Revoke failed'));
    }
  };

  const handleLinkWallet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const walletAddress = normalizeEvmAddressInput(String(form.get('walletAddress') ?? ''));
    if (!walletAddress) {
      setActionError('Enter a valid EVM wallet address (0x followed by 40 hex characters).');
      return;
    }

    const payload = {
      chainId: Number(form.get('chainId')),
      walletAddress,
      walletType: String(form.get('walletType')),
      isPrimary: form.get('isPrimary') === 'on',
    };

    try {
      await linkWalletMutation.mutateAsync({ agentId, body: payload });
      formEl.reset();
      setActionSuccess('Wallet linked successfully.');
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Wallet link failed'));
    }
  };

  const handleAssignPolicy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    const form = new FormData(e.currentTarget);
    const defaultPolicyId = String(form.get('defaultPolicyId') || '');
    if (!defaultPolicyId) {
      setActionError('Select a policy to assign.');
      return;
    }
    try {
      await updateAgentMutation.mutateAsync({
        agentId,
        body: { defaultPolicyId },
      });
      setActionSuccess('Default policy assigned to agent.');
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Policy assignment failed'));
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError(null);
    setApiKeySecret(null);

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const keyName = String(form.get('keyName'));

    try {
      const result = await createApiKeyMutation.mutateAsync({
        agentId,
        body: {
          name: keyName,
          scopes: ['executions:write', 'executions:read'],
          mandateId: String(form.get('mandateId') || '') || undefined,
        },
      });
      if (result.oneTimeSecret) {
        setApiKeySecret(result.oneTimeSecret);
      }
      formEl.reset();
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'API key creation failed'));
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
            <PageHeader
              title={agent.name}
              description={`${agentTypeLabel(agent.agentType)} agent · ${typeMeta?.tagline ?? 'Governed autonomous actor'}`}
            >
              <AgentStatusBadge status={agent.status} />
              {agent.publicSlug && (
                <Link href={`/agents/${agent.publicSlug}`} className="app-btn app-btn-outline">
                  Public profile
                </Link>
              )}
              {readinessComplete ? (
                <Link href={`/dashboard/executions/new?agentId=${agent.id}`} className="app-btn app-btn-primary">
                  Governed Intent
                </Link>
              ) : (
                <Link href={`/dashboard/agents/studio?agentId=${agent.id}&step=2`} className="app-btn app-btn-outline">
                  Continue in Studio
                </Link>
              )}
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
            {actionSuccess && <p className="text-sm text-emerald-600">{actionSuccess}</p>}

            {showWelcome && typeMeta && (
              <div className="app-card border-[#cfe6ff] bg-[#f8fbff]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#007dfc]" />
                      <h3 className="app-card-title">Agent registered</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">
                      {agent.name} is active as a {typeMeta.label.toLowerCase()} agent. Complete the readiness checklist
                      below{typeMeta.requiresApiKey ? ', including a mandate-bound API key,' : ''} before submitting intents.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="app-btn app-btn-outline shrink-0"
                    onClick={() => setShowWelcome(false)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <nav className="flex flex-wrap gap-2 border-b border-[#eef0f3] pb-4" aria-label="Agent sections">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    tab === item.id
                      ? 'border-[#007dfc] bg-[#e8f4ff] text-[#007dfc]'
                      : 'border-[#eef0f3] bg-white text-[#64748b] hover:border-[#cfe6ff]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {(tab === 'overview' || tab === 'policy') && (
            <div className="app-card">
              <div className="app-card-header">
                <div>
                  <h3 className="app-card-title">Agent Readiness</h3>
                  <p className="mt-1 text-sm text-[#64748b]">
                    Submit Intent unlocks once the agent is active with policy, verified wallet, and signed mandate
                    {typeMeta?.requiresApiKey ? ', plus a mandate-bound API key for programmatic agents.' : '.'}
                  </p>
                </div>
                <span className={`wallet-status wallet-status-${readinessComplete ? 'ok' : 'warn'}`}>
                  {completeRequired}/{totalRequired}
                </span>
              </div>
              {nextStep && !readinessComplete && (
                <div className="mt-4 rounded-2xl border border-[#cfe6ff] bg-[#f8fbff] p-4">
                  <p className="text-sm font-semibold text-[#012b54]">Next step: {nextStep.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#64748b]">{nextStep.detail}</p>
                  <Link href={nextStep.href} className="app-btn app-btn-primary mt-3 inline-flex">
                    Continue setup
                  </Link>
                </div>
              )}
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {readinessSteps.map((step) => (
                  <Link
                    key={step.label}
                    href={step.href}
                    className={`rounded-2xl border p-4 transition hover:border-[#cfe6ff] ${step.optional ? 'border-dashed' : 'border-[#eef0f3]'}`}
                  >
                    {step.complete ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-[#94a3b8]" />
                    )}
                    <p className="mt-3 text-sm font-semibold text-[#012b54]">
                      {step.label}
                      {step.optional && <span className="ml-1 text-xs font-normal text-[#94a3b8]">(optional)</span>}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#64748b]">{step.detail}</p>
                  </Link>
                ))}
              </div>
            </div>
            )}

            {tab === 'overview' && (
            <>
            <GovernanceCrewDiagram />
            <BudgetMeter agentId={agent.id} showTopup chainId={421614} />

            <div className="grid gap-5 lg:grid-cols-2">
              <IdentityCard
                agentId={agent.id}
                agentName={agent.name}
                publicSlug={agent.publicSlug}
                identity={identity}
              />

              <div className="app-card">
                <h3 className="app-card-title mb-3">Agent Profile</h3>
                <dl className="app-detail-list">
                  <div>
                    <dt>Type</dt>
                    <dd>
                      <span className="font-medium text-[#012b54]">{agentTypeLabel(agent.agentType)}</span>
                      <p className="mt-1 text-xs leading-5 text-[#64748b]">{typeMeta?.description}</p>
                    </dd>
                  </div>
                  <div>
                    <dt>Capabilities</dt>
                    <dd>
                      {capabilities.length ? (
                        <div className="flex flex-wrap gap-2">
                          {capabilities.map((capability) => (
                            <span
                              key={capability}
                              className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs font-medium capitalize text-[#012b54]"
                            >
                              {capability.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div><dt>Default Policy</dt><dd>{policyName ?? agent.defaultPolicyId ?? '—'}</dd></div>
                  <div><dt>Description</dt><dd>{agent.description ?? '—'}</dd></div>
                  <div><dt>Created</dt><dd>{new Date(agent.createdAt).toLocaleString()}</dd></div>
                </dl>
              </div>
            </div>
            <TechnicalDisclosure title="Technical agent ID">
              <p className="font-mono text-xs break-all text-[#1A2332]">{agent.id}</p>
            </TechnicalDisclosure>
            <Link href={`/dashboard/executions/new?agentId=${agent.id}`} className="text-sm font-semibold text-[#0066FF] hover:underline">
              Submit governed intent →
            </Link>
            </>
            )}

            {tab === 'policy' && (
            <>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="app-card">
                <h3 className="app-card-title mb-3">Wallet Bindings</h3>
                {!identity?.walletBindings?.length ? (
                  <p className="text-sm text-[#64748b]">No wallet bindings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {identity.walletBindings.map((wallet) => (
                      <div key={wallet.id} className="rounded-2xl border border-[#eef0f3] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <ChainBadge chainId={wallet.chainId} />
                          <span className="wallet-status wallet-status-ok">{wallet.status}</span>
                        </div>
                        <p className="mt-2 break-all font-mono text-xs text-[#012b54]">{wallet.walletAddress}</p>
                        <p className="mt-1 text-xs text-[#64748b]">
                          {wallet.walletType}{wallet.isPrimary ? ' · primary' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="app-card">
                <h3 className="app-card-title mb-3">Signed Mandates</h3>
                {!identity?.mandates.length ? (
                  <p className="text-sm text-[#64748b]">No signed mandates yet.</p>
                ) : (
                  <div className="space-y-3">
                    {identity.mandates.map((mandate) => (
                      <div key={mandate.id} className="rounded-2xl border border-[#eef0f3] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <ChainBadge chainId={mandate.chainId} />
                          <StatusBadge status={mandate.status} />
                        </div>
                        <p className="mt-2 break-all font-mono text-xs text-[#012b54]">{mandate.id}</p>
                        <p className="mt-1 break-all text-xs text-[#64748b]">Signer: {mandate.signerAddress ?? 'unknown'}</p>
                        <p className="mt-1 break-all text-xs text-[#64748b]">Typed data: {mandate.typedDataHash ?? 'none'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">

              <div className="app-card">
                <h3 className="app-card-title mb-3">Assign Default Policy</h3>
                <p className="mb-3 text-sm text-[#64748b]">
                  Intent submission requires an active agent with a default policy. Assign one created from the policy templates.
                </p>
                <form onSubmit={handleAssignPolicy} className="flex flex-wrap items-end gap-3">
                  <div className="app-form-group min-w-[240px] flex-1">
                    <label htmlFor="defaultPolicyId">Policy</label>
                    <select
                      id="defaultPolicyId"
                      name="defaultPolicyId"
                      className="app-input"
                      defaultValue={agent.defaultPolicyId ?? ''}
                      required
                    >
                      <option value="">Select policy</option>
                      {(policies ?? []).map((policy) => (
                        <option key={policy.id} value={policy.id}>
                          {policy.name} ({policy.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="app-btn app-btn-primary" disabled={updateAgentMutation.isPending}>
                    {updateAgentMutation.isPending ? 'Saving...' : 'Assign Policy'}
                  </button>
                </form>
              </div>

              <div className="app-card">
                <h3 className="app-card-title mb-3">Link Wallet</h3>
                <p className="mb-3 text-sm text-[#64748b]">
                  Each wallet address can only be linked once per chain across the organization.
                </p>
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
            </>
            )}

            {tab === 'keys' && (
            <details className="app-card" id="api-keys" open={apiKeysOpenByDefault}>
              <summary className="cursor-pointer list-none">
                <h3 className="app-card-title inline">
                  API Keys{typeMeta?.requiresApiKey ? ' — required for this agent type' : ' — optional'}
                </h3>
                <p className="mt-2 text-sm text-[#64748b]">
                  {typeMeta?.requiresApiKey
                    ? 'External and service agents need mandate-bound API keys before programmatic access is ready.'
                    : 'Dashboard users submit intents through the UI and do not need API keys.'}
                </p>
              </summary>
              <div className="mt-4 border-t border-[#eef0f3] pt-4">
              <form onSubmit={handleCreateApiKey} className="flex flex-wrap items-end gap-3">
                <div className="app-form-group min-w-[240px] flex-1">
                  <label htmlFor="keyName">Key Name</label>
                  <input id="keyName" name="keyName" className="app-input" placeholder="Production key" required />
                </div>
                <div className="app-form-group min-w-[240px] flex-1">
                  <label htmlFor="mandateId">Mandate Binding</label>
                  <select id="mandateId" name="mandateId" className="app-input" required>
                    <option value="">Select active mandate</option>
                    {agentMandates.map((mandate) => (
                      <option key={mandate.id} value={mandate.id}>
                        {mandate.id.slice(0, 8)}... · {mandate.allowedActions.join(', ') || 'actions'}
                      </option>
                    ))}
                  </select>
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
            </details>
            )}

            {tab === 'activity' && (
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
            )}
          </>
        )}
      </QueryState>
    </div>
  );
}
