const EXPLORERS: Record<number, string> = {
  421614: 'https://sepolia.arbiscan.io',
  42161: 'https://arbiscan.io',
  46630: 'https://explorer.testnet.chain.robinhood.com',
};

export function explorerTxUrl(chainId: number, txHash: string): string {
  const base = EXPLORERS[chainId] ?? 'https://sepolia.arbiscan.io';
  return `${base}/tx/${txHash}`;
}

export function explorerAddressUrl(chainId: number, address: string): string {
  const base = EXPLORERS[chainId] ?? 'https://sepolia.arbiscan.io';
  return `${base}/address/${address}`;
}
