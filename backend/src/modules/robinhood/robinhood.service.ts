import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetsService } from '../assets/assets.service';
import { ErrorCodes } from '../../common/constants/error-codes.constant';

const ROBINHOOD_CHAIN_ID = 46630;
const STOCK_TICKERS = ['TSLA', 'AMZN', 'PLTR', 'NFLX', 'AMD'] as const;

@Injectable()
export class RobinhoodService {
  constructor(private readonly assetsService: AssetsService) {}

  async listAssets() {
    const assets = await this.assetsService.list(ROBINHOOD_CHAIN_ID);
    const wanted = new Set([...STOCK_TICKERS, 'USDG']);
    return assets
      .filter((asset) => wanted.has(asset.symbol as (typeof STOCK_TICKERS)[number] | 'USDG'))
      .map((asset) => this.withScenarios(asset));
  }

  async getAsset(ticker: string) {
    const symbol = ticker.toUpperCase();
    try {
      const asset = await this.assetsService.get(ROBINHOOD_CHAIN_ID, symbol);
      return this.withScenarios(asset);
    } catch (error) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: `Robinhood asset ${symbol} not found`,
      });
    }
  }

  private withScenarios(asset: Awaited<ReturnType<AssetsService['get']>>) {
    const settlementRail = asset.symbol;
    return {
      ...asset,
      chainId: ROBINHOOD_CHAIN_ID,
      settlementRail,
      scenarios: [
        {
          id: `${asset.symbol.toLowerCase()}-allowed`,
          kind: 'allowed',
          label: `${asset.symbol} within policy`,
          amount: asset.symbol === 'USDG' ? '0.001' : '10',
          supportLevel: asset.supportLevel,
          settlementMode: 'erc20_transfer',
          note: 'ERC-20 settlement via ValenTokenSettlementAdapter on Robinhood Testnet.',
        },
        {
          id: `${asset.symbol.toLowerCase()}-refused-over-limit`,
          kind: 'refused',
          label: `${asset.symbol} over limit`,
          amount: '250',
          supportLevel: asset.supportLevel,
          settlementMode: 'no_settlement_on_refusal',
          note: 'Refused path stops before settlement and creates a durable refusal proof.',
        },
      ],
    };
  }
}
