import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface PolicyVersionRow {
  id: string;
  organization_id: string;
  policy_id: string;
  version_number: number;
  status: string;
  rules: Record<string, unknown>;
  rules_hash: string | null;
  published_by_user_id: string | null;
  published_at: Date | null;
  activated_at: Date | null;
  created_at: Date;
}

@Injectable()
export class PolicyVersionsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findById(id: string): Promise<PolicyVersionRow | null> {
    return this.queryOne<PolicyVersionRow>(
      `SELECT * FROM policy_versions WHERE id = $1`,
      [id],
    );
  }

  async listByPolicy(policyId: string): Promise<PolicyVersionRow[]> {
    return this.queryMany<PolicyVersionRow>(
      `SELECT * FROM policy_versions WHERE policy_id = $1 ORDER BY version_number DESC`,
      [policyId],
    );
  }

  async nextVersionNumber(policyId: string): Promise<number> {
    const row = await this.queryOne<{ max: number | null }>(
      `SELECT MAX(version_number) AS max FROM policy_versions WHERE policy_id = $1`,
      [policyId],
    );
    return (row?.max ?? 0) + 1;
  }

  async create(input: {
    organizationId: string;
    policyId: string;
    versionNumber: number;
    rules: Record<string, unknown>;
  }): Promise<PolicyVersionRow> {
    const row = await this.queryOne<PolicyVersionRow>(
      `INSERT INTO policy_versions (organization_id, policy_id, version_number, rules)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        input.organizationId,
        input.policyId,
        input.versionNumber,
        JSON.stringify(input.rules),
      ],
    );
    if (!row) throw new Error('Failed to create policy version');
    return row;
  }

  async updateStatus(
    id: string,
    status: string,
    extras?: {
      rulesHash?: string;
      publishedByUserId?: string;
      activatedAt?: Date;
    },
  ): Promise<PolicyVersionRow | null> {
    const sets = [`status = $1`];
    const params: unknown[] = [status];
    let idx = 2;

    if (extras?.rulesHash) {
      sets.push(`rules_hash = $${idx++}`);
      params.push(extras.rulesHash);
      sets.push(`published_at = now()`);
      if (extras.publishedByUserId) {
        sets.push(`published_by_user_id = $${idx++}`);
        params.push(extras.publishedByUserId);
      }
    }
    if (extras?.activatedAt) {
      sets.push(`activated_at = $${idx++}`);
      params.push(extras.activatedAt);
    }

    params.push(id);
    return this.queryOne<PolicyVersionRow>(
      `UPDATE policy_versions SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
  }
}
