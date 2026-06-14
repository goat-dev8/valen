/** Public paths for supported chain brand marks. */
export const CHAIN_LOGOS: Record<number, string> = {
  421614: '/arbitrum-logo.png',
  42161: '/arbitrum-logo.png',
  46630: '/robinhood.svg',
};

export function chainLogoSrc(chainId: number): string | null {
  return CHAIN_LOGOS[chainId] ?? null;
}
