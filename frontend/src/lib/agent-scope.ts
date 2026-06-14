import { ARBITRUM_SEPOLIA_USDC, ROBINHOOD_TESTNET_USDG, ROBINHOOD_STOCK_TOKENS } from './known-assets';

export const AGENT_NETWORKS = [
  { chainId: 421614, label: 'Arbitrum Sepolia', shortLabel: 'Arbitrum' },
  { chainId: 46630, label: 'Robinhood Testnet', shortLabel: 'Robinhood' },
] as const;

export const AGENT_ASSET_OPTIONS = [
  { symbol: 'USDC', label: 'USDC', chainId: 421614 },
  { symbol: 'USDG', label: 'USDG', chainId: 46630 },
  { symbol: 'TSLA', label: 'TSLA', chainId: 46630 },
  { symbol: 'AMZN', label: 'AMZN', chainId: 46630 },
  { symbol: 'NFLX', label: 'NFLX', chainId: 46630 },
  { symbol: 'PLTR', label: 'PLTR', chainId: 46630 },
  { symbol: 'AMD', label: 'AMD', chainId: 46630 },
  { symbol: 'x402', label: 'x402', chainId: 421614 },
] as const;

export const AGENT_ACTION_OPTIONS = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'x402_payment', label: 'x402 Payment' },
  { value: 'demo_trade', label: 'Robinhood Trading' },
] as const;

export type AgentScopeMetadata = {
  supportedNetworks?: number[];
  supportedAssets?: string[];
  supportedActions?: string[];
};

export const DEFAULT_SUPPORTED_NETWORKS = AGENT_NETWORKS.map((n) => n.chainId);
export const DEFAULT_SUPPORTED_ASSETS = AGENT_ASSET_OPTIONS.filter((a) => a.symbol !== 'x402').map((a) => a.symbol);
export const DEFAULT_SUPPORTED_ACTIONS = ['transfer'];

export function networkLabel(chainId: number): string {
  return AGENT_NETWORKS.find((n) => n.chainId === chainId)?.label ?? `Chain ${chainId}`;
}

export function networkShortLabel(chainId: number): string {
  return AGENT_NETWORKS.find((n) => n.chainId === chainId)?.shortLabel ?? String(chainId);
}

export function readAgentScope(metadata?: Record<string, unknown> | null): Required<AgentScopeMetadata> {
  return {
    supportedNetworks: Array.isArray(metadata?.supportedNetworks)
      ? (metadata.supportedNetworks as number[])
      : DEFAULT_SUPPORTED_NETWORKS,
    supportedAssets: Array.isArray(metadata?.supportedAssets)
      ? (metadata.supportedAssets as string[])
      : DEFAULT_SUPPORTED_ASSETS,
    supportedActions: Array.isArray(metadata?.supportedActions)
      ? (metadata.supportedActions as string[])
      : DEFAULT_SUPPORTED_ACTIONS,
  };
}

/** Mandate asset permissions — symbols and contract addresses, never `native`. */
export function mandateAssetValues(symbols: string[]): string[] {
  const out = new Set<string>();
  for (const symbol of symbols) {
    const upper = symbol.trim().toUpperCase();
    if (!upper || upper === 'NATIVE' || upper === 'X402') continue;
    out.add(upper);
    if (upper === 'USDC') out.add(ARBITRUM_SEPOLIA_USDC);
    if (upper === 'USDG') out.add(ROBINHOOD_TESTNET_USDG);
    const stock = ROBINHOOD_STOCK_TOKENS[upper as keyof typeof ROBINHOOD_STOCK_TOKENS];
    if (stock?.address) out.add(stock.address);
  }
  return [...out];
}

export function allSupportedAssetSymbols(): string[] {
  return AGENT_ASSET_OPTIONS.filter((a) => a.symbol !== 'x402').map((a) => a.symbol);
}
