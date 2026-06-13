import { RobinhoodService } from './robinhood.service';
import { ROBINHOOD_STOCK_TOKENS } from '../../common/constants/robinhood.constants';

const rows = [
  ...Object.entries(ROBINHOOD_STOCK_TOKENS).map(([symbol, token]) => ({
    id: symbol.toLowerCase(),
    chainId: 46630,
    symbol,
    name: token.name,
    address: token.address,
    decimals: 18,
    category: 'rwa-stock-token',
    supportLevel: 'demo-ready',
    settlementModes: ['erc20_transfer'],
    metadata: { settlementReady: true },
    source: 'Robinhood Chain testnet faucet + on-chain verification',
    sourceUrl: 'https://docs.robinhood.com/chain/contracts/',
    verifiedAt: new Date().toISOString(),
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
    settlementModes: ['erc20_transfer'],
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
        supportLevel: 'demo-ready',
        settlementRail: 'TSLA',
        scenarios: expect.arrayContaining([
          expect.objectContaining({ kind: 'allowed', settlementMode: 'erc20_transfer' }),
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
