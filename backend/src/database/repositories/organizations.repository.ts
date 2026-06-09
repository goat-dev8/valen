import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  default_chain_id: number | null;
  risk_mode: string;
  compliance_mode: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class OrganizationsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findById(id: string): Promise<OrganizationRow | null> {
    return this.queryOne<OrganizationRow>(
      `SELECT * FROM organizations WHERE id = $1`,
      [id],
    );
  }

  async findBySlug(slug: string): Promise<OrganizationRow | null> {
    return this.queryOne<OrganizationRow>(
      `SELECT * FROM organizations WHERE slug = $1`,
      [slug.toLowerCase()],
    );
  }

  async create(input: {
    name: string;
    slug: string;
    defaultChainId?: number | null;
  }): Promise<OrganizationRow> {
    const row = await this.queryOne<OrganizationRow>(
      `INSERT INTO organizations (name, slug, default_chain_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [input.name, input.slug.toLowerCase(), input.defaultChainId ?? null],
    );
    if (!row) throw new Error('Failed to create organization');
    return row;
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      defaultChainId: number | null;
      riskMode: string;
      complianceMode: string;
      status: string;
    }>,
  ): Promise<OrganizationRow | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (patch.name !== undefined) {
      sets.push(`name = $${idx++}`);
      params.push(patch.name);
    }
    if (patch.defaultChainId !== undefined) {
      sets.push(`default_chain_id = $${idx++}`);
      params.push(patch.defaultChainId);
    }
    if (patch.riskMode !== undefined) {
      sets.push(`risk_mode = $${idx++}`);
      params.push(patch.riskMode);
    }
    if (patch.complianceMode !== undefined) {
      sets.push(`compliance_mode = $${idx++}`);
      params.push(patch.complianceMode);
    }
    if (patch.status !== undefined) {
      sets.push(`status = $${idx++}`);
      params.push(patch.status);
    }

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = now()`);
    params.push(id);

    return this.queryOne<OrganizationRow>(
      `UPDATE organizations SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
  }

  async listAdmin(filters: {
    status?: string;
    plan?: string;
    page: number;
    limit: number;
  }): Promise<{ items: OrganizationRow[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.plan) {
      conditions.push(`plan = $${idx++}`);
      params.push(filters.plan);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = await this.queryCount(
      `SELECT COUNT(*) AS count FROM organizations ${where}`,
      params,
    );

    params.push(filters.limit, (filters.page - 1) * filters.limit);
    const items = await this.queryMany<OrganizationRow>(
      `SELECT * FROM organizations ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params,
    );

    return { items, total };
  }

  async chainExists(chainId: number): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM chain_networks WHERE chain_id = $1 AND is_supported = true) AS exists`,
      [chainId],
    );
    return row?.exists ?? false;
  }
}
