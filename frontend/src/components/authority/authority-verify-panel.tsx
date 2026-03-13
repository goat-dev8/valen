'use client';

import { useState } from 'react';
import { CheckCircle, Copy, ShieldCheck, Wallet } from 'lucide-react';
import { ChainBadge } from '@/components/app/chain-badge';
import { shortAddress } from '@/lib/authority-wallet-signing';
import type { WalletVerificationDto } from '@/types/api';

type AuthorityVerifyPanelProps = {
  connectedAddress?: string;
  effectiveWalletChainId: number | null;
  authorityChainId: number;
  verifiedForChain?: WalletVerificationDto;
  isVerifying: boolean;
  canVerify: boolean;
  onVerify: () => void;
};

export function AuthorityVerifyPanel({
  connectedAddress,
  effectiveWalletChainId,
  authorityChainId,
  verifiedForChain,
  isVerifying,
  canVerify,
  onVerify,
}: AuthorityVerifyPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!connectedAddress) return;
    await navigator.clipboard.writeText(connectedAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section id="verify-wallet" className="app-panel-floating authority-panel">
      <div className="authority-panel__header authority-panel__header--with-icon">
        <div className="authority-panel__icon-wrap">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="authority-panel__title">Verify owner wallet</h2>
          <p className="authority-panel__desc">
            Sign a wallet ownership challenge on <ChainBadge chainId={authorityChainId} />. Proof only — no transaction.
          </p>
        </div>
      </div>

      <dl className="authority-facts">
        <div className="authority-facts__row">
          <dt>Connected wallet</dt>
          <dd>
            <code>{shortAddress(connectedAddress)}</code>
            {connectedAddress && (
              <button type="button" className="authority-facts__copy" onClick={copyAddress}>
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </dd>
        </div>
        <div className="authority-facts__row">
          <dt>Wallet network</dt>
          <dd>
            {effectiveWalletChainId ? (
              <ChainBadge chainId={effectiveWalletChainId} />
            ) : (
              'Unknown'
            )}
          </dd>
        </div>
        <div className="authority-facts__row">
          <dt>Authority chain</dt>
          <dd>
            <ChainBadge chainId={authorityChainId} />
          </dd>
        </div>
        <div className="authority-facts__row">
          <dt>Status</dt>
          <dd>
            <span className={`authority-status-pill ${verifiedForChain ? 'authority-status-pill--ok' : 'authority-status-pill--warn'}`}>
              {verifiedForChain ? 'Verified owner' : 'Not verified'}
            </span>
          </dd>
        </div>
      </dl>

      {verifiedForChain && (
        <p className="authority-success-note">
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
          Verified{' '}
          {verifiedForChain.verifiedAt
            ? new Date(verifiedForChain.verifiedAt).toLocaleString()
            : 'on this chain'}
        </p>
      )}

      {!verifiedForChain && (
        <button type="button" className="app-btn app-btn-primary" disabled={!canVerify || isVerifying} onClick={onVerify}>
          <Wallet className="h-4 w-4" />
          {isVerifying ? 'Verifying…' : 'Verify connected wallet'}
        </button>
      )}

      {!connectedAddress && (
        <p className="authority-hint">Connect a wallet with the header control before verifying.</p>
      )}
    </section>
  );
}
