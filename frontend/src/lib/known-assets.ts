import { ROBINHOOD_STOCK_TOKENS, ROBINHOOD_TESTNET_USDG } from './robinhood-assets';

export type KnownAsset = {
  id: string;
  label: string;
  symbol: string;
  mandateValue: string;
  address: string;
  decimals: number;
  category: 'stablecoin' | 'gas' | 'rwa-stock-token';
  supportLevel: 'demo-ready' | 'legacy';
  settlementMode: 'native_eth' | 'erc20_transfer';
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

export { ROBINHOOD_TESTNET_USDG, ROBINHOOD_STOCK_TOKENS };

export const ROBINHOOD_STOCK_TICKERS = Object.keys(ROBINHOOD_STOCK_TOKENS) as Array<
  keyof typeof ROBINHOOD_STOCK_TOKENS
>;
export type RobinhoodStockTicker = (typeof ROBINHOOD_STOCK_TICKERS)[number];

const ASSETS_BY_CHAIN: Record<number, KnownAsset[]> = {
  421614: [
    {
      id: 'usdc',
      label: 'USDC (Arbitrum Sepolia)',
      symbol: 'USDC',
      mandateValue: ARBITRUM_SEPOLIA_USDC,
      address: ARBITRUM_SEPOLIA_USDC,
      decimals: 6,
      category: 'stablecoin',
      supportLevel: 'demo-ready',
      settlementMode: 'erc20_transfer',
      hint: 'Default VALEN asset. Token adapter settles USDC on Arbitrum Sepolia.',
    },
    {
      id: 'native',
      label: 'Legacy / Gas ETH',
      symbol: 'ETH',
      mandateValue: 'native',
      address: 'native',
      decimals: 18,
      category: 'gas',
      supportLevel: 'legacy',
      settlementMode: 'native_eth',
      hint: 'ETH is for gas and legacy settlement only.',
    },
  ],
  46630: [
    {
      id: 'native',
      label: 'Legacy / Gas ETH',
      symbol: 'ETH',
      mandateValue: 'native',
      address: 'native',
      decimals: 18,
      category: 'gas',
      supportLevel: 'legacy',
      settlementMode: 'native_eth',
      hint: 'Robinhood Testnet ETH is the gas rail.',
    },
    ...ROBINHOOD_STOCK_TICKERS.map((symbol) => ({
      id: symbol.toLowerCase(),
      label: `${symbol} (${ROBINHOOD_STOCK_TOKENS[symbol].name})`,
      symbol,
      mandateValue: ROBINHOOD_STOCK_TOKENS[symbol].address,
      address: ROBINHOOD_STOCK_TOKENS[symbol].address,
      decimals: 18,
      category: 'rwa-stock-token' as const,
      supportLevel: 'demo-ready' as const,
      settlementMode: 'erc20_transfer' as const,
      hint: 'Robinhood testnet ERC-20 stock token. Settles through ValenTokenSettlementAdapter when enabled.',
      scenario: {
        allowedAmount: '10',
        refusedAmount: '250',
        safePath: `${symbol} transfer within policy cap`,
        refusedPath: `${symbol} transfer over policy cap`,
      },
    })),
    {
      id: 'usdg',
      label: 'USDG (Robinhood Testnet)',
      symbol: 'USDG',
      mandateValue: ROBINHOOD_TESTNET_USDG,
      address: ROBINHOOD_TESTNET_USDG,
      decimals: 6,
      category: 'stablecoin',
      supportLevel: 'demo-ready',
      settlementMode: 'erc20_transfer',
      hint: 'Official Robinhood Chain USDG contract.',
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
    (asset) =>
      asset.mandateValue.toLowerCase() === normalized ||
      asset.address.toLowerCase() === normalized ||
      asset.symbol.toLowerCase() === normalized,
  );
}

export function settlementLabelForAsset(chainId: number, mandateValue: string): string {
  const asset = knownAssetForMandateValue(chainId, mandateValue);
  if (!asset || asset.settlementMode === 'native_eth') {
    return 'Legacy settlement relayer sends native ETH to the target address.';
  }
  return `Settlement asset: ${asset.symbol} (${asset.address}). ERC-20 transfer via ValenTokenSettlementAdapter.`;
}
