import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface ExecutionRow {
  id: string;
  organization_id: string;
  agent_id: string;
  mandate_id: string | null;
  policy_id: string | null;
  policy_version_id: string | null;
  idempotency_key: string;
  action_type: string;
  status: string;
  request_payload_hash: string;
  request_payload_ref: string | null;
  target_chain_id: number;
  target_address: string | null;
  asset_address: string | null;
  value_amount: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ExecutionsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findById(id: string): Promise<ExecutionRow | null> {
    return this.queryOne<ExecutionRow>(
      `SELECT * FROM executions WHERE id = $1`,
      [id],
    );
  }

  async listRecent(limit: number): Promise<ExecutionRow[]> {
    return this.queryMany<ExecutionRow>(
      `SELECT * FROM executions ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
  }

  async findByOrgAndId(
    organizationId: string,
    executionId: string,
  ): Promise<ExecutionRow | null> {
    return this.queryOne<ExecutionRow>(
      `SELECT * FROM executions WHERE id = $1 AND organization_id = $2`,
      [executionId, organizationId],
    );
  }

  async findByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<ExecutionRow | null> {
    return this.queryOne<ExecutionRow>(
      `SELECT * FROM executions WHERE organization_id = $1 AND idempotency_key = $2`,
      [organizationId, idempotencyKey],
    );
  }

  async list(
    organizationId: string,
    filters: {
      status?: string;
      agentId?: string;
      from?: Date;
      to?: Date;
    },
    page: number,
    limit: number,
  ): Promise<{ items: ExecutionRow[]; total: number }> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let idx = 2;

    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.agentId) {
      conditions.push(`agent_id = $${idx++}`);
      params.push(filters.agentId);
    }
    if (filters.from) {
      conditions.push(`created_at >= $${idx++}`);
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push(`created_at <= $${idx++}`);
      params.push(filters.to);
    }

    const where = conditions.join(' AND ');
    const total = await this.queryCount(
      `SELECT COUNT(*) AS count FROM executions WHERE ${where}`,
      params,
    );

    params.push(limit, (page - 1) * limit);
    const items = await this.queryMany<ExecutionRow>(
      `SELECT * FROM executions WHERE ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params,
    );
    return { items, total };
  }

  async create(input: {
    organizationId: string;
    agentId: string;
    idempotencyKey: string;
    actionType: string;
    targetChainId: number;
    targetAddress?: string;
    assetAddress?: string;
    valueAmount?: string;
    mandateId?: string;
    policyId?: string;
    policyVersionId?: string;
    payloadHash: string;
    payloadRef?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ExecutionRow> {
    const row = await this.queryOne<ExecutionRow>(
      `INSERT INTO executions (
         organization_id, agent_id, mandate_id, policy_id, policy_version_id,
         idempotency_key, action_type, request_payload_hash, request_payload_ref,
         target_chain_id, target_address, asset_address, value_amount, metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        input.organizationId,
        input.agentId,
        input.mandateId ?? null,
        input.policyId ?? null,
        input.policyVersionId ?? null,
        input.idempotencyKey,
        input.actionType,
        input.payloadHash,
        input.payloadRef ?? null,
        input.targetChainId,
        input.targetAddress ?? null,
        input.assetAddress ?? null,
        input.valueAmount ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    if (!row) throw new Error('Failed to create execution');
    return row;
  }

  async updateStatus(id: string, status: string): Promise<ExecutionRow | null> {
    return this.queryOne<ExecutionRow>(
      `UPDATE executions SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id],
    );
  }

  async recordIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
    executionId: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO intent_idempotency_keys (organization_id, idempotency_key, execution_id, expires_at)
       VALUES ($1, $2, $3, $4) ON CONFLICT (organization_id, idempotency_key) DO NOTHING`,
      [organizationId, idempotencyKey, executionId, expiresAt],
    );
  }
}
