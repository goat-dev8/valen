'use client';

import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MandateScopeFields } from '@/components/mandate/mandate-scope-fields';
import { VerifyWalletModal } from '@/components/mandate/verify-wallet-modal';
import { useAuthoritySetup } from '@/hooks/use-authority-setup';
import {
  DEFAULT_SUPPORTED_ACTIONS,
  DEFAULT_SUPPORTED_ASSETS,
  DEFAULT_SUPPORTED_NETWORKS,
} from '@/lib/agent-scope';
import { walletChainBannerMessage } from '@/lib/wallet-chain';
import { chainName } from '@/lib/constants';
import {
  mandateDefaultsFromPolicyId,
  type PolicyMandateDefaults,
} from '@/lib/policy-mandate-config';
import { buildMandateScopeSnapshot } from '@/lib/intent-eligibility';

type SignMandateModalProps = {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName?: string;
  defaultPolicyId?: string | null;
  onSigned?: () => void;
  initialNetworks?: number[];
  initialAssets?: string[];
  initialActions?: string[];
};

function applyDefaultsToForm(
  defaults: PolicyMandateDefaults,
  setters: {
    setAllowedChains: (value: number[]) => void;
    setAllowedAssets: (value: string[]) => void;
    setAllowedActions: (value: string[]) => void;
    setAllAssets: (value: boolean) => void;
    setMaxPerTransaction: (value: string) => void;
    setMaxTotal: (value: string) => void;
    setApprovalThreshold: (value: string) => void;
    setValidDays: (value: number) => void;
    setAllowedTargets: (value: string) => void;
  },
) {
  setters.setAllowedChains(defaults.allowedChains);
  setters.setAllowedAssets(defaults.allowedAssets);
  setters.setAllowedActions(defaults.allowedActions);
  setters.setAllAssets(false);
  setters.setMaxPerTransaction(defaults.maxPerTransaction);
  setters.setMaxTotal(defaults.maxTotal);
  setters.setApprovalThreshold(defaults.approvalThreshold);
  setters.setValidDays(defaults.expiresInDays);
  setters.setAllowedTargets(defaults.allowedTargets.join(','));
}

