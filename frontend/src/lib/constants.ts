export const CHAIN_NAMES: Record<number, string> = {
  421614: 'Arbitrum Sepolia',
  46630: 'Robinhood Testnet',
  42161: 'Arbitrum One',
  288304: 'Robinhood Testnet (misconfigured wallet entry)',
};

export function chainName(chainId: number | null | undefined): string {
  if (!chainId) return '—';
  return CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
}

export const ORG_STORAGE_KEY = 'valen_org_id';
export const TOKEN_STORAGE_KEY = 'valen_access_token';
