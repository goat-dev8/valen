'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthoritySetup } from '@/hooks/use-authority-setup';
import { chainName } from '@/lib/constants';
import { walletChainBannerMessage } from '@/lib/wallet-chain';

type SignMandateModalProps = {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName?: string;
  defaultPolicyId?: string | null;
  onSigned?: () => void;
  chainId?: number;
};

export function SignMandateModal({
  open,
  onClose,
  agentId,
  agentName,
  defaultPolicyId,
  onSigned,
  chainId: chainIdProp,
}: SignMandateModalProps) {
  const setup = useAuthoritySetup(chainIdProp);

  useEffect(() => {
    if (chainIdProp) setup.setChainId(chainIdProp);
  }, [chainIdProp, setup.setChainId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const ok = await setup.handleCreateMandate(e);
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
            Bind a verified owner wallet to this agent with policy, chains, actions, targets, limits, and expiry —
            same flow as Wallet &amp; Authority.
          </p>

          <div className="app-form-group">
            <label htmlFor="mandate-chain">Authority chain</label>
            <select
              id="mandate-chain"
              className="app-input"
              value={setup.chainId}
              onChange={(e) => setup.setChainId(Number(e.target.value))}
            >
              <option value={421614}>Arbitrum Sepolia</option>
              <option value={46630}>Robinhood Testnet</option>
            </select>
          </div>

          {setup.walletNeedsChainSwitch && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Switch network before signing</p>
              <p className="mt-2 leading-6">{walletChainBannerMessage(setup.effectiveWalletChainId, setup.chainId)}</p>
              <button
                type="button"
                className="app-btn app-btn-primary mt-4"
                disabled={setup.isSwitchingChain}
                onClick={setup.handleSwitchWalletNetwork}
              >
                {setup.isSwitchingChain ? 'Switching…' : `Switch to ${chainName(setup.chainId)}`}
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

            <div className="grid gap-3 md:grid-cols-2">
              <div className="app-form-group">
                <label htmlFor="allowedActions">Allowed actions</label>
                <input id="allowedActions" name="allowedActions" className="app-input" defaultValue="transfer" />
              </div>
              <div className="app-form-group">
                <label htmlFor="allowedAssets">Allowed assets</label>
                <input id="allowedAssets" name="allowedAssets" className="app-input" defaultValue="native" />
              </div>
            </div>

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

            {!setup.verifiedForAuthorityChain && (
              <p className="text-xs font-medium text-amber-700">
                Verify the connected wallet on {chainName(setup.chainId)} before signing mandates.
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
                  disabled={!setup.verifiedForAuthorityChain || setup.isSigningMandate || setup.isMandatePending}
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
