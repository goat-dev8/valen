import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface PolicyRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  active_version_id: string | null;
  created_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PoliciesRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findById(id: string): Promise<PolicyRow | null> {
    return this.queryOne<PolicyRow>(`SELECT * FROM policies WHERE id = $1`, [id]);
  }

  async findByOrgAndId(
    organizationId: string,
    policyId: string,
  ): Promise<PolicyRow | null> {
    return this.queryOne<PolicyRow>(
      `SELECT * FROM policies WHERE id = $1 AND organization_id = $2`,
      [policyId, organizationId],
    );
  }

  async list(
    organizationId: string,
    status?: string,
  ): Promise<PolicyRow[]> {
    if (status) {
      return this.queryMany<PolicyRow>(
        `SELECT * FROM policies WHERE organization_id = $1 AND status = $2 ORDER BY created_at DESC`,
        [organizationId, status],
      );
    }
    return this.queryMany<PolicyRow>(
      `SELECT * FROM policies WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organizationId],
    );
  }

  async create(input: {
    organizationId: string;
    name: string;
    description?: string;
    createdByUserId?: string;
  }): Promise<PolicyRow> {
    const row = await this.queryOne<PolicyRow>(
      `INSERT INTO policies (organization_id, name, description, created_by_user_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.createdByUserId ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create policy');
    return row;
  }

  async setActiveVersion(
    policyId: string,
    versionId: string,
    status: string,
  ): Promise<PolicyRow | null> {
    return this.queryOne<PolicyRow>(
      `UPDATE policies SET active_version_id = $1, status = $2, updated_at = now()
       WHERE id = $3 RETURNING *`,
      [versionId, status, policyId],
    );
  }
}
