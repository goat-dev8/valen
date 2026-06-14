'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { MandateScopeFields } from '@/components/mandate/mandate-scope-fields';
import { useAuthoritySetup } from '@/hooks/use-authority-setup';
import {
  DEFAULT_SUPPORTED_ACTIONS,
  DEFAULT_SUPPORTED_ASSETS,
  DEFAULT_SUPPORTED_NETWORKS,
} from '@/lib/agent-scope';
import { walletChainBannerMessage } from '@/lib/wallet-chain';
import { chainName } from '@/lib/constants';

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
  const [allowedChains, setAllowedChains] = useState(initialNetworks);
  const [allowedAssets, setAllowedAssets] = useState(initialAssets);
  const [allowedActions, setAllowedActions] = useState(initialActions);
  const [allAssets, setAllAssets] = useState(false);

  if (!open) return null;

  const signingChainId = allowedChains[0] ?? 421614;

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

  return (
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
            Multi-chain mandate — select allowed networks, assets, and actions. Signing uses{' '}
            {chainName(signingChainId)}.
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
              <select id="mandate-policyId" name="policyId" className="app-input" defaultValue={defaultPolicyId ?? ''}>
                <option value="">Agent default policy</option>
                {setup.policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </div>

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
              <input id="allowedTargets" name="allowedTargets" className="app-input" defaultValue="*" />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="app-form-group">
                <label htmlFor="maxPerTransaction">Max / tx</label>
                <input id="maxPerTransaction" name="maxPerTransaction" className="app-input" placeholder="0.1 ETH" />
              </div>
              <div className="app-form-group">
                <label htmlFor="maxTotal">Max total</label>
                <input id="maxTotal" name="maxTotal" className="app-input" placeholder="1 ETH" />
              </div>
              <div className="app-form-group">
                <label htmlFor="validDays">Valid days</label>
                <input id="validDays" name="validDays" className="app-input" type="number" min={1} defaultValue={30} />
              </div>
            </div>

            <div className="app-form-group">
              <label htmlFor="approvalThreshold">Approval threshold</label>
              <input
                id="approvalThreshold"
                name="approvalThreshold"
                className="app-input"
                placeholder="risk > 70 or amount > 0.5 ETH"
              />
            </div>

            {!setup.verifiedForAuthorityChain(signingChainId) && (
              <p className="text-xs font-medium text-amber-700">
                Verify the connected wallet on {chainName(signingChainId)} before signing mandates.
              </p>
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
                    !setup.verifiedForAuthorityChain(signingChainId) ||
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
  );
}
