import { NotFoundException } from '@nestjs/common';
import { AssetsService } from './assets.service';

const usdcRow = {
  id: 'asset-usdc',
  chain_id: 421614,
  symbol: 'USDC',
  name: 'USD Coin',
  address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  decimals: 6,
  category: 'stablecoin',
  support_level: 'demo-ready',
  settlement_modes: ['native_legacy', 'erc20_transfer', 'x402_payment'],
  metadata: { default: true },
  source: 'Circle testnet USDC / Arbitrum Sepolia',
  source_url: 'https://faucet.circle.com',
  verified_at: new Date('2026-06-13T00:00:00Z'),
};

describe('AssetsService', () => {
  it('lists assets with USDC metadata intact', async () => {
    const db = {
      query: jest.fn().mockResolvedValue({ rows: [usdcRow] }),
    };
    const service = new AssetsService(db as never);

    await expect(service.list(421614)).resolves.toEqual([
      expect.objectContaining({
        symbol: 'USDC',
        chainId: 421614,
        decimals: 6,
        supportLevel: 'demo-ready',
        settlementModes: expect.arrayContaining(['erc20_transfer']),
      }),
    ]);
  });

  it('resolves USDC by address for execution creation', async () => {
    const db = {
      query: jest.fn().mockResolvedValue({ rows: [usdcRow] }),
    };
    const service = new AssetsService(db as never);

    await expect(
      service.resolve(421614, '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'),
    ).resolves.toEqual(
      expect.objectContaining({
        symbol: 'USDC',
        decimals: 6,
      }),
    );
  });

  it('throws a typed not-found error for unknown assets', async () => {
    const db = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    const service = new AssetsService(db as never);

    await expect(service.get(421614, 'MISSING')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
