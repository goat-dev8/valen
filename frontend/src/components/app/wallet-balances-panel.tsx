'use client';

import { ChainBadge } from '@/components/app/chain-badge';
import { useWalletBalances } from '@/hooks/use-wallet-balances';

type WalletBalancesPanelProps = {
  walletAddress?: string | null;
  chainId?: number;
  compact?: boolean;
  layout?: 'stack' | 'grid';
};

export function WalletBalancesPanel({
  walletAddress,
  chainId,
  compact = false,
  layout = 'stack',
}: WalletBalancesPanelProps) {
  const { data, isLoading, isError, refetch, isFetching } = useWalletBalances(walletAddress);

  if (!walletAddress) {
    return (
      <p className="text-sm text-[#64748b]">Connect a wallet to see live balances on Arbitrum Sepolia and Robinhood Testnet.</p>
    );
  }

  const rows = chainId != null ? data?.filter((row) => row.chainId === chainId) : data;

  return (
    <div className="wallet-balances-panel">
      <div className="wallet-balances-panel__toolbar">
        <p className="wallet-balances-panel__title">Your wallet balances</p>
        <button
          type="button"
          className="wallet-balances-panel__refresh"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {isLoading && <p className="wallet-balances-panel__hint">Loading balances from chain RPC…</p>}
      {isError && <p className="wallet-balances-panel__error">Could not load balances. Try refresh.</p>}

      <div className={layout === 'grid' ? 'wallet-balances-panel__grid' : 'wallet-balances-panel__stack'}>
        {rows?.map((row) => (
          <div
            key={row.chainId}
            className={`wallet-balances-panel__chain ${compact ? 'wallet-balances-panel__chain--compact' : ''}`}
          >
          <div className="mb-2 flex items-center justify-between gap-2">
            <ChainBadge chainId={row.chainId} />
            <span className="font-mono text-xs text-[#64748b]">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#64748b]">{row.nativeSymbol}</span>
              <strong className="text-[#012b54]">{formatBalance(row.nativeFormatted)} {row.nativeSymbol}</strong>
            </div>
            {row.tokens.map((token) => (
              <div key={token.address} className="flex items-center justify-between gap-3">
                <span className="text-[#64748b]">{token.symbol}</span>
                <strong className="text-[#012b54]">{formatBalance(token.formatted)} {token.symbol}</strong>
              </div>
            ))}
          </div>
        </div>
        ))}
      </div>

      {!compact && (
        <p className="wallet-balances-panel__footnote">
          Balances are read directly from chain RPC (your Privy wallet). USDC, USDG, and Robinhood stock tokens use verified ERC-20 contract reads.
        </p>
      )}
    </div>
  );
}

function formatBalance(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num === 0) return '0';
  if (num < 0.0001) return num.toExponential(2);
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
