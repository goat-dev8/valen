export type KnownAsset = {
  id: string;
  label: string;
  /** Mandate / intent field: `native`, symbol, or token contract address */
  mandateValue: string;
  decimals: number;
  /** What the settlement relayer actually moves today */
  settlementMode: 'native_eth' | 'policy_label_only';
  hint?: string;
};

export const ARBITRUM_SEPOLIA_USDC =
  '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as const;

const ASSETS_BY_CHAIN: Record<number, KnownAsset[]> = {
  421614: [
    {
      id: 'native',
      label: 'Native ETH',
      mandateValue: 'native',
      decimals: 18,
      settlementMode: 'native_eth',
    },
    {
      id: 'usdc',
      label: 'USDC (Arbitrum Sepolia)',
      mandateValue: ARBITRUM_SEPOLIA_USDC,
      decimals: 6,
      settlementMode: 'policy_label_only',
      hint: 'Mandate/policy can scope USDC; relayer settlement still delivers native ETH today.',
    },
  ],
  46630: [
    {
      id: 'native',
      label: 'Native ETH',
      mandateValue: 'native',
      decimals: 18,
      settlementMode: 'native_eth',
    },
    {
      id: 'tsla',
      label: 'TSLA (Robinhood demo label)',
      mandateValue: 'TSLA',
      decimals: 0,
      settlementMode: 'policy_label_only',
      hint: 'Demo asset label for Robinhood path; on-chain settlement relays ETH.',
    },
  ],
};

export function knownAssetsForChain(chainId: number): KnownAsset[] {
  return ASSETS_BY_CHAIN[chainId] ?? ASSETS_BY_CHAIN[421614];
}

export function knownAssetForMandateValue(chainId: number, mandateValue: string): KnownAsset | undefined {
  const normalized = mandateValue.trim().toLowerCase();
  return knownAssetsForChain(chainId).find(
    (asset) => asset.mandateValue.toLowerCase() === normalized,
  );
}

export function settlementLabelForAsset(chainId: number, mandateValue: string): string {
  const asset = knownAssetForMandateValue(chainId, mandateValue);
  if (!asset || asset.settlementMode === 'native_eth') {
    return 'Settlement relayer sends native ETH to the target address.';
  }
  return asset.hint ?? 'Asset is validated in mandate/policy; settlement relayer sends native ETH today.';
}
