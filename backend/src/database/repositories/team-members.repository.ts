import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';
import { PlatformRole } from '../../common/constants/roles.constant';

export interface TeamMemberRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: PlatformRole;
  status: string;
  invited_by_user_id: string | null;
  joined_at: Date | null;
  created_at: Date;
  updated_at: Date;
  email?: string | null;
  display_name?: string | null;
}

@Injectable()
export class TeamMembersRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findByOrgAndUser(
    organizationId: string,
    userId: string,
  ): Promise<TeamMemberRow | null> {
    return this.queryOne<TeamMemberRow>(
      `SELECT * FROM team_members WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId],
    );
  }

  async findById(id: string): Promise<TeamMemberRow | null> {
    return this.queryOne<TeamMemberRow>(
      `SELECT tm.*, u.email, u.display_name
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.id = $1`,
      [id],
    );
  }

  async listByOrganization(
    organizationId: string,
    page: number,
    limit: number,
  ): Promise<{ items: TeamMemberRow[]; total: number }> {
    const total = await this.queryCount(
      `SELECT COUNT(*) AS count FROM team_members WHERE organization_id = $1`,
      [organizationId],
    );
    const items = await this.queryMany<TeamMemberRow>(
      `SELECT tm.*, u.email, u.display_name
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.organization_id = $1
       ORDER BY tm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, (page - 1) * limit],
    );
    return { items, total };
  }

  async createInvitation(input: {
    organizationId: string;
    userId: string;
    role: PlatformRole;
    invitedByUserId: string;
  }): Promise<TeamMemberRow> {
    const row = await this.queryOne<TeamMemberRow>(
      `INSERT INTO team_members (organization_id, user_id, role, status, invited_by_user_id)
       VALUES ($1, $2, $3, 'invited', $4) RETURNING *`,
      [input.organizationId, input.userId, input.role, input.invitedByUserId],
    );
    if (!row) throw new Error('Failed to create team member');
    return row;
  }

  async addOwnerMembership(
    organizationId: string,
    userId: string,
  ): Promise<TeamMemberRow> {
    const row = await this.queryOne<TeamMemberRow>(
      `INSERT INTO team_members (organization_id, user_id, role, status, joined_at)
       VALUES ($1, $2, 'organization_owner', 'active', now()) RETURNING *`,
      [organizationId, userId],
    );
    if (!row) throw new Error('Failed to add owner membership');
    return row;
  }

  async update(
    id: string,
    patch: Partial<{ role: PlatformRole; status: string }>,
  ): Promise<TeamMemberRow | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (patch.role !== undefined) {
      sets.push(`role = $${idx++}`);
      params.push(patch.role);
    }
    if (patch.status !== undefined) {
      sets.push(`status = $${idx++}`);
      params.push(patch.status);
      if (patch.status === 'active') {
        sets.push(`joined_at = COALESCE(joined_at, now())`);
      }
    }

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = now()`);
    params.push(id);

    return this.queryOne<TeamMemberRow>(
      `UPDATE team_members SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
  }

  async countOwners(organizationId: string): Promise<number> {
    return this.queryCount(
      `SELECT COUNT(*) AS count FROM team_members
       WHERE organization_id = $1 AND role = 'organization_owner' AND status = 'active'`,
      [organizationId],
    );
  }
}
