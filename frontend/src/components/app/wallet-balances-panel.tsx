'use client';

import { ChainBadge } from '@/components/app/chain-badge';
import { useWalletBalances } from '@/hooks/use-wallet-balances';

type WalletBalancesPanelProps = {
  walletAddress?: string | null;
  chainId?: number;
  compact?: boolean;
};

export function WalletBalancesPanel({ walletAddress, chainId, compact = false }: WalletBalancesPanelProps) {
  const { data, isLoading, isError, refetch, isFetching } = useWalletBalances(walletAddress);

  if (!walletAddress) {
    return (
      <p className="text-sm text-[#64748b]">Connect a wallet to see live balances on Arbitrum Sepolia and Robinhood Testnet.</p>
    );
  }

  const rows = chainId != null ? data?.filter((row) => row.chainId === chainId) : data;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#012b54]">Your wallet balances</p>
        <button
          type="button"
          className="text-xs font-medium text-[#007dfc] hover:underline disabled:opacity-50"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {isLoading && <p className="text-sm text-[#64748b]">Loading balances from chain RPC…</p>}
      {isError && <p className="text-sm text-red-600">Could not load balances. Try refresh.</p>}

      {rows?.map((row) => (
        <div key={row.chainId} className={`rounded-2xl border border-[#eef0f3] ${compact ? 'p-3' : 'p-4'}`}>
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

      {!compact && (
        <p className="text-xs leading-5 text-[#64748b]">
          Balances are read directly from chain RPC (your Privy wallet). USDC on Arbitrum Sepolia and USDG on Robinhood Testnet use ERC-20 reads; stock-token tickers stay metadata-only until their token contracts are discovered.
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
