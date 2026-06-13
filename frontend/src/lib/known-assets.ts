export type KnownAsset = {
  id: string;
  label: string;
  symbol: string;
  /** Mandate / intent field: `native`, symbol, or token contract address */
  mandateValue: string;
  decimals: number;
  category: 'stablecoin' | 'gas' | 'rwa-stock-token';
  supportLevel: 'demo-ready' | 'legacy' | 'metadata-only' | 'unverified';
  /** What the settlement relayer actually moves today */
  settlementMode: 'native_eth' | 'erc20_transfer' | 'policy_label_only';
  hint?: string;
  scenario?: {
    allowedAmount: string;
    refusedAmount: string;
    safePath: string;
    refusedPath: string;
  };
};

export const ARBITRUM_SEPOLIA_USDC =
  '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as const;
export const ROBINHOOD_TESTNET_USDG =
  '0x7E955252E15c84f5768B83c41a71F9eba181802F' as const;

export const ROBINHOOD_STOCK_TICKERS = ['TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD'] as const;
export type RobinhoodStockTicker = (typeof ROBINHOOD_STOCK_TICKERS)[number];

const ROBINHOOD_STOCK_METADATA: Record<RobinhoodStockTicker, { name: string; refusedAmount: string }> = {
  TSLA: { name: 'Tesla', refusedAmount: '250' },
  AMZN: { name: 'Amazon', refusedAmount: '250' },
  PLTR: { name: 'Palantir', refusedAmount: '250' },
  NFLX: { name: 'Netflix', refusedAmount: '250' },
  AMD: { name: 'AMD', refusedAmount: '250' },
};

const ASSETS_BY_CHAIN: Record<number, KnownAsset[]> = {
  421614: [
    {
      id: 'usdc',
      label: 'USDC (Arbitrum Sepolia)',
      symbol: 'USDC',
      mandateValue: ARBITRUM_SEPOLIA_USDC,
      decimals: 6,
      category: 'stablecoin',
      supportLevel: 'demo-ready',
      settlementMode: 'erc20_transfer',
      hint: 'Default VALEN asset. Phase C token adapter settles USDC; legacy ETH remains available for fallback.',
    },
    {
      id: 'native',
      label: 'Legacy / Gas ETH',
      symbol: 'ETH',
      mandateValue: 'native',
      decimals: 18,
      category: 'gas',
      supportLevel: 'legacy',
      settlementMode: 'native_eth',
      hint: 'ETH is for gas and legacy settlement only. New demo flow should start with USDC.',
    },
  ],
  46630: [
    {
      id: 'native',
      label: 'Legacy / Gas ETH',
      symbol: 'ETH',
      mandateValue: 'native',
      decimals: 18,
      category: 'gas',
      supportLevel: 'legacy',
      settlementMode: 'native_eth',
      hint: 'Robinhood Testnet ETH remains the gas and legacy settlement rail.',
    },
    ...ROBINHOOD_STOCK_TICKERS.map((symbol) => ({
      id: symbol.toLowerCase(),
      label: `${symbol} (${ROBINHOOD_STOCK_METADATA[symbol].name} tokenized stock)`,
      symbol,
      mandateValue: symbol,
      decimals: 18,
      category: 'rwa-stock-token' as const,
      supportLevel: 'metadata-only' as const,
      settlementMode: 'policy_label_only' as const,
      hint: 'Robinhood faucet documents this testnet stock token. Token contract address is still metadata-only until discovered and verified.',
      scenario: {
        allowedAmount: '10',
        refusedAmount: ROBINHOOD_STOCK_METADATA[symbol].refusedAmount,
        safePath: `${symbol} exposure within per-asset cap`,
        refusedPath: `${symbol} exposure over per-asset cap`,
      },
    })),
    {
      id: 'usdg',
      label: 'USDG (Robinhood Testnet)',
      symbol: 'USDG',
      mandateValue: ROBINHOOD_TESTNET_USDG,
      decimals: 6,
      category: 'stablecoin',
      supportLevel: 'demo-ready',
      settlementMode: 'erc20_transfer',
      hint: 'Official Robinhood Chain docs publish the USDG token contract; Phase C can settle it through the token adapter when configured.',
    },
  ],
};

export const ROBINHOOD_HEADLINE_ASSETS = ASSETS_BY_CHAIN[46630].filter(
  (asset) => asset.category === 'rwa-stock-token',
) as KnownAsset[];

export function robinhoodAssetByTicker(ticker: string): KnownAsset | undefined {
  const normalized = ticker.trim().toUpperCase();
  return ROBINHOOD_HEADLINE_ASSETS.find((asset) => asset.symbol === normalized);
}

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
    return 'Legacy settlement relayer sends native ETH to the target address.';
  }
  if (asset.settlementMode === 'erc20_transfer') {
    return `Settlement asset: ${asset.symbol}. Token settlement adapter path is active for Phase C verification when the relayer has balance and allowance.`;
  }
  return asset.hint ?? 'Asset is validated in mandate/policy; settlement relayer sends native ETH today.';
}
