import { parseEther } from 'viem';

/**
 * Parses dashboard/API execution amounts into wei.
 * Accepts integer wei strings ("10000000000000000") or decimal ETH ("0.01").
 */
export function parseExecutionAmountWei(value: string | null | undefined): bigint {
  if (!value?.trim()) {
    throw new Error('Execution amount is required');
  }

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return BigInt(trimmed);
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseEther(trimmed);
  }

  throw new Error(`Invalid execution amount: ${value}`);
}

export function normalizeExecutionAmountWei(value: string): string {
  return parseExecutionAmountWei(value).toString();
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
