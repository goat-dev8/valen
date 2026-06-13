/** Robinhood Chain Testnet (46630) — verified ERC-20 contracts on-chain 2026-06-13. */
export const ROBINHOOD_TESTNET_CHAIN_ID = 46630;

export const ROBINHOOD_TESTNET_USDG =
  '0x7E955252E15c84f5768B83c41a71F9eba181802F' as const;

export const ROBINHOOD_STOCK_TOKENS = {
  TSLA: {
    symbol: 'TSLA',
    address: '0xC9f9c86933092BbbfFF3CCb4b105A4A94bf3Bd4E',
    decimals: 18,
    name: 'Tesla Tokenized Stock (Testnet)',
  },
  AMZN: {
    symbol: 'AMZN',
    address: '0x5884aD2f920c162CFBbACc88C9C51AA75eC09E02',
    decimals: 18,
    name: 'Amazon Tokenized Stock (Testnet)',
  },
  PLTR: {
    symbol: 'PLTR',
    address: '0x1FBE1a0e43594b3455993B5dE5Fd0A7A266298d0',
    decimals: 18,
    name: 'Palantir Tokenized Stock (Testnet)',
  },
  NFLX: {
    symbol: 'NFLX',
    address: '0x3b8262A63d25f0477c4DDE23F83cfe22Cb768C93',
    decimals: 18,
    name: 'Netflix Tokenized Stock (Testnet)',
  },
  AMD: {
    symbol: 'AMD',
    address: '0x71178BAc73cBeb415514eB542a8995b82669778d',
    decimals: 18,
    name: 'AMD Tokenized Stock (Testnet)',
  },
} as const;

export type RobinhoodStockSymbol = keyof typeof ROBINHOOD_STOCK_TOKENS;

export const ROBINHOOD_STOCK_SYMBOLS = Object.keys(ROBINHOOD_STOCK_TOKENS) as RobinhoodStockSymbol[];

export function resolveRobinhoodTickerAddress(ticker: string): string | null {
  const key = ticker.toUpperCase() as RobinhoodStockSymbol;
  return ROBINHOOD_STOCK_TOKENS[key]?.address ?? null;
}
