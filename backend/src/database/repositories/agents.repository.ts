import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface AgentRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  agent_type: string;
  external_ref: string | null;
  default_policy_id: string | null;
  metadata: Record<string, unknown>;
  public_slug?: string | null;
  created_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AgentsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findById(id: string): Promise<AgentRow | null> {
    return this.queryOne<AgentRow>(`SELECT * FROM agents WHERE id = $1`, [id]);
  }

  async findByOrgAndId(
    organizationId: string,
    agentId: string,
  ): Promise<AgentRow | null> {
    return this.queryOne<AgentRow>(
      `SELECT * FROM agents WHERE id = $1 AND organization_id = $2`,
      [agentId, organizationId],
    );
  }

  async list(
    organizationId: string,
    filters: { status?: string; type?: string },
    page: number,
    limit: number,
  ): Promise<{ items: AgentRow[]; total: number }> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let idx = 2;

    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.type) {
      conditions.push(`agent_type = $${idx++}`);
      params.push(filters.type);
    }

    const where = conditions.join(' AND ');
    const total = await this.queryCount(
      `SELECT COUNT(*) AS count FROM agents WHERE ${where}`,
      params,
    );

    params.push(limit, (page - 1) * limit);
    const items = await this.queryMany<AgentRow>(
      `SELECT * FROM agents WHERE ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params,
    );
    return { items, total };
  }

  async create(input: {
    organizationId: string;
    name: string;
    description?: string;
    agentType: string;
    defaultPolicyId?: string;
    metadata?: Record<string, unknown>;
    createdByUserId?: string;
  }): Promise<AgentRow> {
    const row = await this.queryOne<AgentRow>(
      `INSERT INTO agents (organization_id, name, description, agent_type, default_policy_id, metadata, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.agentType,
        input.defaultPolicyId ?? null,
        JSON.stringify(input.metadata ?? {}),
        input.createdByUserId ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create agent');
    return row;
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      description: string;
      defaultPolicyId: string | null;
      metadata: Record<string, unknown>;
      status: string;
    }>,
  ): Promise<AgentRow | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (patch.name !== undefined) {
      sets.push(`name = $${idx++}`);
      params.push(patch.name);
    }
    if (patch.description !== undefined) {
      sets.push(`description = $${idx++}`);
      params.push(patch.description);
    }
    if (patch.defaultPolicyId !== undefined) {
      sets.push(`default_policy_id = $${idx++}`);
      params.push(patch.defaultPolicyId);
    }
    if (patch.metadata !== undefined) {
      sets.push(`metadata = $${idx++}`);
      params.push(JSON.stringify(patch.metadata));
    }
    if (patch.status !== undefined) {
      sets.push(`status = $${idx++}`);
      params.push(patch.status);
    }

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = now()`);
    params.push(id);

    return this.queryOne<AgentRow>(
      `UPDATE agents SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
  }
}
