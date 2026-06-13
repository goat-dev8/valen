import { formatUnits, parseEther, parseUnits } from 'viem';

/**
 * Parses dashboard/API execution amounts into base units.
 * All numeric strings are treated as human-readable token amounts ("1", "0.001", "1.25").
 */
export function parseExecutionAmount(
  value: string | null | undefined,
  decimals = 18,
): bigint {
  if (!value?.trim()) {
    throw new Error('Execution amount is required');
  }

  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return decimals === 18 ? parseEther(trimmed) : parseUnits(trimmed, decimals);
  }

  throw new Error(`Invalid execution amount: ${value}`);
}

export function parseExecutionAmountWei(value: string | null | undefined): bigint {
  return parseExecutionAmount(value, 18);
}

export function normalizeExecutionAmount(value: string, decimals = 18): string {
  return parseExecutionAmount(value, decimals).toString();
}

export function normalizeExecutionAmountWei(value: string): string {
  return normalizeExecutionAmount(value, 18);
}

export function executionAmountWeiOrDefault(
  value: string | null | undefined,
  fallback: bigint,
): bigint {
  if (!value?.trim()) {
    return fallback;
  }
  return parseExecutionAmountWei(value);
}

/** Reads value_amount from DB — already normalized base units, never re-parse as human amount. */
export function readStoredBaseUnits(
  value: string | null | undefined,
  fallback: bigint,
): bigint {
  if (!value?.trim()) {
    return fallback;
  }
  return BigInt(value.trim());
}

import {
  ROBINHOOD_STOCK_TOKENS,
  ROBINHOOD_TESTNET_USDG,
} from '../constants/robinhood.constants';

const USDC_SEPOLIA = '0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d';

export function assetDecimalsForAddress(assetAddress?: string | null): number {
  if (!assetAddress || assetAddress.toLowerCase() === 'native') return 18;
  const lower = assetAddress.toLowerCase();
  if (lower === USDC_SEPOLIA || lower === ROBINHOOD_TESTNET_USDG.toLowerCase()) {
    return 6;
  }
  for (const token of Object.values(ROBINHOOD_STOCK_TOKENS)) {
    if (token.address.toLowerCase() === lower) return token.decimals;
  }
  return 18;
}

export function formatBaseUnitsForDisplay(
  baseUnits: string | null | undefined,
  assetAddress?: string | null,
): string | null {
  if (!baseUnits) return null;
  try {
    return formatUnits(BigInt(baseUnits), assetDecimalsForAddress(assetAddress));
  } catch {
    return baseUnits;
  }
}
