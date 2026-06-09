import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface WebhookRow {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  secret_hash: string;
  subscribed_events: string[];
  status: string;
  failure_count: number;
  created_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookDeliveryRow {
  id: string;
  organization_id: string;
  webhook_id: string;
  event_name: string;
  status: string;
  attempt_count: number;
  last_status_code: number | null;
  last_error: string | null;
  created_at: Date;
  delivered_at: Date | null;
}

@Injectable()
export class WebhooksRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async list(organizationId: string): Promise<WebhookRow[]> {
    return this.queryMany<WebhookRow>(
      `SELECT id, organization_id, name, url, subscribed_events, status, failure_count, created_at, updated_at
       FROM webhooks WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organizationId],
    );
  }

  async findById(id: string): Promise<WebhookRow | null> {
    return this.queryOne<WebhookRow>(`SELECT * FROM webhooks WHERE id = $1`, [id]);
  }

  async create(input: {
    organizationId: string;
    name: string;
    url: string;
    secretHash: string;
    subscribedEvents: string[];
    createdByUserId?: string;
  }): Promise<WebhookRow> {
    const row = await this.queryOne<WebhookRow>(
      `INSERT INTO webhooks (organization_id, name, url, secret_hash, subscribed_events, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.url,
        input.secretHash,
        input.subscribedEvents,
        input.createdByUserId ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create webhook');
    return row;
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      url: string;
      subscribedEvents: string[];
      status: string;
    }>,
  ): Promise<WebhookRow | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (patch.name !== undefined) {
      sets.push(`name = $${idx++}`);
      params.push(patch.name);
    }
    if (patch.url !== undefined) {
      sets.push(`url = $${idx++}`);
      params.push(patch.url);
    }
    if (patch.subscribedEvents !== undefined) {
      sets.push(`subscribed_events = $${idx++}`);
      params.push(patch.subscribedEvents);
    }
    if (patch.status !== undefined) {
      sets.push(`status = $${idx++}`);
      params.push(patch.status);
    }

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = now()`);
    params.push(id);

    return this.queryOne<WebhookRow>(
      `UPDATE webhooks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
  }

  async createDelivery(input: {
    organizationId: string;
    webhookId: string;
    eventName: string;
  }): Promise<WebhookDeliveryRow> {
    const row = await this.queryOne<WebhookDeliveryRow>(
      `INSERT INTO webhook_deliveries (organization_id, webhook_id, event_name)
       VALUES ($1, $2, $3) RETURNING *`,
      [input.organizationId, input.webhookId, input.eventName],
    );
    if (!row) throw new Error('Failed to create webhook delivery');
    return row;
  }
}
