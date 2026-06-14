const NETWORKS: Record<number, string> = {
  421614: 'Arbitrum Sepolia',
  46630: 'Robinhood Testnet',
};

export function networkLabel(chainId: number): string {
  return NETWORKS[chainId] ?? `Chain ${chainId}`;
}
