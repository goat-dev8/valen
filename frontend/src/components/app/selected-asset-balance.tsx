'use client';

import { useWalletBalanceForChain } from '@/hooks/use-wallet-balances';
import { knownAssetForMandateValue } from '@/lib/known-assets';

type SelectedAssetBalanceProps = {
  walletAddress?: string | null;
  chainId: number;
  assetValue: string;
};

function formatBalance(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num === 0) return '0';
  if (num < 0.0001) return num.toExponential(2);
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function SelectedAssetBalance({ walletAddress, chainId, assetValue }: SelectedAssetBalanceProps) {
  const { data, isLoading, isError } = useWalletBalanceForChain(walletAddress, chainId);
  const asset = knownAssetForMandateValue(chainId, assetValue);

  if (!walletAddress) {
    return (
      <p className="mt-2 rounded-xl border border-dashed border-[#eef0f3] bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
        Connect your wallet to see how much {asset?.symbol ?? 'of this asset'} you can settle.
      </p>
    );
  }

  if (isLoading) {
    return <p className="mt-2 text-xs text-[#64748b]">Loading {asset?.symbol ?? 'asset'} balance…</p>;
  }
  if (isError || !data) {
    return <p className="mt-2 text-xs text-red-600">Could not load wallet balance for this chain.</p>;
  }

  let balanceLabel = `${formatBalance(data.nativeFormatted)} ${data.nativeSymbol}`;
  let detail = 'Native gas balance on this chain.';

  if (asset && asset.address !== 'native') {
    const token = data.tokens.find(
      (row) =>
        row.address.toLowerCase() === asset.address.toLowerCase() ||
        row.symbol.toUpperCase() === asset.symbol.toUpperCase(),
    );
    if (token) {
      balanceLabel = `${formatBalance(token.formatted)} ${token.symbol}`;
      detail = `Settlement wallet balance for ${asset.symbol}. Ensure allowance covers the amount you enter.`;
    } else {
      balanceLabel = `0 ${asset.symbol}`;
      detail = `No ${asset.symbol} detected in your connected wallet on this chain.`;
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-[#eef0f3] bg-[#f8fafc] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#007dfc]">Your balance</p>
      <p className="mt-1 text-sm font-semibold text-[#012b54]">{balanceLabel}</p>
      <p className="mt-1 text-xs leading-5 text-[#64748b]">{detail}</p>
    </div>
  );
}

export function compareAmountToBalance(
  amount: string,
  decimals: number,
  walletFormatted?: string,
): { ok: boolean; message?: string } {
  if (!amount.trim() || !walletFormatted) return { ok: true };
  try {
    const requested = Number(amount);
    const available = Number(walletFormatted);
    if (!Number.isFinite(requested) || !Number.isFinite(available)) return { ok: true };
    if (requested > available) {
      return {
        ok: false,
        message: `Amount exceeds wallet balance (${formatBalance(walletFormatted)} available). Lower the amount or fund the wallet.`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
