import { formatUnits } from 'viem';
import { ARBITRUM_SEPOLIA_USDC, knownAssetForMandateValue } from './known-assets';

const USDC_DECIMALS = 6;

export function assetDecimals(chainId: number, assetAddress?: string | null): number {
  if (!assetAddress || assetAddress === 'native') return 18;
  const known = knownAssetForMandateValue(chainId, assetAddress);
  if (known) return known.decimals;
  if (assetAddress.toLowerCase() === ARBITRUM_SEPOLIA_USDC.toLowerCase()) return USDC_DECIMALS;
  return 18;
}

export function formatBaseUnitsAmount(
  baseUnits: string | null | undefined,
  decimals: number,
  symbol = 'USDC',
): string {
  if (!baseUnits) return 'Unavailable';
  try {
    const human = formatUnits(BigInt(baseUnits), decimals);
    return `${human} ${symbol}`;
  } catch {
    return `${baseUnits} ${symbol}`;
  }
}

/** Accepts human-readable or base-unit strings from API/DB. */
export function formatProofAmount(
  amount: string | null | undefined,
  chainId: number,
  assetAddress?: string | null,
  symbol = 'USDC',
): string {
  if (!amount) return 'Unavailable';
  if (/^\d+\.\d+$/.test(amount)) return `${amount} ${symbol}`;

  const decimals = assetDecimals(chainId, assetAddress);
  try {
    const raw = BigInt(amount);
    const threshold = BigInt(10) ** BigInt(Math.max(decimals - 2, 0));
    if (raw >= threshold) {
      return formatBaseUnitsAmount(amount, decimals, symbol);
    }
    return `${amount} ${symbol}`;
  } catch {
    return `${amount} ${symbol}`;
  }
}
