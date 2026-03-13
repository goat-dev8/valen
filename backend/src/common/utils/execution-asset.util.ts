import { Address, getAddress } from 'viem';
import { DEFAULT_E2E_ASSET } from '../constants/onchain.constants';

export const ARBITRUM_SEPOLIA_USDC =
  '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as const;

export type SettlementMode = 'native_eth' | 'policy_label_only';

export type AssetDisplayMetadata = {
  assetAddress: string | null;
  assetSymbol: string;
  assetDecimals: number;
  settlementMode: SettlementMode;
  settlementExplanation: string;
};

const USDC_BY_CHAIN: Record<number, string> = {
  421614: ARBITRUM_SEPOLIA_USDC,
};

export function resolveOnChainAssetAddress(assetAddress: string | null | undefined): Address {
  const trimmed = assetAddress?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'native') {
    return DEFAULT_E2E_ASSET;
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    return DEFAULT_E2E_ASSET;
  }
  return getAddress(trimmed.toLowerCase() as Address);
}

export function resolveAssetDisplayMetadata(
  chainId: number,
  assetAddress: string | null | undefined,
): AssetDisplayMetadata {
  const trimmed = assetAddress?.trim() ?? null;
  const normalized = trimmed?.toLowerCase();

  if (!trimmed || normalized === 'native') {
    return {
      assetAddress: null,
      assetSymbol: 'ETH',
      assetDecimals: 18,
      settlementMode: 'native_eth',
      settlementExplanation:
        'Native ETH is governed by mandate/policy and settled by the VALEN operator relayer.',
    };
  }

  const usdc = USDC_BY_CHAIN[chainId];
  if (usdc && normalized === usdc.toLowerCase()) {
    return {
      assetAddress: usdc,
      assetSymbol: 'USDC',
      assetDecimals: 6,
      settlementMode: 'policy_label_only',
      settlementExplanation:
        'USDC is the policy and mandate scope asset. Settlement relayer delivers native ETH today; ERC-20 transfer is a future phase.',
    };
  }

  if (normalized === 'tsla') {
    return {
      assetAddress: 'TSLA',
      assetSymbol: 'TSLA',
      assetDecimals: 0,
      settlementMode: 'policy_label_only',
      settlementExplanation:
        'TSLA is a Robinhood tokenized-asset demo label in mandate/policy. Settlement relayer delivers native ETH today.',
    };
  }

  if (/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    return {
      assetAddress: getAddress(trimmed.toLowerCase() as Address),
      assetSymbol: 'TOKEN',
      assetDecimals: 18,
      settlementMode: 'policy_label_only',
      settlementExplanation:
        'Token address is validated in mandate/policy. Settlement relayer delivers native ETH today.',
    };
  }

  return {
    assetAddress: trimmed,
    assetSymbol: trimmed.toUpperCase(),
    assetDecimals: 0,
    settlementMode: 'policy_label_only',
    settlementExplanation:
      'Asset label is validated in mandate/policy. Settlement relayer delivers native ETH today.',
  };
}
