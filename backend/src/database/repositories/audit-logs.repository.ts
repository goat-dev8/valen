import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface AuditLogRow {
  id: string;
  organization_id: string | null;
  actor_type: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  event_hash: string;
  payload_ref: string | null;
  chain_id: number | null;
  tx_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface AuditEventRow {
  id: string;
  organization_id: string | null;
  event_name: string;
  event_hash: string;
  related_entity_type: string;
  related_entity_id: string;
  created_at: Date;
}

@Injectable()
export class AuditLogsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async append(input: {
    organizationId?: string;
    actorType: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId: string;
    eventHash: string;
    payloadRef?: string;
    chainId?: number;
    txHash?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLogRow> {
    const row = await this.queryOne<AuditLogRow>(
      `INSERT INTO audit_logs (
         organization_id, actor_type, actor_id, action, entity_type, entity_id,
         event_hash, payload_ref, chain_id, tx_hash, ip_address, user_agent
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        input.organizationId ?? null,
        input.actorType,
        input.actorId ?? null,
        input.action,
        input.entityType,
        input.entityId,
        input.eventHash,
        input.payloadRef ?? null,
        input.chainId ?? null,
        input.txHash ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ],
    );
    if (!row) throw new Error('Failed to append audit log');
    return row;
  }

  async list(
    organizationId: string,
    filters: {
      entityType?: string;
      actor?: string;
      from?: Date;
      to?: Date;
    },
    page: number,
    limit: number,
  ): Promise<{ items: AuditLogRow[]; total: number }> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let idx = 2;

    if (filters.entityType) {
      conditions.push(`entity_type = $${idx++}`);
      params.push(filters.entityType);
    }
    if (filters.actor) {
      conditions.push(`actor_id = $${idx++}`);
      params.push(filters.actor);
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
      `SELECT COUNT(*) AS count FROM audit_logs WHERE ${where}`,
      params,
    );

    params.push(limit, (page - 1) * limit);
    const items = await this.queryMany<AuditLogRow>(
      `SELECT * FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params,
    );
    return { items, total };
  }

  async findById(id: string): Promise<AuditLogRow | null> {
    return this.queryOne<AuditLogRow>(
      `SELECT * FROM audit_logs WHERE id = $1`,
      [id],
    );
  }

  async timelineForEntity(
    organizationId: string,
    entityType: string,
    entityId: string,
  ): Promise<AuditEventRow[]> {
    return this.queryMany<AuditEventRow>(
      `SELECT * FROM audit_events
       WHERE organization_id = $1 AND related_entity_type = $2 AND related_entity_id = $3
       ORDER BY created_at ASC`,
      [organizationId, entityType, entityId],
    );
  }

  async appendEvent(input: {
    organizationId?: string;
    eventName: string;
    eventHash: string;
    relatedEntityType: string;
    relatedEntityId: string;
  }): Promise<AuditEventRow> {
    const row = await this.queryOne<AuditEventRow>(
      `INSERT INTO audit_events (organization_id, event_name, event_hash, related_entity_type, related_entity_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        input.organizationId ?? null,
        input.eventName,
        input.eventHash,
        input.relatedEntityType,
        input.relatedEntityId,
      ],
    );
    if (!row) throw new Error('Failed to append audit event');
    return row;
  }
}
