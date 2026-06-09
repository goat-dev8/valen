import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';
import { AuthenticatedUser, OrganizationMembership } from '../../common/interfaces/authenticated-user.interface';
import { PlatformRole } from '../../common/constants/roles.constant';

export interface UserRow {
  id: string;
  privy_user_id: string;
  email: string | null;
  display_name: string | null;
  status: string;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

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
}

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async findByPrivyUserId(privyUserId: string): Promise<UserRow | null> {
    return this.queryOne<UserRow>(
      `SELECT * FROM users WHERE privy_user_id = $1`,
      [privyUserId],
    );
  }

  async findById(id: string): Promise<UserRow | null> {
    return this.queryOne<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    return this.queryOne<UserRow>(
      `SELECT * FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );
  }

  async upsertFromPrivy(input: {
    privyUserId: string;
    email?: string | null;
    displayName?: string | null;
  }): Promise<UserRow> {
    const row = await this.queryOne<UserRow>(
      `INSERT INTO users (privy_user_id, email, display_name, last_login_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (privy_user_id) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, users.email),
         display_name = COALESCE(EXCLUDED.display_name, users.display_name),
         last_login_at = now(),
         updated_at = now()
       RETURNING *`,
      [input.privyUserId, input.email ?? null, input.displayName ?? null],
    );
    if (!row) throw new Error('Failed to upsert user');
    return row;
  }

  async getMemberships(userId: string): Promise<OrganizationMembership[]> {
    const rows = await this.queryMany<TeamMemberRow>(
      `SELECT * FROM team_members WHERE user_id = $1 AND status != 'removed'`,
      [userId],
    );
    return rows.map((r) => ({
      organizationId: r.organization_id,
      role: r.role,
      status: r.status,
    }));
  }

  async isPlatformAdmin(userId: string): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM team_members tm
         JOIN organizations o ON o.id = tm.organization_id
         WHERE tm.user_id = $1 AND tm.role = 'platform_admin' AND tm.status = 'active'
       ) AS exists`,
      [userId],
    );
    return row?.exists ?? false;
  }

  toAuthenticatedUser(
    row: UserRow,
    memberships: OrganizationMembership[],
    isPlatformAdmin: boolean,
  ): AuthenticatedUser {
    return {
      id: row.id,
      privyUserId: row.privy_user_id,
      email: row.email,
      displayName: row.display_name,
      status: row.status,
      isPlatformAdmin,
      memberships,
    };
  }
}
