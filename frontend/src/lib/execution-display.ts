import type { ExecutionDto } from '@/types/api';
import { knownAssetForMandateValue, robinhoodAssetByTicker, type KnownAsset } from './known-assets';
import { formatProofAmount } from './token-amount';

export function resolveExecutionAsset(execution: {
  targetChainId: number;
  assetAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}): KnownAsset | undefined {
  if (execution.assetAddress) {
    const byAddress = knownAssetForMandateValue(execution.targetChainId, execution.assetAddress);
    if (byAddress) return byAddress;
  }
  const robinhood = execution.metadata?.robinhood as { ticker?: string } | undefined;
  if (robinhood?.ticker) {
    return robinhoodAssetByTicker(robinhood.ticker);
  }
  return undefined;
}

export function formatExecutionAmount(execution: {
  valueAmount?: string | null;
  targetChainId: number;
  assetAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const asset = resolveExecutionAsset(execution);
  return formatProofAmount(
    execution.valueAmount,
    execution.targetChainId,
    execution.assetAddress ?? asset?.address,
    asset?.symbol ?? 'USDC',
  );
}

export function executionAssetSymbol(execution: ExecutionDto): string {
  return resolveExecutionAsset(execution)?.symbol ?? 'USDC';
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
