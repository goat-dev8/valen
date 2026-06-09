import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

function normalizeEvmAddress(address: string): string {
  const trimmed = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    throw new Error('Invalid EVM address');
  }
  return trimmed.toLowerCase();
}

export interface AgentWalletRow {
  id: string;
  organization_id: string;
  agent_id: string;
  chain_id: number;
  wallet_address: string;
  wallet_type: string;
  status: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AgentWalletsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async create(input: {
    organizationId: string;
    agentId: string;
    chainId: number;
    walletAddress: string;
    walletType: string;
    isPrimary: boolean;
  }): Promise<AgentWalletRow> {
    const normalized = normalizeEvmAddress(input.walletAddress);
    if (input.isPrimary) {
      await this.db.query(
        `UPDATE agent_wallets SET is_primary = false, updated_at = now()
         WHERE agent_id = $1 AND chain_id = $2 AND status = 'active'`,
        [input.agentId, input.chainId],
      );
    }
    const row = await this.queryOne<AgentWalletRow>(
      `INSERT INTO agent_wallets (organization_id, agent_id, chain_id, wallet_address, wallet_type, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        input.organizationId,
        input.agentId,
        input.chainId,
        normalized,
        input.walletType,
        input.isPrimary,
      ],
    );
    if (!row) throw new Error('Failed to create agent wallet');
    return row;
  }

  async listByAgent(agentId: string): Promise<AgentWalletRow[]> {
    return this.queryMany<AgentWalletRow>(
      `SELECT * FROM agent_wallets WHERE agent_id = $1 ORDER BY created_at DESC`,
      [agentId],
    );
  }
}
