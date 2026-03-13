'use client';

import { WalletBalancesPanel } from '@/components/app/wallet-balances-panel';
import { ChainBadge } from '@/components/app/chain-badge';
import { shortAddress } from '@/lib/authority-wallet-signing';

type AuthoritySidebarProps = {
  walletAddress?: string;
  authorityChainId: number;
  verifiedCount: number;
  activeMandateCount: number;
};

export function AuthoritySidebar({
  walletAddress,
  authorityChainId,
  verifiedCount,
  activeMandateCount,
}: AuthoritySidebarProps) {
  return (
    <aside className="authority-sidebar space-y-5">
      <section className="app-panel-floating authority-sidebar__stats">
        <h3 className="authority-sidebar__title">Authority status</h3>
        <dl className="authority-sidebar__kpis">
          <div>
            <dt>Verified wallets</dt>
            <dd>{verifiedCount}</dd>
          </div>
          <div>
            <dt>Active mandates</dt>
            <dd>{activeMandateCount}</dd>
          </div>
        </dl>
        <div className="authority-sidebar__chain">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#8B98A5]">Selected chain</span>
          <ChainBadge chainId={authorityChainId} />
        </div>
        {walletAddress && (
          <p className="authority-sidebar__wallet">
            Connected <code>{shortAddress(walletAddress)}</code>
          </p>
        )}
      </section>

      <section className="app-panel-floating authority-sidebar__balances">
        <WalletBalancesPanel walletAddress={walletAddress} chainId={authorityChainId} compact />
      </section>
    </aside>
  );
}
