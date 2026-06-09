import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../redis/redis.service';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number }>;
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  live(): HealthCheckResult {
    return {
      status: 'ok',
      checks: { process: { status: 'ok' } },
      timestamp: new Date().toISOString(),
    };
  }

  async ready(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    let status: HealthCheckResult['status'] = 'ok';

    const dbStart = Date.now();
    try {
      const dbOk = await this.databaseService.ping();
      checks.database = {
        status: dbOk ? 'ok' : 'error',
        latencyMs: Date.now() - dbStart,
      };
      if (!dbOk) status = 'error';
    } catch {
      checks.database = { status: 'error', latencyMs: Date.now() - dbStart };
      status = 'error';
    }

    const redisStart = Date.now();
    try {
      const redisOk = await this.redisService.ping();
      checks.redis = {
        status: redisOk ? 'ok' : 'error',
        latencyMs: Date.now() - redisStart,
      };
      if (!redisOk) status = 'error';
    } catch {
      checks.redis = { status: 'error', latencyMs: Date.now() - redisStart };
      status = 'error';
    }

    return { status, checks, timestamp: new Date().toISOString() };
  }

  async deep(): Promise<HealthCheckResult> {
    return this.ready();
  }
}
