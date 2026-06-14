'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { keccak256, toHex } from 'viem';
import { PageHeader } from '@/components/app/page-header';
import { IntentAgentPicker } from '@/components/execution/intent-agent-picker';
import { IntentConfigPanel } from '@/components/execution/intent-config-panel';
import { IntentContextSidebar } from '@/components/execution/intent-context-sidebar';
import { IntentRequirementsPanel } from '@/components/execution/intent-requirements-panel';
import { IntentReviewCard } from '@/components/execution/intent-review-card';
import { IntentTemplatePicker } from '@/components/execution/intent-template-picker';
import { IntentWizardNav } from '@/components/execution/intent-wizard-nav';
import { useAgents, useCreateExecution, useMandates, usePolicies } from '@/hooks/use-valen-api';
import { useWalletBalanceForChain } from '@/hooks/use-wallet-balances';
import { compareAmountToBalance } from '@/components/app/selected-asset-balance';
import { INTENT_TEMPLATES, intentTemplateById, type IntentTemplate } from '@/lib/intent-templates';
import { knownAssetForMandateValue, knownAssetsForChain, settlementLabelForAsset } from '@/lib/known-assets';
import {
  evaluateIntentEligibility,
  findEligibleMandate,
  intentRequirementsFromTemplate,
  type IntentEligibilityResult,
} from '@/lib/intent-eligibility';
import { GOVERNED_INTENT_LABEL } from '@/lib/navigation';
import { assetSelectValue, resolveIntentAssetForSubmit } from '@/lib/resolve-intent-asset';
import { formatApiErrorMessage } from '@/lib/utils';

function robinhoodTickerFromTemplate(template: IntentTemplate): string | undefined {
  const meta = template.metadata?.robinhood as { ticker?: string } | undefined;
  return meta?.ticker;
}

