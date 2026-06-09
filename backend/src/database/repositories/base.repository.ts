import { Injectable } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database.service';

@Injectable()
export abstract class BaseRepository {
  constructor(protected readonly db: DatabaseService) {}

  protected async queryOne<T extends QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<T | null> {
    const result = await this.db.query<T>(sql, params);
    return result.rows[0] ?? null;
  }

  protected async queryMany<T extends QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]> {
    const result = await this.db.query<T>(sql, params);
    return result.rows;
  }

  protected async queryCount(sql: string, params?: unknown[]): Promise<number> {
    const result = await this.db.query<{ count: string }>(sql, params);
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }
}