export function SignMandateModal({
  open,
  onClose,
  agentId,
  agentName,
  defaultPolicyId,
  onSigned,
  initialNetworks = DEFAULT_SUPPORTED_NETWORKS,
  initialAssets = DEFAULT_SUPPORTED_ASSETS,
  initialActions = DEFAULT_SUPPORTED_ACTIONS,
}: SignMandateModalProps) {
  const setup = useAuthoritySetup(initialNetworks[0] ?? 421614);
  const [selectedPolicyId, setSelectedPolicyId] = useState(defaultPolicyId ?? '');
  const [allowedChains, setAllowedChains] = useState(initialNetworks);
  const [allowedAssets, setAllowedAssets] = useState(initialAssets);
  const [allowedActions, setAllowedActions] = useState(initialActions);
  const [allAssets, setAllAssets] = useState(false);
  const [maxPerTransaction, setMaxPerTransaction] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [approvalThreshold, setApprovalThreshold] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [allowedTargets, setAllowedTargets] = useState('*');
  const [verifyOpen, setVerifyOpen] = useState(false);

  const setters = {
    setAllowedChains,
    setAllowedAssets,
    setAllowedActions,
    setAllAssets,
    setMaxPerTransaction,
    setMaxTotal,
    setApprovalThreshold,
    setValidDays,
    setAllowedTargets,
  };

  const applyPolicyDefaults = useCallback(
    (policyId: string) => {
      const defaults = mandateDefaultsFromPolicyId(setup.policies, policyId);
      if (defaults) {
        applyDefaultsToForm(defaults, setters);
        return;
      }
      setAllowedChains(initialNetworks);
      setAllowedAssets(initialAssets);
      setAllowedActions(initialActions);
      setAllAssets(false);
      setMaxPerTransaction('');
      setMaxTotal('');
      setApprovalThreshold('');
      setValidDays(30);
      setAllowedTargets('*');
    },
    [setup.policies, initialNetworks, initialAssets, initialActions],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedPolicyId(defaultPolicyId ?? '');
    if (defaultPolicyId) {
      applyPolicyDefaults(defaultPolicyId);
    }
  }, [open, defaultPolicyId, applyPolicyDefaults]);

  const signingChainId = allowedChains[0] ?? 421614;

  useEffect(() => {
    if (!open) return;
    setup.setChainId(signingChainId);
  }, [open, signingChainId, setup.setChainId]);

  if (!open) return null;
  const activeDefaults = selectedPolicyId
    ? mandateDefaultsFromPolicyId(setup.policies, selectedPolicyId)
    : null;
  const finalScopePreview = buildMandateScopeSnapshot({
    mandateId: 'preview',
    policyId: selectedPolicyId || null,
    policyName: activeDefaults?.policyName ?? null,
    riskLevel: activeDefaults?.riskLevel ?? null,
    allowedChains,
    allowedActions,
    allowedAssets: allAssets ? DEFAULT_SUPPORTED_ASSETS : allowedAssets,
    maxPerTransaction: maxPerTransaction || null,
    maxTotal: maxTotal || null,
    approvalThreshold: approvalThreshold || null,
    validUntil: new Date(Date.now() + validDays * 86400000).toISOString(),
    signedAt: new Date().toISOString(),
    agentScopeHash: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!allowedChains.length) {
      setup.clearMessages();
      return;
    }
    const ok = await setup.handleCreateMandate(e, {
      allowedChains,
      signingChainId,
    });
    if (ok) {
      await setup.refetch();
      onSigned?.();
    }
  };

  const mandateActive = setup.mandateCompleteForAgent(agentId);
  const verifiedOnSigningChain = setup.verifiedForAuthorityChain(signingChainId);

  return (
    <>
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#012b54]/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-mandate-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#E8ECF0] bg-white shadow-[0_24px_64px_-12px_rgba(0,102,255,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E8ECF0] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066FF]">Authority setup</p>
            <h2 id="sign-mandate-modal-title" className="app-section-title mt-1 text-xl text-[#012b54]">
              Sign agent mandate
            </h2>
            {agentName && <p className="mt-1 text-sm text-[#8B98A5]">Binding mandate for {agentName}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#8B98A5] hover:bg-[#F4F6F8]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-sm leading-6 text-[#5E6C7B]">
            Mandate limits, assets, and approval rules are generated from the selected policy. You can expand scope
            manually before signing.
          </p>

          {setup.walletNeedsChainSwitch && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Switch network before signing</p>
              <p className="mt-2 leading-6">{walletChainBannerMessage(setup.effectiveWalletChainId, signingChainId)}</p>
              <button
                type="button"
                className="app-btn app-btn-primary mt-4"
                disabled={setup.isSwitchingChain}
                onClick={() => setup.handleSwitchWalletNetwork(signingChainId)}
              >
                {setup.isSwitchingChain ? 'Switching…' : `Switch to ${chainName(signingChainId)}`}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#E8ECF0] bg-[#FAFBFC] p-4">
            <input type="hidden" name="agentId" value={agentId} />

            <div className="app-form-group">
              <label htmlFor="mandate-policyId">Policy</label>
              <select
                id="mandate-policyId"
                name="policyId"
                className="app-input"
                value={selectedPolicyId}
                onChange={(e) => {
                  const policyId = e.target.value;
                  setSelectedPolicyId(policyId);
                  if (policyId) {
                    applyPolicyDefaults(policyId);
                  }
                }}
              >
                <option value="">Agent default policy</option>
                {setup.policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </div>

            {activeDefaults && (
              <div className="rounded-xl border border-[#DBEAFE] bg-[#F8FBFF] px-4 py-3 text-sm text-[#012b54]">
                <p className="font-semibold">{activeDefaults.policyName}</p>
                <p className="mt-1 text-[#5E6C7B]">
                  Max {activeDefaults.maxPerTransaction} · Total {activeDefaults.maxTotal} · Expires in{' '}
                  {activeDefaults.expiresInDays} days
                </p>
              </div>
            )}

            <MandateScopeFields
              allowedChains={allowedChains}
              onAllowedChainsChange={setAllowedChains}
              allowedAssets={allowedAssets}
              onAllowedAssetsChange={setAllowedAssets}
              allowedActions={allowedActions}
              onAllowedActionsChange={setAllowedActions}
              allAssets={allAssets}
              onAllAssetsChange={setAllAssets}
            />

            <div className="app-form-group">
              <label htmlFor="allowedTargets">Allowed targets</label>
              <input
                id="allowedTargets"
                name="allowedTargets"
                className="app-input"
                value={allowedTargets}
                onChange={(e) => setAllowedTargets(e.target.value)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="app-form-group">
                <label htmlFor="maxPerTransaction">Max / tx</label>
                <input
                  id="maxPerTransaction"
                  name="maxPerTransaction"
                  className="app-input"
                  value={maxPerTransaction}
                  onChange={(e) => setMaxPerTransaction(e.target.value)}
                />
              </div>
              <div className="app-form-group">
                <label htmlFor="maxTotal">Max total</label>
                <input
                  id="maxTotal"
                  name="maxTotal"
                  className="app-input"
                  value={maxTotal}
                  onChange={(e) => setMaxTotal(e.target.value)}
                />
              </div>
              <div className="app-form-group">
                <label htmlFor="validDays">Valid days</label>
                <input
                  id="validDays"
                  name="validDays"
                  className="app-input"
                  type="number"
                  min={1}
                  value={validDays}
                  onChange={(e) => setValidDays(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>

            <div className="app-form-group">
              <label htmlFor="approvalThreshold">Approval threshold</label>
              <input
                id="approvalThreshold"
                name="approvalThreshold"
                className="app-input"
                value={approvalThreshold}
                onChange={(e) => setApprovalThreshold(e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-[#DBEAFE] bg-[#F8FBFF] p-4 text-sm text-[#012b54]">
              <p className="font-semibold">Final agent scope (mandate snapshot)</p>
              <dl className="intent-requirements-panel__grid mt-3">
                <div><dt>Policy</dt><dd>{finalScopePreview.policyName ?? '—'}</dd></div>
                <div><dt>Risk</dt><dd>{finalScopePreview.riskLevel ?? '—'}</dd></div>
                <div className="sm:col-span-2"><dt>Actions</dt><dd>{finalScopePreview.actions.join(', ')}</dd></div>
                <div className="sm:col-span-2"><dt>Assets</dt><dd>{finalScopePreview.assets.join(', ')}</dd></div>
                <div className="sm:col-span-2"><dt>Networks</dt><dd>{finalScopePreview.networkLabels.join(', ')}</dd></div>
              </dl>
            </div>

            {!verifiedOnSigningChain && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Verify wallet on {chainName(signingChainId)}</p>
                <p className="mt-2 leading-6">
                  Mandates for this policy must be signed on {chainName(signingChainId)}. Verify your connected wallet
                  on this network before signing — Arbitrum verification does not cover Robinhood Testnet.
                </p>
                <button
                  type="button"
                  className="app-btn app-btn-primary mt-3"
                  onClick={() => setVerifyOpen(true)}
                >
                  Verify on {chainName(signingChainId)}
                </button>
              </div>
            )}

            {(setup.actionError || setup.actionSuccess) && (
              <div
                className={`rounded-xl border p-3 text-sm ${
                  setup.actionError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {setup.actionError ?? setup.actionSuccess}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button type="button" className="app-btn app-btn-outline" onClick={onClose}>
                {mandateActive ? 'Done' : 'Cancel'}
              </button>
              {!mandateActive && (
                <button
                  type="submit"
                  className="app-btn app-btn-primary"
                  disabled={
                    !allowedChains.length ||
                    !verifiedOnSigningChain ||
                    setup.isSigningMandate ||
                    setup.isMandatePending
                  }
                >
                  {setup.isSigningMandate || setup.isMandatePending ? 'Signing…' : 'Sign mandate'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>

    <VerifyWalletModal
      open={verifyOpen}
      chainId={signingChainId}
      onClose={() => {
        setVerifyOpen(false);
        void setup.refetch();
      }}
      onVerified={() => {
        setVerifyOpen(false);
        void setup.refetch();
      }}
    />
    </>
  );
}
