import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { DatabaseService } from '../database.service';

export interface DeadLetterJobRow {
  id: string;
  queue_name: string;
  job_id: string;
  organization_id: string | null;
  execution_id: string | null;
  failure_reason: string;
  retry_count: number;
  payload_ref: string | null;
  status: string;
  created_at: Date;
  resolved_at: Date | null;
}

@Injectable()
export class DeadLetterJobsRepository extends BaseRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async list(filters: {
    queue?: string;
    status?: string;
    page: number;
    limit: number;
  }): Promise<{ items: DeadLetterJobRow[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.queue) {
      conditions.push(`queue_name = $${idx++}`);
      params.push(filters.queue);
    }
    if (filters.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = await this.queryCount(
      `SELECT COUNT(*) AS count FROM dead_letter_jobs ${where}`,
      params,
    );

    params.push(filters.limit, (filters.page - 1) * filters.limit);
    const items = await this.queryMany<DeadLetterJobRow>(
      `SELECT * FROM dead_letter_jobs ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      params,
    );
    return { items, total };
  }

  async findById(id: string): Promise<DeadLetterJobRow | null> {
    return this.queryOne<DeadLetterJobRow>(
      `SELECT * FROM dead_letter_jobs WHERE id = $1`,
      [id],
    );
  }

  async create(input: {
    queueName: string;
    jobId: string;
    organizationId?: string;
    executionId?: string;
    failureReason: string;
    retryCount: number;
    payloadRef?: string;
  }): Promise<DeadLetterJobRow> {
    const row = await this.queryOne<DeadLetterJobRow>(
      `INSERT INTO dead_letter_jobs (queue_name, job_id, organization_id, execution_id, failure_reason, retry_count, payload_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.queueName,
        input.jobId,
        input.organizationId ?? null,
        input.executionId ?? null,
        input.failureReason,
        input.retryCount,
        input.payloadRef ?? null,
      ],
    );
    if (!row) throw new Error('Failed to create dead letter job');
    return row;
  }

  async resolve(id: string): Promise<DeadLetterJobRow | null> {
    return this.queryOne<DeadLetterJobRow>(
      `UPDATE dead_letter_jobs SET status = 'resolved', resolved_at = now() WHERE id = $1 RETURNING *`,
      [id],
    );
  }
}
