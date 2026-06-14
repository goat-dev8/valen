'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Bot, CheckCircle, FlaskConical, Globe, Server } from 'lucide-react';
import { AgentScopeFields } from '@/components/agents/agent-scope-fields';
import { BudgetMeter } from '@/components/app/budget-meter';
import { BudgetFaucetsFab } from '@/components/budget/budget-faucets-fab';
import { ChainBadge } from '@/components/app/chain-badge';
import { PageHeader } from '@/components/app/page-header';
import { AuthoritySetupFlow } from '@/components/mandate/authority-setup-flow';
import { CreatePolicyModal } from '@/components/policies/create-policy-modal';
import { PolicyCatalogPicker } from '@/components/policies/policy-catalog-picker';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/org-context';
import { ensurePolicyCatalog } from '@/lib/ensure-policy-catalog';
import {
  AGENT_CAPABILITY_OPTIONS,
  AGENT_TYPE_OPTIONS,
  type AgentCapability,
  type AgentTypeValue,
  agentTypeLabel,
  defaultCapabilitiesForType,
} from '@/lib/agent-types';
import {
  DEFAULT_SUPPORTED_ACTIONS,
  DEFAULT_SUPPORTED_ASSETS,
  DEFAULT_SUPPORTED_NETWORKS,
  networkLabel,
  readAgentScope,
} from '@/lib/agent-scope';
import {
  useActivateAgent,
  useAgent,
  useBudget,
  useCreateAgent,
  useMandates,
  usePolicies,
  useUpdateAgent,
  useWalletVerifications,
} from '@/hooks/use-valen-api';
import { formatApiErrorMessage } from '@/lib/utils';

const STUDIO_STEPS = ['Identity', 'Rules', 'Authority', 'Budget', 'Summary', 'Publish'] as const;
const TYPE_ICONS = { hosted: Bot, external: Globe, service: Server, experimental: FlaskConical } as const;
const MAX_STEP = STUDIO_STEPS.length;

