import { parseEther, parseUnits } from 'viem';

/**
 * Parses dashboard/API execution amounts into base units.
 * Accepts integer base-unit strings ("1000000") or decimal user units ("1.25").
 */
export function parseExecutionAmount(
  value: string | null | undefined,
  decimals = 18,
): bigint {
  if (!value?.trim()) {
    throw new Error('Execution amount is required');
  }

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return BigInt(trimmed);
  }

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
