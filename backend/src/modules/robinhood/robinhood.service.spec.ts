import { RobinhoodService } from './robinhood.service';

const rows = [
  ...['TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD'].map((symbol) => ({
    id: symbol.toLowerCase(),
    chainId: 46630,
    symbol,
    name: `${symbol} tokenized stock`,
    address: null,
    decimals: 18,
    category: 'rwa-stock-token',
    supportLevel: 'metadata-only',
    settlementModes: ['native_legacy'],
    metadata: {},
    source: 'Robinhood docs',
    sourceUrl: 'https://blog.arbitrum.io/robinhood-chain-testnet/',
    verifiedAt: null,
  })),
  {
    id: 'usdg',
    chainId: 46630,
    symbol: 'USDG',
    name: 'USDG',
    address: '0x7E955252E15c84f5768B83c41a71F9eba181802F',
    decimals: 6,
    category: 'stablecoin',
    supportLevel: 'demo-ready',
    settlementModes: ['native_legacy', 'erc20_transfer'],
    metadata: {},
    source: 'Robinhood docs',
    sourceUrl: 'https://docs.robinhood.com/chain/contracts/',
    verifiedAt: new Date().toISOString(),
  },
];

describe('RobinhoodService', () => {
  it('lists five stock tickers plus USDG with scenarios', async () => {
    const service = new RobinhoodService({
      list: jest.fn().mockResolvedValue(rows),
      get: jest.fn(),
    } as never);

    const assets = await service.listAssets();

    expect(assets).toHaveLength(6);
    expect(assets.find((asset) => asset.symbol === 'TSLA')).toEqual(
      expect.objectContaining({
        supportLevel: 'metadata-only',
        scenarios: expect.arrayContaining([
          expect.objectContaining({ kind: 'allowed' }),
          expect.objectContaining({ kind: 'refused' }),
        ]),
      }),
    );
    expect(assets.find((asset) => asset.symbol === 'USDG')).toEqual(
      expect.objectContaining({
        supportLevel: 'demo-ready',
        settlementRail: 'USDG',
      }),
    );
  });
});
