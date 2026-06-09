import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface EmergencyActionRow {
  id: string;
  actor_user_id: string;
  scope: string;
  scope_ref: string | null;
  action: string;
  reason: string;
  chain_id: number | null;
  tx_hash: string | null;
  created_at: Date;
  lifted_at: Date | null;
}

@Injectable()
export class EmergencyActionsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async create(input: {
    actorUserId: string;
    scope: string;
    scopeRef?: string;
    action: string;
    reason: string;
    chainId?: number;
  }): Promise<EmergencyActionRow> {
    const row = await this.queryOne<EmergencyActionRow>(
      `INSERT INTO emergency_actions (actor_user_id, scope, scope_ref, action, reason, chain_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        input.actorUserId,
        input.scope,
        input.scopeRef ?? null,
        input.action,
        input.reason,
        input.chainId ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create emergency action');
    return row;
  }

  async findActivePause(scope: string, scopeRef?: string): Promise<EmergencyActionRow | null> {
    if (scopeRef) {
      return this.queryOne<EmergencyActionRow>(
        `SELECT * FROM emergency_actions
         WHERE scope = $1 AND scope_ref = $2 AND action = 'pause' AND lifted_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [scope, scopeRef],
      );
    }
    return this.queryOne<EmergencyActionRow>(
      `SELECT * FROM emergency_actions
       WHERE scope = $1 AND action = 'pause' AND lifted_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [scope],
    );
  }

  async liftPause(id: string): Promise<EmergencyActionRow | null> {
    return this.queryOne<EmergencyActionRow>(
      `UPDATE emergency_actions SET lifted_at = now() WHERE id = $1 RETURNING *`,
      [id],
    );
  }
}
