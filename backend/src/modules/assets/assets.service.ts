import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { ErrorCodes } from '../../common/constants/error-codes.constant';
import { AssetResponseDto } from './dto/asset.dto';

type AssetRow = QueryResultRow & {
  id: string;
  chain_id: number;
  symbol: string;
  name: string;
  address: string | null;
  decimals: number;
  category: string;
  support_level: string;
  settlement_modes: string[];
  metadata: Record<string, unknown>;
  source: string;
  source_url: string | null;
  verified_at: Date | null;
};

@Injectable()
export class AssetsService {
  constructor(private readonly db: DatabaseService) {}

  async list(chainId?: number): Promise<AssetResponseDto[]> {
    const result = chainId
      ? await this.db.query<AssetRow>(
          `SELECT * FROM assets WHERE chain_id = $1 ORDER BY (symbol = 'USDC') DESC, category, symbol`,
          [chainId],
        )
      : await this.db.query<AssetRow>(
          `SELECT * FROM assets ORDER BY chain_id, (symbol = 'USDC') DESC, category, symbol`,
        );

    return result.rows.map((row) => this.toDto(row));
  }

  async get(chainId: number, symbol: string): Promise<AssetResponseDto> {
    const result = await this.db.query<AssetRow>(
      `SELECT * FROM assets WHERE chain_id = $1 AND upper(symbol) = upper($2) LIMIT 1`,
      [chainId, symbol],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException({
        code: ErrorCodes.NOT_FOUND,
        message: 'Asset not found',
      });
    }
    return this.toDto(row);
  }

  async resolve(chainId: number, symbolOrAddress?: string | null): Promise<AssetResponseDto | null> {
    const value = symbolOrAddress?.trim();
    if (!value) return null;

    const result = await this.db.query<AssetRow>(
      `SELECT *
       FROM assets
       WHERE chain_id = $1
         AND (upper(symbol) = upper($2) OR lower(address) = lower($2))
       LIMIT 1`,
      [chainId, value],
    );
    return result.rows[0] ? this.toDto(result.rows[0]) : null;
  }

  private toDto(row: AssetRow): AssetResponseDto {
    return {
      id: row.id,
      chainId: row.chain_id,
      symbol: row.symbol,
      name: row.name,
      address: row.address,
      decimals: row.decimals,
      category: row.category,
      supportLevel: row.support_level,
      settlementModes: row.settlement_modes ?? [],
      metadata: row.metadata ?? {},
      source: row.source,
      sourceUrl: row.source_url,
      verifiedAt: row.verified_at?.toISOString() ?? null,
    };
  }
}