export default function AgentStudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { orgId } = useOrganization();
  const agentIdParam = searchParams.get('agentId') ?? '';
  const stepParam = Number(searchParams.get('step') ?? '1');
  const clonedFromTemplate = searchParams.get('cloned') === '1';
  const [step, setStep] = useState(Math.min(Math.max(stepParam, 1), MAX_STEP));
  const [agentId, setAgentId] = useState(agentIdParam);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const activateMutation = useActivateAgent();
  const { data: policies } = usePolicies();
  const { data: agent } = useAgent(agentId);
  const { data: mandates, refetch: refetchMandates } = useMandates();
  const { data: walletVerifications, refetch: refetchWalletVerifications } = useWalletVerifications();
  const { data: budget } = useBudget(agentId);

  const [agentType, setAgentType] = useState<AgentTypeValue>('hosted');
  const [capabilities, setCapabilities] = useState<AgentCapability[]>(() => defaultCapabilitiesForType('hosted'));
  const [supportedNetworks, setSupportedNetworks] = useState<number[]>(DEFAULT_SUPPORTED_NETWORKS);
  const [supportedAssets, setSupportedAssets] = useState<string[]>(DEFAULT_SUPPORTED_ASSETS);
  const [supportedActions, setSupportedActions] = useState<string[]>(DEFAULT_SUPPORTED_ACTIONS);
  const [allAssets, setAllAssets] = useState(true);
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [createPolicyOpen, setCreatePolicyOpen] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const activePolicies = useMemo(
    () => (policies ?? []).filter((policy) => policy.status === 'active'),
    [policies],
  );
  const ownerWalletVerified = walletVerifications?.some((w) => w.status === 'verified') ?? false;
  const ownerWallet = walletVerifications?.find((w) => w.status === 'verified');
  const agentMandates = mandates?.filter((m) => m.agentId === agentId && m.status === 'active') ?? [];
  const mandateSigned = agentMandates.length > 0;
  const activeMandate = agentMandates[0];
  const policyName = policies?.find((p) => p.id === (agent?.defaultPolicyId ?? selectedPolicyId))?.name;

  useEffect(() => {
    if (agentIdParam) setAgentId(agentIdParam);
  }, [agentIdParam]);

  useEffect(() => {
    if (step !== 2 || !token || !orgId) return;
    let cancelled = false;
    setCatalogLoading(true);
    void ensurePolicyCatalog(token, orgId, policies ?? [])
      .then(() => queryClient.invalidateQueries({ queryKey: ['policies', orgId] }))
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once per Rules step entry
  }, [step, token, orgId]);

  const handlePolicySelect = async (policyId: string) => {
    setSelectedPolicyId(policyId);
    if (!agentId) return;
    setError(null);
    try {
      await updateMutation.mutateAsync({
        agentId,
        body: { defaultPolicyId: policyId },
      });
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to bind policy'));
    }
  };

  useEffect(() => {
    if (!agent) return;
    if (agent.defaultPolicyId) setSelectedPolicyId(agent.defaultPolicyId);
    if (agent.agentType) {
      setAgentType(agent.agentType as AgentTypeValue);
      setCapabilities(
        Array.isArray(agent.metadata?.capabilities)
          ? (agent.metadata.capabilities as AgentCapability[])
          : defaultCapabilitiesForType(agent.agentType as AgentTypeValue),
      );
    }
    const scope = readAgentScope(agent.metadata);
    setSupportedNetworks(scope.supportedNetworks);
    setSupportedAssets(scope.supportedAssets);
    setSupportedActions(scope.supportedActions);
  }, [agent]);

  const goToStep = (next: number, id = agentId) => {
    const clamped = Math.min(Math.max(next, 1), MAX_STEP);
    setStep(clamped);
    const params = new URLSearchParams();
    if (id) params.set('agentId', id);
    params.set('step', String(clamped));
    router.replace(`/dashboard/agents/studio?${params.toString()}`);
  };

  const scopePayload = () => ({
    capabilities,
    supportedNetworks,
    supportedAssets: allAssets ? DEFAULT_SUPPORTED_ASSETS : supportedAssets,
    supportedActions,
  });

  const handleIdentitySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = scopePayload();
    try {
      if (agentId && agent) {
        await updateMutation.mutateAsync({
          agentId,
          body: {
            name: formData.get('name') as string,
            description: (formData.get('description') as string) || undefined,
            ...payload,
          },
        });
        goToStep(2, agentId);
        return;
      }
      const created = await createMutation.mutateAsync({
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || undefined,
        agentType,
        ...payload,
      });
      setAgentId(created.id);
      goToStep(2, created.id);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to save agent identity'));
    }
  };

  const handleRulesSubmit = async () => {
    if (!agentId) return;
    if (!selectedPolicyId) {
      setError('Select a policy before continuing.');
      return;
    }
    setError(null);
    try {
      await updateMutation.mutateAsync({
        agentId,
        body: { defaultPolicyId: selectedPolicyId },
      });
      goToStep(3);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to assign policy'));
    }
  };

  const handlePublish = async () => {
    if (!agentId || !confirmed) return;
    setError(null);
    try {
      if (agent?.status !== 'active') {
        await activateMutation.mutateAsync(agentId);
      }
      router.push(`/dashboard/agents/${agentId}?welcome=1`);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to publish agent'));
    }
  };

  const publishChecks = [
    { label: 'Active policy assigned', done: Boolean(agent?.defaultPolicyId || selectedPolicyId) },
    { label: 'Owner wallet verified', done: ownerWalletVerified },
    { label: 'Signed mandate', done: mandateSigned },
    { label: 'Summary confirmed', done: confirmed },
  ];
  const requiredReady = publishChecks.every((c) => c.done);

  const stepPassed = (num: number) => {
    if (num >= step) return false;
    if (num === 1) return Boolean(agentId);
    if (num === 2) return Boolean(agent?.defaultPolicyId || selectedPolicyId);
    if (num === 3) return ownerWalletVerified && mandateSigned;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="agent-studio-page mx-auto w-full max-w-2xl">
        <Link href="/dashboard/agents" className="app-back-link">
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Link>

        <PageHeader
          title="Agent Studio"
          description="Create and publish a governed agent — identity, rules, authority, budget, summary, and activation."
          className="agent-studio-header"
        />

        <nav aria-label="Studio steps" className="agent-studio-steps">
          {STUDIO_STEPS.map((label, index) => {
            const num = index + 1;
            const active = num === step;
            const passed = stepPassed(num);
            return (
              <button
                key={label}
                type="button"
                onClick={() => agentId && num <= step && goToStep(num)}
                disabled={!agentId && num > 1}
                aria-current={active ? 'step' : undefined}
                className={`agent-studio-step ${
                  active ? 'agent-studio-step--active' : passed ? 'agent-studio-step--passed' : 'agent-studio-step--upcoming'
                }`}
              >
                <span className="agent-studio-step__icon" aria-hidden>
                  {passed ? <CheckCircle className="h-4 w-4" /> : <span className="agent-studio-step__num">{num}</span>}
                </span>
                <span className="agent-studio-step__label">{label}</span>
              </button>
            );
          })}
        </nav>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        {clonedFromTemplate && step >= 3 && (
          <div className="rounded-2xl border border-[#0066FF]/20 bg-[#EBF2FF]/60 px-4 py-3 text-sm text-[#012b54]">
            <strong className="font-bold">Agent cloned from starter template.</strong> Policy is assigned — verify wallet and sign mandate.
          </div>
        )}

        {step === 1 && (
          <div className="app-panel-floating app-card max-w-none">
            <form onSubmit={handleIdentitySubmit} className="space-y-5">
              <div className="app-form-group">
                <label htmlFor="name">Agent name</label>
                <input id="name" name="name" required minLength={2} maxLength={120} defaultValue={agent?.name ?? ''} className="app-input" placeholder="Treasury Bot Alpha" />
              </div>
              <div className="app-form-group">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" defaultValue={agent?.description ?? ''} className="app-input min-h-[80px]" placeholder="What this agent does and who owns it" />
              </div>
              <div className="app-form-group">
                <span className="mb-2 block text-sm font-medium">Agent type</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {AGENT_TYPE_OPTIONS.map((option) => {
                    const Icon = TYPE_ICONS[option.value];
                    const selected = agentType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setAgentType(option.value);
                          setCapabilities(defaultCapabilitiesForType(option.value));
                        }}
                        className={`flex items-start gap-2 rounded-xl border p-3 text-left ${selected ? 'border-[#0066FF] bg-[#EBF2FF]/50' : 'border-[#E8ECF0]'}`}
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0066FF]" />
                        <span>
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="text-xs text-[#5E6C7B]">{option.tagline}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="app-form-group">
                <span className="mb-2 block text-sm font-medium">Capabilities</span>
                <div className="space-y-2">
                  {AGENT_CAPABILITY_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={capabilities.includes(option.value)}
                        onChange={() =>
                          setCapabilities((cur) =>
                            cur.includes(option.value) ? cur.filter((v) => v !== option.value) : [...cur, option.value],
                          )
                        }
                        className="mt-1"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <AgentScopeFields
                supportedNetworks={supportedNetworks}
                onSupportedNetworksChange={setSupportedNetworks}
                supportedAssets={supportedAssets}
                onSupportedAssetsChange={setSupportedAssets}
                supportedActions={supportedActions}
                onSupportedActionsChange={setSupportedActions}
                allAssets={allAssets}
                onAllAssetsChange={setAllAssets}
              />
              <button type="submit" className="app-btn app-btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                Continue to Rules
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {step === 2 && agentId && (
          <div className="app-panel-floating app-card max-w-none space-y-4">
            <p className="text-sm text-[#5E6C7B]">Assign the compliance policy that governs this agent&apos;s actions.</p>
            <PolicyCatalogPicker
              policies={activePolicies}
              selectedPolicyId={selectedPolicyId}
              onSelect={handlePolicySelect}
              loading={catalogLoading}
            />
            <div className="flex flex-col gap-3 border-t border-[#E8ECF0] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" className="app-btn app-btn-outline w-full sm:w-auto" onClick={() => setCreatePolicyOpen(true)}>Create new policy</button>
              <button type="button" className="app-btn app-btn-primary w-full sm:w-auto" onClick={handleRulesSubmit} disabled={updateMutation.isPending}>
                Continue to Authority
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <CreatePolicyModal open={createPolicyOpen} onClose={() => setCreatePolicyOpen(false)} assignAgentId={agentId} onCreated={(policyId) => { setSelectedPolicyId(policyId); setCreatePolicyOpen(false); }} />
          </div>
        )}

        {step === 3 && agentId && (
          <div className="app-panel-floating app-card max-w-none space-y-4">
            <AuthoritySetupFlow
              agentId={agentId}
              agentName={agent?.name}
              defaultPolicyId={agent?.defaultPolicyId ?? selectedPolicyId}
              initialNetworks={supportedNetworks}
              initialAssets={allAssets ? DEFAULT_SUPPORTED_ASSETS : supportedAssets}
              initialActions={supportedActions}
              verifyComplete={ownerWalletVerified}
              mandateComplete={mandateSigned}
              onSetupChange={() => { void refetchMandates(); void refetchWalletVerifications(); }}
            />
            <button type="button" className="app-btn app-btn-primary w-full sm:w-auto" onClick={() => goToStep(4)}>
              Continue to Budget
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 4 && agentId && (
          <>
            <div className="app-panel-floating app-card max-w-none space-y-4">
              <BudgetMeter agentId={agentId} showTopup chainId={421614} />
              <button type="button" className="app-btn app-btn-primary" onClick={() => goToStep(5)}>
                Continue to Summary
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <BudgetFaucetsFab />
          </>
        )}

        {step === 5 && agentId && (
          <div className="app-panel-floating app-card max-w-none space-y-4">
            <h3 className="text-lg font-semibold text-[#1A2332]">Agent summary</h3>
            <dl className="app-detail-list">
              <div><dt>Name</dt><dd>{agent?.name}</dd></div>
              <div><dt>Type</dt><dd>{agentTypeLabel(agent?.agentType ?? agentType)}</dd></div>
              <div><dt>Policy</dt><dd>{policyName ?? '—'}</dd></div>
              <div><dt>Budget</dt><dd>{budget?.remaining != null ? `${budget.remaining} USDC remaining` : 'Not funded'}</dd></div>
              <div><dt>Chains</dt><dd className="flex flex-wrap gap-1">{supportedNetworks.map((id) => <ChainBadge key={id} chainId={id} />)}</dd></div>
              <div><dt>Assets</dt><dd>{(allAssets ? DEFAULT_SUPPORTED_ASSETS : supportedAssets).join(', ')}</dd></div>
              <div><dt>Actions</dt><dd>{supportedActions.join(', ')}</dd></div>
              <div><dt>Owner wallet</dt><dd className="font-mono text-xs">{ownerWallet?.walletAddress ?? 'Not verified'}</dd></div>
              <div><dt>Capabilities</dt><dd>{capabilities.map((c) => c.replace(/_/g, ' ')).join(', ')}</dd></div>
              {activeMandate && (
                <div><dt>Mandate chains</dt><dd>{(activeMandate.allowedChains ?? []).map((id) => networkLabel(id)).join(', ')}</dd></div>
              )}
            </dl>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
              I confirm this agent configuration is correct and ready to publish.
            </label>
            <button type="button" className="app-btn app-btn-primary" disabled={!confirmed} onClick={() => goToStep(6)}>
              Continue to Publish
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 6 && agentId && (
          <div className="app-panel-floating app-card max-w-none space-y-4">
            <h3 className="text-lg font-semibold text-[#1A2332]">Publish</h3>
            <ul className="space-y-2">
              {publishChecks.map((check) => (
                <li key={check.label} className="flex items-center gap-2 text-sm">
                  {check.done ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-amber-400" />}
                  <span className={check.done ? 'text-[#1A2332]' : 'text-amber-800'}>{check.label}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="app-btn app-btn-primary" onClick={handlePublish} disabled={!requiredReady || activateMutation.isPending}>
              {agent?.status === 'active' ? 'Open agent dashboard' : 'Publish agent'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
