'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { keccak256, toHex } from 'viem';
import { PageHeader } from '@/components/app/page-header';
import { BudgetMeter } from '@/components/app/budget-meter';
import { ChainBadge } from '@/components/app/chain-badge';
import { SelectedAssetBalance, compareAmountToBalance } from '@/components/app/selected-asset-balance';
import { useWalletBalanceForChain } from '@/hooks/use-wallet-balances';
import { WalletBalancesPanel } from '@/components/app/wallet-balances-panel';
import { useAgents, useCreateExecution, useMandates } from '@/hooks/use-valen-api';
import { executionAmountBaseUnits, executionAmountLabel } from '@/lib/amount';
import { INTENT_TEMPLATES, intentTemplateById } from '@/lib/intent-templates';
import { knownAssetForMandateValue, knownAssetsForChain, settlementLabelForAsset } from '@/lib/known-assets';
import { mandateMatchesIntent } from '@/lib/mandate-match';
import { assetSelectValue, resolveIntentAssetForSubmit } from '@/lib/resolve-intent-asset';
import { formatApiErrorMessage } from '@/lib/utils';

function robinhoodTickerFromTemplate(template: ReturnType<typeof intentTemplateById>): string | undefined {
  const meta = template.metadata?.robinhood as { ticker?: string } | undefined;
  return meta?.ticker;
}

