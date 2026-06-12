import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface ApiKeyRow {
  id: string;
  organization_id: string;
  agent_id: string | null;
  mandate_id: string | null;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  status: string;
  expires_at: Date | null;
  last_used_at: Date | null;
  created_by_user_id: string | null;
  created_at: Date;
  revoked_at: Date | null;
}

@Injectable()
export class ApiKeysRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findByPrefix(prefix: string): Promise<ApiKeyRow | null> {
    return this.queryOne<ApiKeyRow>(
      `SELECT * FROM api_keys WHERE key_prefix = $1 AND status = 'active'`,
      [prefix],
    );
  }

  async findById(id: string): Promise<ApiKeyRow | null> {
    return this.queryOne<ApiKeyRow>(`SELECT * FROM api_keys WHERE id = $1`, [id]);
  }

  async create(input: {
    organizationId: string;
    agentId?: string;
    mandateId?: string;
    name: string;
    keyPrefix: string;
    keyHash: string;
    scopes: string[];
    expiresAt?: Date;
    createdByUserId?: string;
  }): Promise<ApiKeyRow> {
    const row = await this.queryOne<ApiKeyRow>(
      `INSERT INTO api_keys (
         organization_id, agent_id, mandate_id, name, key_prefix, key_hash, scopes, expires_at, created_by_user_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.organizationId,
        input.agentId ?? null,
        input.mandateId ?? null,
        input.name,
        input.keyPrefix,
        input.keyHash,
        input.scopes,
        input.expiresAt ?? null,
        input.createdByUserId ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create API key');
    return row;
  }

  async touchLastUsed(id: string): Promise<void> {
    await this.db.query(
      `UPDATE api_keys SET last_used_at = now() WHERE id = $1`,
      [id],
    );
  }

  async listByAgent(agentId: string): Promise<ApiKeyRow[]> {
    return this.queryMany<ApiKeyRow>(
      `SELECT id, organization_id, agent_id, mandate_id, name, key_prefix, scopes, status, expires_at, last_used_at, created_at, revoked_at
       FROM api_keys WHERE agent_id = $1 ORDER BY created_at DESC`,
      [agentId],
    );
  }
}
