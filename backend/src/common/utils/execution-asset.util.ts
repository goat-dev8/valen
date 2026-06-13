import { Address, getAddress } from 'viem';
import {
  isRobinhoodStockSymbol,
  resolveRobinhoodTickerAddress,
  ROBINHOOD_TESTNET_USDG,
} from '../constants/robinhood.constants';
import { DEFAULT_E2E_ASSET } from '../constants/onchain.constants';

export function resolveOnChainAssetAddress(assetAddress: string | null | undefined): Address {
  const trimmed = assetAddress?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'native') {
    return DEFAULT_E2E_ASSET;
  }

  const tickerAddress = resolveRobinhoodTickerAddress(trimmed);
  if (tickerAddress) {
    return getAddress(tickerAddress);
  }

  if (trimmed.toUpperCase() === 'USDG') {
    return getAddress(ROBINHOOD_TESTNET_USDG);
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    throw new Error(`Unknown asset identifier for settlement: ${trimmed}`);
  }

  return getAddress(trimmed.toLowerCase() as Address);
}

export function normalizeAssetSymbol(assetAddress: string | null | undefined): string | null {
  const trimmed = assetAddress?.trim();
  if (!trimmed) return null;
  if (isRobinhoodStockSymbol(trimmed)) return trimmed.toUpperCase();
  if (trimmed.toUpperCase() === 'USDG') return 'USDG';
  if (trimmed.toLowerCase() === 'native') return 'ETH';
  return trimmed;
}
