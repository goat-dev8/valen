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
import { IntentReviewCard } from '@/components/execution/intent-review-card';
import { IntentTemplatePicker } from '@/components/execution/intent-template-picker';
import { IntentWizardNav } from '@/components/execution/intent-wizard-nav';
import { useAgents, useCreateExecution, useMandates } from '@/hooks/use-valen-api';
import { useWalletBalanceForChain } from '@/hooks/use-wallet-balances';
import { compareAmountToBalance } from '@/components/app/selected-asset-balance';
import { INTENT_TEMPLATES, intentTemplateById, type IntentTemplate } from '@/lib/intent-templates';
import { knownAssetForMandateValue, knownAssetsForChain, settlementLabelForAsset } from '@/lib/known-assets';
import { mandateMatchesIntent } from '@/lib/mandate-match';
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
  mandates: Array<{
    status: string;
    agentId: string;
    allowedChains: number[];
    allowedActions: string[];
    allowedAssets: string[];
    allowedTargets: string[];
  }>,
  targetAddress: string,
  assetAddress: string,
): boolean {
  return mandates.some((mandate) =>
    mandateMatchesIntent({
      mandate,
      agentId,
      chainId: template.targetChainId,
      actionType: template.actionType,
      templateId: template.id,
      targetAddress,
      assetAddress,
    }),
  );
}

export default function SubmitIntentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallets } = useWallets();
  const connectedWallet = wallets[0]?.address;
  const { data: agents, isLoading: agentsLoading } = useAgents({ limit: 100, status: 'active' });
  const { data: mandates } = useMandates();
  const createMutation = useCreateExecution();
  const [error, setError] = useState<string | null>(null);

  const initialTemplate = intentTemplateById(searchParams.get('template') ?? INTENT_TEMPLATES[0].id);
  const urlAmount = searchParams.get('amount');
  const initialStep = searchParams.get('template') ? 2 : 1;

  const [templateId, setTemplateId] = useState(initialTemplate.id);
  const [agentId, setAgentId] = useState(searchParams.get('agentId') ?? '');
  const [amount, setAmount] = useState(urlAmount ?? initialTemplate.amount);
  const [targetAddress, setTargetAddress] = useState(initialTemplate.targetAddress);
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
  const activeMandates = useMemo(
    () =>
      (mandates ?? []).filter((mandate) =>
        mandateMatchesIntent({
          mandate,
          agentId: selectedAgent?.id,
          chainId: selectedTemplate.targetChainId,
          actionType: selectedTemplate.actionType,
          templateId: selectedTemplate.id,
          targetAddress,
          assetAddress: resolvedSubmitAsset,
        }),
      ),
    [mandates, selectedAgent?.id, selectedTemplate, targetAddress, resolvedSubmitAsset],
  );
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
        agentMatchesTemplate(agent.id, selectedTemplate, mandates ?? [], targetAddress, resolvedSubmitAsset),
      ),
    [agents?.items, selectedTemplate, mandates, targetAddress, resolvedSubmitAsset],
  );
  const matchingAgentIds = useMemo(() => new Set(matchingAgents.map((a) => a.id)), [matchingAgents]);

  const submitBlockedReason = !selectedAgent
    ? 'Select an active agent.'
    : !selectedAgent.defaultPolicyId
      ? 'Selected agent needs an assigned policy.'
      : !selectedMandate
        ? matchingAgents.length
          ? `No mandate for this agent. Try "${matchingAgents[0]?.name}" — it has a matching mandate.`
          : 'No active mandate matches this agent, chain, action, and target.'
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
    { label: 'Matching mandate', complete: Boolean(selectedMandate), href: '/dashboard/authority' },
  ];

  useEffect(() => {
    setMaxStep((prev) => Math.max(prev, wizardStep));
  }, [wizardStep]);

  useEffect(() => {
    const nextAmount = searchParams.get('amount');
    if (nextAmount) setAmount(nextAmount);
  }, [searchParams]);

  useEffect(() => {
    if (!mandates?.length || !agents?.items.length) return;
    const preferred = searchParams.get('agentId');
    if (
      preferred &&
      agents.items.some((a) => a.id === preferred) &&
      agentMatchesTemplate(preferred, selectedTemplate, mandates, targetAddress, resolvedSubmitAsset)
    ) {
      if (agentId !== preferred) setAgentId(preferred);
      return;
    }
    if (agentId && agentMatchesTemplate(agentId, selectedTemplate, mandates, targetAddress, resolvedSubmitAsset)) {
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
    setTargetAddress(template.targetAddress);
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
                <IntentAgentPicker
                  agents={agents.items}
                  matchingAgentIds={matchingAgentIds}
                  selectedId={agentId || selectedAgent?.id || ''}
                  templateName={selectedTemplate.name}
                  onSelect={setAgentId}
                  onBack={() => goToStep(1)}
                  onContinue={() => goToStep(3)}
                />
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
