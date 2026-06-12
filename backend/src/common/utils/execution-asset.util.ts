import { Address, getAddress } from 'viem';
import { DEFAULT_E2E_ASSET } from '../constants/onchain.constants';

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
