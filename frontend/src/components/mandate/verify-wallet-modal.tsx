'use client';

import { useEffect } from 'react';
import { CheckCircle, ShieldCheck, Wallet, X } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { useAuthoritySetup } from '@/hooks/use-authority-setup';
import { chainName } from '@/lib/constants';
import { shortAddress } from '@/lib/authority-wallet-signing';
import { walletChainBannerMessage } from '@/lib/wallet-chain';

type VerifyWalletModalProps = {
  open: boolean;
  onClose: () => void;
  onVerified?: () => void;
  chainId?: number;
};

export function VerifyWalletModal({ open, onClose, onVerified, chainId: chainIdProp }: VerifyWalletModalProps) {
  const setup = useAuthoritySetup(chainIdProp);

  useEffect(() => {
    if (chainIdProp) setup.setChainId(chainIdProp);
  }, [chainIdProp, setup.setChainId]);

  if (!open) return null;

  const handleVerify = async () => {
    const ok = await setup.handleVerifyConnectedWallet();
    if (ok) {
      await setup.refetch();
      onVerified?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#012b54]/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-wallet-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#E8ECF0] bg-white shadow-[0_24px_64px_-12px_rgba(0,102,255,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E8ECF0] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066FF]">Authority setup</p>
            <h2 id="verify-wallet-modal-title" className="app-section-title mt-1 text-xl text-[#012b54]">
              Verify owner wallet
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#8B98A5] hover:bg-[#F4F6F8]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF2FF]">
            <ShieldCheck className="h-6 w-6 text-[#0066FF]" />
          </div>
          <p className="text-sm leading-6 text-[#5E6C7B]">
            Sign a wallet ownership challenge before VALEN treats this wallet as the organization authority source.
            The message signature is proof only — it does not send an on-chain transaction.
          </p>

          <div className="app-form-group">
            <label htmlFor="verify-chain">Authority chain</label>
            <select
              id="verify-chain"
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
              <p className="font-semibold">Your wallet is on the wrong network</p>
              <p className="mt-2 leading-6">{walletChainBannerMessage(setup.effectiveWalletChainId, setup.chainId)}</p>
              <button
                type="button"
                className="app-btn app-btn-primary mt-4"
                disabled={!setup.connectedWallet || setup.isSwitchingChain}
                onClick={setup.handleSwitchWalletNetwork}
              >
                {setup.isSwitchingChain ? 'Switching network…' : `Switch wallet to ${chainName(setup.chainId)}`}
              </button>
            </div>
          )}

          {setup.unsupportedConnectedChain && !setup.walletNeedsChainSwitch && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Connected wallet is on {chainName(setup.effectiveWalletChainId)}. VALEN supports Arbitrum Sepolia and
              Robinhood Testnet.
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-[#E8ECF0] bg-[#FAFBFC] p-4">
            <div className="wallet-row">
              <span>Connected wallet</span>
              <code>{shortAddress(setup.connectedWallet?.address)}</code>
            </div>
            <div className="wallet-row">
              <span>Wallet network</span>
              <strong>
                {setup.effectiveWalletChainId
                  ? `${chainName(setup.effectiveWalletChainId)} (${setup.effectiveWalletChainId})`
                  : 'Unknown'}
              </strong>
            </div>
            <div className="wallet-row">
              <span>Verification status</span>
              <strong>{setup.verifiedForAuthorityChain ? 'Verified owner' : 'Not verified'}</strong>
            </div>
            <div className="wallet-row">
              <span>Authority chain</span>
              <ChainBadge chainId={setup.chainId} />
            </div>
          </div>

          {setup.verifiedForAuthorityChain && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle className="mr-2 inline h-4 w-4" />
              Wallet verified on {chainName(setup.chainId)}.
            </div>
          )}

          {(setup.actionError || setup.actionSuccess) && (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                setup.actionError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {setup.actionError ?? setup.actionSuccess}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[#E8ECF0] pt-4 sm:flex-row sm:justify-end">
            <button type="button" className="app-btn app-btn-outline" onClick={onClose}>
              {setup.verifiedForAuthorityChain ? 'Done' : 'Cancel'}
            </button>
            {!setup.verifiedForAuthorityChain && (
              <button
                type="button"
                className="app-btn app-btn-primary"
                disabled={!setup.connectedWallet || setup.isVerifying}
                onClick={handleVerify}
              >
                <Wallet className="h-4 w-4" />
                {setup.isVerifying ? 'Verifying…' : 'Verify connected wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
