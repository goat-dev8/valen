import { formatUnits } from 'viem';
import { ARBITRUM_SEPOLIA_USDC, knownAssetForMandateValue } from './known-assets';

const USDC_DECIMALS = 6;

/** Coerce API/DB budget fields (numeric strings, integers) into base-unit bigint. */
export function parseUsdcBaseUnits(value?: string | number | null): bigint | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return BigInt(Math.trunc(value));
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return BigInt(raw);
  if (/^\d+\.\d+$/.test(raw)) {
    const [whole, frac = ''] = raw.split('.');
    if (!frac || /^0+$/.test(frac)) return BigInt(whole || '0');
    const fracPadded = frac.padEnd(USDC_DECIMALS, '0').slice(0, USDC_DECIMALS);
    return BigInt(`${whole}${fracPadded}`);
  }
  try {
    return BigInt(raw.split('.')[0] || '0');
  } catch {
    return null;
  }
}

/** Formats USDC amounts stored as 6-decimal base units (API / budget rows). */
export function formatUsdcBaseUnits(
  baseUnits?: string | number | null,
  options?: { maxFractionDigits?: number; fallback?: string },
): string {
  const parsed = parseUsdcBaseUnits(baseUnits);
  if (parsed == null) return options?.fallback ?? '0';
  try {
    const human = formatUnits(parsed, USDC_DECIMALS);
    const num = Number(human);
    if (!Number.isFinite(num)) return human;
    return num.toLocaleString(undefined, {
      maximumFractionDigits: options?.maxFractionDigits ?? 4,
    });
  } catch {
    return String(baseUnits ?? options?.fallback ?? '0');
  }
}

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