function agentMatchesTemplate(
  agentId: string,
  template: IntentTemplate,
  mandates: import('@/types/api').MandateDto[],
  targetAddress: string,
  assetAddress: string,
  policyName?: string | null,
): boolean {
  const requirements = intentRequirementsFromTemplate(template, targetAddress, assetAddress);
  return Boolean(findEligibleMandate(mandates, agentId, requirements, policyName ?? null));
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function defaultTargetForTemplate(template: IntentTemplate, connectedWallet?: string): string {
  if (
    connectedWallet &&
    template.targetAddress.toLowerCase() === ZERO_ADDRESS
  ) {
    return connectedWallet;
  }
  return template.targetAddress;
}

export default function SubmitIntentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallets } = useWallets();
  const connectedWallet = wallets[0]?.address;
  const { data: agents, isLoading: agentsLoading } = useAgents({ limit: 100, status: 'active' });
  const { data: mandates } = useMandates();
  const { data: policies } = usePolicies();
  const createMutation = useCreateExecution();
  const [error, setError] = useState<string | null>(null);

  const initialTemplate = intentTemplateById(searchParams.get('template') ?? INTENT_TEMPLATES[0].id);
  const urlAmount = searchParams.get('amount');
  const initialStep = searchParams.get('template') ? 2 : 1;

  const [templateId, setTemplateId] = useState(initialTemplate.id);
  const [agentId, setAgentId] = useState(searchParams.get('agentId') ?? '');
  const [amount, setAmount] = useState(urlAmount ?? initialTemplate.amount);
  const [targetAddress, setTargetAddress] = useState(
    defaultTargetForTemplate(initialTemplate, connectedWallet),
  );
  const [assetAddress, setAssetAddress] = useState(initialTemplate.assetAddress ?? '');
  const [wizardStep, setWizardStep] = useState(initialStep);
  const [maxStep, setMaxStep] = useState(initialStep);

  const selectedTemplate = intentTemplateById(templateId);
  const resolvedSubmitAsset = resolveIntentAssetForSubmit({
    chainId: selectedTemplate.targetChainId,
    rawAsset: assetAddress,
    templateAsset: selectedTemplate.assetAddress,
    templateActionType: selectedTemplate.actionType,
    robinhoodTicker: robinhoodTickerFromTemplate(selectedTemplate),
  });

  const selectedAgent = agents?.items.find((agent) => agent.id === agentId) ?? agents?.items[0];
  const intentRequirements = useMemo(
    () => intentRequirementsFromTemplate(selectedTemplate, targetAddress, resolvedSubmitAsset),
    [selectedTemplate, targetAddress, resolvedSubmitAsset],
  );

  const agentEvaluations = useMemo(() => {
    const map = new Map<string, IntentEligibilityResult>();
    for (const agent of agents?.items ?? []) {
      const match = findEligibleMandate(
        mandates ?? [],
        agent.id,
        intentRequirements,
        policies?.find((p) => p.id === agent.defaultPolicyId)?.name ?? null,
      );
      if (match) {
        map.set(agent.id, match.result);
        continue;
      }
      const agentMandates = (mandates ?? []).filter((m) => m.agentId === agent.id);
      const best =
        agentMandates.length > 0
          ? evaluateIntentEligibility({
              mandate: agentMandates[0],
              requirements: intentRequirements,
              policyName: policies?.find((p) => p.id === agent.defaultPolicyId)?.name ?? null,
            })
          : {
              eligible: false,
              checks: [],
              failureReason: 'No active mandate on agent',
              mandateStatus: 'missing' as const,
            };
      map.set(agent.id, best);
    }
    return map;
  }, [agents?.items, mandates, intentRequirements, policies]);

  const activeMandates = useMemo(() => {
    if (!selectedAgent?.id) return [];
    const match = findEligibleMandate(
      mandates ?? [],
      selectedAgent.id,
      intentRequirements,
      policies?.find((p) => p.id === selectedAgent.defaultPolicyId)?.name ?? null,
    );
    return match ? [match.mandate] : [];
  }, [mandates, selectedAgent?.id, intentRequirements, policies]);
  const selectedMandate = activeMandates[0];
  const chainAssets = knownAssetsForChain(selectedTemplate.targetChainId);
  const settlementNote = settlementLabelForAsset(selectedTemplate.targetChainId, resolvedSubmitAsset);
  const selectedAsset = knownAssetForMandateValue(selectedTemplate.targetChainId, resolvedSubmitAsset);
  const amountDecimals = selectedAsset?.decimals ?? 18;
  const amountSymbol = selectedAsset?.symbol ?? 'ETH';
  const showUsdcBudget =
    selectedTemplate.targetChainId === 421614 &&
    (selectedTemplate.id.startsWith('arbitrum-usdc') || selectedAsset?.symbol === 'USDC');

  const matchingAgents = useMemo(
    () =>
      (agents?.items ?? []).filter((agent) =>
        agentEvaluations.get(agent.id)?.eligible,
      ),
    [agents?.items, agentEvaluations],
  );
  const matchingAgentIds = useMemo(() => new Set(matchingAgents.map((a) => a.id)), [matchingAgents]);

  const selectedEvaluation = agentId ? agentEvaluations.get(agentId) : undefined;

  const submitBlockedReason = !selectedAgent
    ? 'Select an active agent.'
    : !selectedAgent.defaultPolicyId
      ? 'Selected agent needs an assigned policy.'
      : !selectedMandate
        ? selectedEvaluation?.failureReason ??
          (matchingAgents.length
            ? `Select an eligible agent — ${matchingAgents[0]?.name} has a matching mandate snapshot.`
            : 'No agent has an active mandate snapshot matching this intent.')
        : null;

  const { data: chainBalance } = useWalletBalanceForChain(connectedWallet, selectedTemplate.targetChainId);
  const walletAssetBalance = useMemo(() => {
    if (!chainBalance || !selectedAsset) return undefined;
    if (selectedAsset.address === 'native') return chainBalance.nativeFormatted;
    const token = chainBalance.tokens.find(
      (row) =>
        row.address.toLowerCase() === selectedAsset.address.toLowerCase() ||
        row.symbol.toUpperCase() === selectedAsset.symbol.toUpperCase(),
    );
    return token?.formatted;
  }, [chainBalance, selectedAsset]);
  const balanceWarning = compareAmountToBalance(amount, amountDecimals, walletAssetBalance);
  const approvalExplanation = selectedMandate?.approvalThreshold
    ? `May require approval when ${selectedMandate.approvalThreshold}.`
    : 'Proceeds automatically when wallet authority, rules, risk, and settlement checks pass.';

  const readiness = [
    { label: 'Active agent selected', complete: Boolean(selectedAgent), href: '/dashboard/agents' },
    {
      label: 'Policy assigned',
      complete: Boolean(selectedAgent?.defaultPolicyId),
      href: selectedAgent ? `/dashboard/agents/${selectedAgent.id}` : '/dashboard/agents',
    },
    { label: 'Mandate snapshot match', complete: Boolean(selectedMandate), href: '/dashboard/authority' },
  ];

  useEffect(() => {
    setMaxStep((prev) => Math.max(prev, wizardStep));
  }, [wizardStep]);

  useEffect(() => {
    const nextAmount = searchParams.get('amount');
    if (nextAmount) setAmount(nextAmount);
  }, [searchParams]);

  useEffect(() => {
    if (!connectedWallet) return;
    setTargetAddress((current) => {
      if (current.toLowerCase() !== ZERO_ADDRESS) return current;
      if (selectedTemplate.targetAddress.toLowerCase() !== ZERO_ADDRESS) return current;
      return connectedWallet;
    });
  }, [connectedWallet, selectedTemplate.id, selectedTemplate.targetAddress]);

  useEffect(() => {
    if (!mandates?.length || !agents?.items.length) return;
    const preferred = searchParams.get('agentId');
    if (
      preferred &&
      agents.items.some((a) => a.id === preferred) &&
      agentMatchesTemplate(
        preferred,
        selectedTemplate,
        mandates ?? [],
        targetAddress,
        resolvedSubmitAsset,
        agents.items.find((a) => a.id === preferred)?.defaultPolicyId
          ? policies?.find((p) => p.id === agents.items.find((a) => a.id === preferred)?.defaultPolicyId)?.name
          : null,
      )
    ) {
      if (agentId !== preferred) setAgentId(preferred);
      return;
    }
    if (agentId && agentEvaluations.get(agentId)?.eligible) {
      return;
    }
    if (matchingAgents[0] && matchingAgents[0].id !== agentId) {
      setAgentId(matchingAgents[0].id);
    }
  }, [
    templateId,
    mandates,
    agents?.items,
    targetAddress,
    resolvedSubmitAsset,
    matchingAgents,
    agentId,
    searchParams,
    selectedTemplate,
  ]);

  const goToStep = (step: number) => {
    setWizardStep(step);
    setError(null);
  };

  const applyTemplate = (template: IntentTemplate) => {
    setTemplateId(template.id);
    setAmount(template.amount);
    setTargetAddress(defaultTargetForTemplate(template, connectedWallet));
    setAssetAddress(template.assetAddress ?? '');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (submitBlockedReason || !selectedAgent || !selectedMandate) {
      setError(submitBlockedReason ?? 'Intent is not ready to submit.');
      return;
    }

    const payload = JSON.stringify({
      templateId,
      actionType: selectedTemplate.actionType,
      targetChainId: selectedTemplate.targetChainId,
      targetAddress,
      amount: amount || null,
      assetAddress: resolvedSubmitAsset,
      mandateId: selectedMandate.id,
      submittedAt: new Date().toISOString(),
    });
    const payloadHash = keccak256(toHex(payload));
    const idempotencyKey = `dashboard-${selectedAgent.id.slice(0, 8)}-${Date.now()}`;

    try {
      const result = await createMutation.mutateAsync({
        agentId: selectedAgent.id,
        idempotencyKey,
        actionType: selectedTemplate.actionType,
        targetChainId: selectedTemplate.targetChainId,
        targetAddress,
        assetAddress: resolvedSubmitAsset,
        amount: amount || undefined,
        mandateId: selectedMandate.id,
        payloadHash,
        metadata: {
          ...(selectedTemplate.metadata ?? {}),
          source: 'dashboard-intent-builder',
          templateId,
          mandateId: selectedMandate.id,
          payloadPreview: payload,
          approvalExplanation,
        },
      });
      router.push(`/dashboard/executions/${result.id}`);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to submit intent'));
    }
  };

  return (
    <div className="intent-wizard-page">
      <Link href="/dashboard/executions" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Execution log
      </Link>

      <PageHeader
        title={GOVERNED_INTENT_LABEL}
        description="Submit a policy-checked intent in four steps — pick an action, assign an agent, configure settlement, then review."
        className="intent-wizard-header"
      />

      <IntentWizardNav current={wizardStep} maxReached={maxStep} onStep={goToStep} />

      <div className="intent-wizard-layout">
        <div className="intent-wizard-main">
          {agentsLoading ? (
            <div className="app-panel-floating intent-wizard-panel">
              <p className="text-sm text-[#5E6C7B]">Loading agents…</p>
            </div>
          ) : !agents?.items.length ? (
            <div className="app-panel-floating intent-wizard-panel intent-empty-state">
              <p className="text-sm font-semibold text-[#1A2332]">No active agents yet</p>
              <p className="mt-2 text-sm text-[#5E6C7B]">
                Create and publish an agent before submitting intents.
              </p>
              <Link href="/dashboard/agents/studio" className="app-btn app-btn-primary mt-4">
                Open Agent Studio
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="app-panel-floating intent-wizard-panel">
              {wizardStep === 1 && (
                <IntentTemplatePicker
                  templates={INTENT_TEMPLATES}
                  selectedId={templateId}
                  onSelect={applyTemplate}
                  onContinue={() => goToStep(2)}
                />
              )}

              {wizardStep === 2 && (
                <>
                  <IntentRequirementsPanel requirements={intentRequirements} />
                  <IntentAgentPicker
                    agents={agents.items}
                    evaluations={agentEvaluations}
                    selectedId={agentId || selectedAgent?.id || ''}
                    templateName={selectedTemplate.name}
                    onSelect={setAgentId}
                    onBack={() => goToStep(1)}
                    onContinue={() => goToStep(3)}
                  />
                </>
              )}

              {wizardStep === 3 && (
                <IntentConfigPanel
                  chainId={selectedTemplate.targetChainId}
                  amount={amount}
                  amountSymbol={amountSymbol}
                  targetAddress={targetAddress}
                  assetAddress={assetAddress}
                  chainAssets={chainAssets}
                  settlementNote={settlementNote}
                  connectedWallet={connectedWallet}
                  resolvedAsset={resolvedSubmitAsset}
                  balanceWarning={balanceWarning}
                  onAmountChange={setAmount}
                  onTargetChange={setTargetAddress}
                  onAssetChange={setAssetAddress}
                  assetSelectValue={assetSelectValue(selectedTemplate.targetChainId, assetAddress)}
                  onBack={() => goToStep(2)}
                  onContinue={() => goToStep(4)}
                />
              )}

              {wizardStep === 4 && selectedAgent && (
                <div className="intent-review-step">
                  <div className="intent-step-intro">
                    <p className="intent-step-eyebrow">Step 4</p>
                    <h2 className="intent-step-title">Review & submit</h2>
                    <p className="intent-step-desc">Confirm the details below. VALEN runs governance gates before any settlement.</p>
                  </div>

                  <IntentReviewCard
                    agentName={selectedAgent.name}
                    templateName={selectedTemplate.name}
                    actionType={selectedTemplate.actionType}
                    chainId={selectedTemplate.targetChainId}
                    amount={amount}
                    amountDecimals={amountDecimals}
                    amountSymbol={amountSymbol}
                    targetAddress={targetAddress}
                    assetSymbol={selectedAsset?.symbol ?? amountSymbol}
                    mandateId={selectedMandate?.id}
                    approvalExplanation={approvalExplanation}
                  />

                  {error && <p className="intent-error">{error}</p>}
                  {submitBlockedReason && <p className="intent-hint intent-hint--warn">{submitBlockedReason}</p>}

                  <div className="intent-step-actions intent-step-actions--submit">
                    <button type="button" className="app-btn app-btn-outline" onClick={() => goToStep(3)}>
                      Back
                    </button>
                    <button
                      type="submit"
                      className="app-btn app-btn-primary intent-submit-btn"
                      disabled={createMutation.isPending || Boolean(submitBlockedReason)}
                    >
                      {createMutation.isPending ? 'Submitting…' : 'Submit intent'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        <IntentContextSidebar
          template={selectedTemplate}
          targetAddress={targetAddress}
          amount={amount}
          amountDecimals={amountDecimals}
          amountSymbol={amountSymbol}
          assetSymbol={selectedAsset?.symbol ?? amountSymbol}
          resolvedAsset={resolvedSubmitAsset}
          mandateId={selectedMandate?.id}
          agentName={selectedAgent?.name}
          approvalExplanation={approvalExplanation}
          readiness={readiness}
          showUsdcBudget={showUsdcBudget}
          agentId={selectedAgent?.id}
          connectedWallet={connectedWallet}
          wizardStep={wizardStep}
        />
      </div>
    </div>
  );
}
