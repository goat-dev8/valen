import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { WORKER_HEARTBEAT_TTL_SECONDS } from '../redis/redis-connection';

export const WORKER_CONSUMER_KEY = 'valen:worker:consumers';

@Injectable()
export class WorkerConsumerHealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerConsumerHealthService.name);
  private timer?: NodeJS.Timeout;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  onModuleInit() {
    void this.touch('bootstrap');
    this.timer = setInterval(() => {
      void this.touch('heartbeat');
    }, 15_000);
    this.logger.log('Worker consumer health started');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async touch(source: string): Promise<void> {
    await this.redis.set(
      WORKER_CONSUMER_KEY,
      JSON.stringify({ at: Date.now(), source }),
      'EX',
      WORKER_HEARTBEAT_TTL_SECONDS,
    );
  }

  static isFresh(payload: string | null, maxAgeMs: number): boolean {
    if (!payload) return false;
    try {
      const parsed = JSON.parse(payload) as { at?: number };
      if (!parsed.at) return false;
      return Date.now() - parsed.at <= maxAgeMs;
    } catch {
      return false;
    }
  }
}
