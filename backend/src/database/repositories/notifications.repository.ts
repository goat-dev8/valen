import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface NotificationRow {
  id: string;
  organization_id: string;
  recipient_type: string;
  recipient_ref: string;
  channel: string;
  template: string;
  status: string;
  priority: string;
  payload_ref: string | null;
  sent_at: Date | null;
  created_at: Date;
}

@Injectable()
export class NotificationsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async list(
    organizationId: string,
    filters: { status?: string; channel?: string },
    page: number,
    limit: number,
  ): Promise<{ items: NotificationRow[]; total: number }> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let idx = 2;

    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.channel) {
      conditions.push(`channel = $${idx++}`);
      params.push(filters.channel);
    }

    const where = conditions.join(' AND ');
    const total = await this.queryCount(
      `SELECT COUNT(*) AS count FROM notifications WHERE ${where}`,
      params,
    );

    params.push(limit, (page - 1) * limit);
    const items = await this.queryMany<NotificationRow>(
      `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params,
    );
    return { items, total };
  }

  async findById(id: string): Promise<NotificationRow | null> {
    return this.queryOne<NotificationRow>(
      `SELECT * FROM notifications WHERE id = $1`,
      [id],
    );
  }

  async updateStatus(id: string, status: string): Promise<NotificationRow | null> {
    return this.queryOne<NotificationRow>(
      `UPDATE notifications SET status = $1, sent_at = CASE WHEN $1 = 'sent' THEN now() ELSE sent_at END
       WHERE id = $2 RETURNING *`,
      [status, id],
    );
  }

  async create(input: {
    organizationId: string;
    recipientType: string;
    recipientRef: string;
    channel: string;
    template: string;
    payloadRef?: string;
  }): Promise<NotificationRow> {
    const row = await this.queryOne<NotificationRow>(
      `INSERT INTO notifications (organization_id, recipient_type, recipient_ref, channel, template, payload_ref)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        input.organizationId,
        input.recipientType,
        input.recipientRef,
        input.channel,
        input.template,
        input.payloadRef ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create notification');
    return row;
  }
}