function agentMatchesTemplate(
  agentId: string,
  template: ReturnType<typeof intentTemplateById>,
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
  const [templateId, setTemplateId] = useState(initialTemplate.id);
  const [agentId, setAgentId] = useState(searchParams.get('agentId') ?? '');
  const [amount, setAmount] = useState(initialTemplate.amount);
  const [targetAddress, setTargetAddress] = useState(initialTemplate.targetAddress);
  const [assetAddress, setAssetAddress] = useState(initialTemplate.assetAddress ?? '');
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
  const normalizedAmountPreview = executionAmountBaseUnits(amount, amountDecimals);
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
  const submitBlockedReason = !selectedAgent
    ? 'Select an active agent.'
    : !selectedAgent.defaultPolicyId
      ? 'Selected agent needs an assigned policy.'
      : !selectedMandate
        ? matchingAgents.length
          ? `No mandate for this agent. Try agent "${matchingAgents[0]?.name}" — it has a matching ${selectedTemplate.targetChainId === 46630 ? 'Robinhood' : 'Arbitrum'} mandate.`
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
    ? `This intent may require approval when ${selectedMandate.approvalThreshold}.`
    : 'This intent can proceed automatically when wallet authority, rules, risk, and settlement checks pass.';

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

  const handleTemplateChange = (value: string) => {
    const nextTemplate = intentTemplateById(value);
    setTemplateId(value);
    setAmount(nextTemplate.amount);
    setTargetAddress(nextTemplate.targetAddress);
    setAssetAddress(nextTemplate.assetAddress ?? '');
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
    <div className="space-y-6">
      <Link href="/dashboard/executions" className="app-back-link">
        <ArrowLeft className="h-4 w-4" />
        Back to Executions
      </Link>

      <PageHeader title="Execute Governed Action" description="Choose an agent action, check the matching mandate, then produce an execution proof or refusal." />

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="app-card">
        {agentsLoading ? (
          <p className="text-sm text-[#64748b]">Loading agents...</p>
        ) : !agents?.items.length ? (
          <p className="text-sm text-[#64748b]">
            No active agents. <Link href="/dashboard/register-agent" className="app-link">Register an agent</Link> first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="app-form-group">
            <label htmlFor="template">Template</label>
            <select id="template" className="app-input" value={templateId} onChange={(e) => handleTemplateChange(e.target.value)}>
              {INTENT_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div className="app-form-group">
            <label htmlFor="agent">Agent</label>
            <select id="agent" name="agentId" className="app-input" value={selectedAgent?.id ?? agentId} onChange={(e) => setAgentId(e.target.value)} required>
              {agents?.items.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {matchingAgents.length === 1 && selectedAgent?.id !== matchingAgents[0].id && (
              <p className="mt-1 text-xs text-amber-700">This template requires agent &quot;{matchingAgents[0].name}&quot;.</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="app-form-group">
              <label>Chain</label>
              <div className="rounded-xl border border-[#eef0f3] px-3 py-2">
                <ChainBadge chainId={selectedTemplate.targetChainId} />
              </div>
            </div>
            <div className="app-form-group">
              <label htmlFor="amount">Amount ({amountSymbol})</label>
              <input id="amount" name="amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="app-input" />
              <p className="mt-1 text-xs text-[#64748b]">
                Human-readable {amountSymbol} amount. Example: entering <strong>1</strong> transfers 1 {amountSymbol}
                {normalizedAmountPreview ? ` (${normalizedAmountPreview} base units)` : ''}.
              </p>
              <SelectedAssetBalance
                walletAddress={connectedWallet}
                chainId={selectedTemplate.targetChainId}
                assetValue={resolvedSubmitAsset}
              />
              {!balanceWarning.ok && balanceWarning.message && (
                <p className="mt-2 text-xs font-medium text-amber-700">{balanceWarning.message}</p>
              )}
            </div>
          </div>
          <div className="app-form-group">
            <label htmlFor="target">Target Address</label>
            <input id="target" name="targetAddress" type="text" value={targetAddress} onChange={(e) => setTargetAddress(e.target.value)} className="app-input font-mono" required />
          </div>
          <div className="app-form-group">
            <label htmlFor="assetAddress">Asset</label>
            <select
              id="assetAddress"
              className="app-input"
              value={assetSelectValue(selectedTemplate.targetChainId, assetAddress)}
              onChange={(e) => {
                if (e.target.value !== 'custom') setAssetAddress(e.target.value);
              }}
            >
              {chainAssets.map((asset) => (
                <option key={asset.id} value={asset.mandateValue}>
                  {asset.label}
                </option>
              ))}
              <option value="custom">Custom address or symbol</option>
            </select>
            <input
              aria-label="Custom asset address or symbol"
              type="text"
              value={assetAddress}
              onChange={(e) => setAssetAddress(e.target.value)}
              placeholder="native, USDC address, or demo symbol"
              className="app-input mt-2 font-mono text-sm"
            />
            <p className="mt-2 text-xs leading-5 text-[#64748b]">{settlementNote}</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {submitBlockedReason && <p className="text-sm font-medium text-amber-700">{submitBlockedReason}</p>}
          <button type="submit" className="app-btn app-btn-primary" disabled={createMutation.isPending || Boolean(submitBlockedReason)}>
            {createMutation.isPending ? 'Submitting...' : 'Submit for Evaluation'}
          </button>
          </form>
        )}
        </div>

        <div className="space-y-5">
          <div className="app-card">
            <h3 className="app-card-title">Intent Preview</h3>
            <p className="mt-2 text-sm text-[#64748b]">{selectedTemplate.description}</p>
            <div className="mt-4 space-y-3">
              {[
                ['Action', selectedTemplate.actionType],
                ['Target', targetAddress],
                ['Amount', amount ? executionAmountLabel(amount, amountDecimals, amountSymbol) : 'Not set'],
                ['Asset', selectedAsset?.symbol ?? resolvedSubmitAsset],
                ['Mandate', selectedMandate?.id ?? 'No matching mandate'],
              ].map(([label, value]) => (
                <div key={label} className="wallet-row">
                  <span>{label}</span>
                  <strong className="break-all">{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="app-card">
            <h3 className="app-card-title">Readiness</h3>
            <div className="mt-4 space-y-3">
              {[
                ['Active agent', Boolean(selectedAgent)],
                ['Assigned policy', Boolean(selectedAgent?.defaultPolicyId)],
                ['Matching mandate', Boolean(selectedMandate)],
              ].map(([label, complete]) => (
                <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-[#eef0f3] p-3">
                  {complete ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-[#94a3b8]" />}
                  <span className="text-sm font-medium text-[#012b54]">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm leading-6 text-[#64748b]">
              {approvalExplanation}
            </p>
          </div>

          {showUsdcBudget ? (
            <div className="app-card">
              <h3 className="app-card-title">USDC Budget Check</h3>
              <div className="mt-4">
                <BudgetMeter agentId={selectedAgent?.id} compact chainId={421614} />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#64748b]">
                USDC budget applies to Arbitrum USDC payments only. Robinhood stock transfers use wallet token balance instead.
              </p>
            </div>
          ) : (
            <div className="app-card">
              <h3 className="app-card-title">{amountSymbol} Settlement Check</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                This template settles {amountSymbol} on chain — not USDC budget. Your connected wallet must hold enough {amountSymbol} (and approval) for the amount entered.
              </p>
              <div className="mt-4">
                <SelectedAssetBalance
                  walletAddress={connectedWallet}
                  chainId={selectedTemplate.targetChainId}
                  assetValue={resolvedSubmitAsset}
                />
              </div>
            </div>
          )}

          {showUsdcBudget && (
            <div className="app-card">
              <h3 className="app-card-title">x402 USDC Payments</h3>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                HTTP-native governed payments with budget enforcement and public proof URLs.
              </p>
              <Link href="/dashboard/payments" className="app-btn app-btn-outline mt-4 inline-flex">
                Open x402 Payments sandbox
              </Link>
            </div>
          )}

          <div className="app-card">
            <h3 className="app-card-title">Wallet on this chain</h3>
            <div className="mt-4">
              <WalletBalancesPanel walletAddress={connectedWallet} chainId={selectedTemplate.targetChainId} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
