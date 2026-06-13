import { formatUnits, parseUnits } from 'viem';

export function previewExecutionAmount(value: string, decimals: number): string | null {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null;
  try {
    return formatUnits(parseUnits(trimmed, decimals), decimals);
  } catch {
    return null;
  }
}

export function executionAmountBaseUnits(value: string, decimals: number): string | null {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null;
  try {
    return parseUnits(trimmed, decimals).toString();
  } catch {
    return null;
  }
}

export function executionAmountLabel(value: string, decimals: number, symbol: string): string {
  const human = previewExecutionAmount(value, decimals);
  const base = executionAmountBaseUnits(value, decimals);
  if (!human || !base) return value || 'Not set';
  return `${human} ${symbol}`;
}
